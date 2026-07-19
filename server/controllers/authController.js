import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../config/db.js';
import emailService from '../services/emailService.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/'
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  path: '/api/auth/refresh'
};

export async function signup(req, res) {
  const { email, password, displayName } = req.body;

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: { message: 'All fields are required.' } });
  }

  try {
    const existing = await db('users').where({ email: email.toLowerCase() }).first();
    if (existing) {
      return res.status(409).json({ error: { message: 'Email address already registered.' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db('users').insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      display_name: displayName,
      role: 'user'
    }).returning('*');

    await issueTokens(res, user);
    res.status(201).json({ user: { email: user.email, displayName: user.display_name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: { message: 'Registration failed due to a server error.' } });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: { message: 'Email and password are required.' } });
  }

  try {
    const user = await db('users').where({ email: email.toLowerCase() }).first();
    if (!user) {
      return res.status(401).json({ error: { message: 'Invalid email or password.' } });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: { message: 'Invalid email or password.' } });
    }

    await issueTokens(res, user);
    res.status(200).json({ user: { email: user.email, displayName: user.display_name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: { message: 'Login failed due to a server error.' } });
  }
}

export async function logout(req, res) {
  const refreshToken = req.cookies?.refresh_token;

  if (refreshToken) {
    try {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await db('refresh_tokens').where({ token_hash: tokenHash }).update({ is_revoked: true });
    } catch (err) {
      // Ignore token revocation failure on logout
    }
  }

  res.clearCookie('access_token', COOKIE_OPTIONS);
  res.clearCookie('refresh_token', REFRESH_COOKIE_OPTIONS);
  res.status(200).json({ message: 'Logged out successfully.' });
}

export async function guest(req, res) {
  try {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db('guest_sessions').insert({
      token_hash: tokenHash,
      expires_at: expiresAt
    });

    res.cookie('guest_token', rawToken, {
      ...COOKIE_OPTIONS,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(200).json({ message: 'Guest session initialized.' });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to initialize guest session.' } });
  }
}

export async function registerGuest(req, res) {
  const guestToken = req.cookies?.guest_token;
  const { email, password, displayName } = req.body;

  if (!guestToken) {
    return res.status(400).json({ error: { message: 'Active guest session is required.' } });
  }

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: { message: 'All registration fields are required.' } });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(guestToken).digest('hex');

    await db.transaction(async (trx) => {
      const guestSession = await trx('guest_sessions')
        .where({ token_hash: tokenHash })
        .andWhere('expires_at', '>', trx.fn.now())
        .first()
        .forUpdate();

      if (!guestSession) {
        throw new Error('GUEST_SESSION_INVALID');
      }

      const existing = await trx('users').where({ email: email.toLowerCase() }).first();
      if (existing) {
        throw new Error('EMAIL_EXISTS');
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const [user] = await trx('users').insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        display_name: displayName,
        role: 'user'
      }).returning('*');

      // Migrate attempts
      await trx('quiz_attempts')
        .where({ guest_session_id: guestSession.id })
        .update({
          user_id: user.id,
          guest_session_id: null
        });

      // Delete guest session
      await trx('guest_sessions').where({ id: guestSession.id }).del();

      await issueTokens(res, user, trx);
      res.clearCookie('guest_token', COOKIE_OPTIONS);
      res.status(200).json({ user: { email: user.email, displayName: user.display_name, role: user.role } });
    });
  } catch (err) {
    if (err.message === 'GUEST_SESSION_INVALID') {
      res.status(401).json({ error: { message: 'Guest session has expired or is invalid.' } });
    } else if (err.message === 'EMAIL_EXISTS') {
      res.status(409).json({ error: { message: 'Email address already registered.' } });
    } else {
      res.status(500).json({ error: { message: 'Guest registration failed due to a server error.' } });
    }
  }
}

