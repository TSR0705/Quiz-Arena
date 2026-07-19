import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../config/db.js';

export async function authenticate(req, res, next) {
  const accessToken = req.cookies?.access_token;
  const guestToken = req.cookies?.guest_token;

  // 1. Try User Authenticated JWT Session
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      
      // Fetch user role from DB to verify role hasn't changed
      const user = await db('users').where({ id: decoded.userId }).first();
      if (user) {
        req.principal = {
          type: 'user',
          userId: user.id,
          role: user.role // 'user' or 'admin'
        };
        return next();
      }
    } catch (err) {
      // JWT is expired or invalid. Fallback to guest check or return error
    }
  }

  // 2. Try Guest Token Session
  if (guestToken) {
    try {
      const tokenHash = crypto.createHash('sha256').update(guestToken).digest('hex');
      const guestSession = await db('guest_sessions')
        .where({ token_hash: tokenHash })
        .andWhere('expires_at', '>', db.fn.now())
        .first();

      if (guestSession) {
        req.principal = {
          type: 'guest',
          guestSessionId: guestSession.id
        };
        return next();
      }
    } catch (err) {
      // Guest token verification failed
    }
  }

  // If neither valid user nor guest session token is present, block unauthenticated requests
  return res.status(401).json({
    error: {
      code: 'UNAUTHENTICATED',
      message: 'Authentication required. Please sign in or start a guest session.'
    }
  });
}

export function requireUser(req, res, next) {
  if (!req.principal || req.principal.type !== 'user') {
    return res.status(401).json({
      error: {
        code: 'USER_REQUIRED',
        message: 'This operation requires a registered user account.'
      }
    });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.principal || req.principal.type !== 'user' || req.principal.role !== 'admin') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied. Administrator privileges required.'
      }
    });
  }
  next();
}