export async function refresh(req, res) {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: { message: 'Refresh token is required.' } });
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  try {
    const tokenRecord = await db.transaction(async (trx) => {
      const record = await trx('refresh_tokens')
        .where({ token_hash: tokenHash })
        .first()
        .forUpdate();

      if (!record || record.expires_at < new Date() || record.is_revoked) {
        if (record && record.is_revoked) {
          // Replay Attack Detected: Revoke all sessions for this user ID
          await trx('refresh_tokens').where({ user_id: record.user_id }).update({ is_revoked: true });
        }
        throw new Error('INVALID_REFRESH');
      }

      // Mark rotated
      await trx('refresh_tokens').where({ id: record.id }).update({ is_revoked: true });

      // Generate new refresh token
      const nextRawToken = crypto.randomBytes(32).toString('hex');
      const nextTokenHash = crypto.createHash('sha256').update(nextRawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await trx('refresh_tokens').insert({
        user_id: record.user_id,
        session_id: record.session_id,
        token_hash: nextTokenHash,
        lineage_version: record.lineage_version + 1,
        expires_at: expiresAt
      });

      const user = await trx('users').where({ id: record.user_id }).first();
      return { user, nextRawToken };
    });

    const accessToken = jwt.sign({ userId: tokenRecord.user.id, role: tokenRecord.user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.cookie('access_token', accessToken, COOKIE_OPTIONS);
    res.cookie('refresh_token', tokenRecord.nextRawToken, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({ message: 'Session refreshed.' });
  } catch (err) {
    res.clearCookie('access_token', COOKIE_OPTIONS);
    res.clearCookie('refresh_token', REFRESH_COOKIE_OPTIONS);
    res.status(401).json({ error: { message: 'Session expired. Please log in again.' } });
  }
}

export async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: { message: 'Email address is required.' } });
  }

  try {
    const user = await db('users').where({ email: email.toLowerCase() }).first();
    
    // Security best practice: do not reveal if the email exists.
    if (!user) {
      return res.status(200).json({ message: 'If the account exists, a password reset link has been generated.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await db('password_resets').insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt
    });

    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${user.email}`;
    await emailService.sendPasswordResetEmail(user.email, resetUrl);

    res.status(200).json({ message: 'If the account exists, a password reset link has been generated.' });
  } catch (err) {
    res.status(500).json({ error: { message: 'Forgot password operation failed due to a server error.' } });
  }
}

export async function resetPassword(req, res) {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: { message: 'Email, token, and new password are required.' } });
  }

  try {
    const user = await db('users').where({ email: email.toLowerCase() }).first();
    if (!user) {
      return res.status(400).json({ error: { message: 'Invalid request parameters.' } });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await db.transaction(async (trx) => {
      const resetRecord = await trx('password_resets')
        .where({ token_hash: tokenHash, user_id: user.id })
        .first()
        .forUpdate();

      if (!resetRecord || resetRecord.is_used || resetRecord.expires_at < new Date()) {
        throw new Error('INVALID_TOKEN');
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await trx('users').where({ id: user.id }).update({ password_hash: passwordHash });

      // Mark reset used
      await trx('password_resets').where({ id: resetRecord.id }).update({ is_used: true });

      // Invalidate other resets
      await trx('password_resets').where({ user_id: user.id }).update({ is_used: true });

      // Revoke refresh tokens (session invalidate)
      await trx('refresh_tokens').where({ user_id: user.id }).update({ is_revoked: true });
    });

    res.clearCookie('access_token', COOKIE_OPTIONS);
    res.clearCookie('refresh_token', REFRESH_COOKIE_OPTIONS);
    res.status(200).json({ message: 'Password reset successfully. Please log in again.' });
  } catch (err) {
    if (err.message === 'INVALID_TOKEN') {
      res.status(400).json({ error: { message: 'Reset token is invalid or has expired.' } });
    } else {
      res.status(500).json({ error: { message: 'Password reset failed due to a server error.' } });
    }
  }
}

// Helper to issue JWT and refresh cookies
async function issueTokens(res, user, trxContext = db) {
  const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const rawRefreshToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const sessionId = crypto.randomUUID();

  await trxContext('refresh_tokens').insert({
    user_id: user.id,
    session_id: sessionId,
    token_hash: tokenHash,
    expires_at: expiresAt
  });

  res.cookie('access_token', accessToken, COOKIE_OPTIONS);
  res.cookie('refresh_token', rawRefreshToken, REFRESH_COOKIE_OPTIONS);
}

export async function me(req, res) {
  if (!req.principal) {
    return res.status(401).json({ error: { message: 'Not authenticated.' } });
  }

  try {
    if (req.principal.userId) {
      const user = await db('users').where({ id: req.principal.userId }).first();
      if (!user) {
        return res.status(404).json({ error: { message: 'User not found.' } });
      }
      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          role: user.role,
          avatarUrl: user.avatar_url,
          totalXp: user.total_xp,
          currentLevel: user.current_level,
          currentStreak: user.current_streak,
          longestStreak: user.longest_streak
        }
      });
    } else if (req.principal.guestSessionId) {
      return res.status(200).json({
        user: {
          role: 'guest',
          guestSessionId: req.principal.guestSessionId
        }
      });
    }

    return res.status(401).json({ error: { message: 'Not authenticated.' } });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to retrieve current user session.' } });
  }
}
