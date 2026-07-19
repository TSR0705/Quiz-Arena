import crypto from 'crypto';
import db from '../config/db.js';

export async function generateCertificate(req, res) {
  const { attemptId } = req.body;

  if (!attemptId) {
    return res.status(400).json({ error: { message: 'attemptId is required.' } });
  }

  const principal = req.principal;
  if (principal.type !== 'user') {
    return res.status(401).json({ error: { message: 'Only registered users can generate certificates.' } });
  }

  try {
    const attempt = await db('quiz_attempts').where({ id: attemptId }).first();

    if (!attempt) {
      return res.status(404).json({ error: { message: 'Quiz attempt not found.' } });
    }

    if (attempt.user_id !== principal.userId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }

    if (attempt.status !== 'submitted') {
      return res.status(400).json({ error: { message: 'Attempt is not finalized.' } });
    }

    // Requirements: 100% score on a quiz with >= 5 questions
    if (attempt.question_count < 5 || parseFloat(attempt.percentage) < 100.00) {
      return res.status(400).json({
        error: {
          code: 'CERTIFICATE_INELIGIBLE',
          message: 'Certificate requires a perfect 100% score on a quiz with at least 5 questions.'
        }
      });
    }

    // Transactional & idempotent generation (Patch 5)
    const certificate = await db.transaction(async (trx) => {
      const existing = await trx('certificates').where({ attempt_id: attemptId }).first();
      if (existing) {
        return existing;
      }

      // Generate cryptographically secure verification code
      const code = crypto.randomBytes(32).toString('base64url');

      const [newCert] = await trx('certificates').insert({
        attempt_id: attemptId,
        user_id: principal.userId,
        verification_code: code
      }).onConflict('attempt_id').ignore().returning('*');

      if (!newCert) {
        return await trx('certificates').where({ attempt_id: attemptId }).first();
      }

      return newCert;
    });

    res.status(201).json({
      certificateId: certificate.id,
      verificationCode: certificate.verification_code,
      createdAt: certificate.created_at
    });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to generate certificate.' } });
  }
}

export async function verifyCertificate(req, res) {
  const { code } = req.params;

  if (!code) {
    return res.status(400).json({ error: { message: 'Verification code is required.' } });
  }

  try {
    const cert = await db('certificates').where({ verification_code: code }).first();
    if (!cert) {
      return res.status(404).json({
        valid: false,
        error: { message: 'Certificate verification code not found.' }
      });
    }

    const attempt = await db('quiz_attempts').where({ id: cert.attempt_id }).first();
    const user = await db('users').where({ id: cert.user_id }).first();
    const topic = await db('topics').where({ id: attempt.topic_id }).first();
    const category = await db('categories').where({ id: attempt.category_id }).first();

    res.status(200).json({
      valid: true,
      certificate: {
        id: cert.id,
        verificationCode: cert.verification_code,
        issuedTo: user.display_name,
        categoryName: category.name,
        topicName: topic.name,
        score: attempt.total_score,
        maxScore: attempt.max_score,
        percentage: attempt.percentage,
        completedAt: attempt.submitted_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: { message: 'Certificate verification failed.' } });
  }
}

export async function getUserCertificates(req, res) {
  const userId = req.principal.userId;

  try {
    const certs = await db('certificates')
      .join('quiz_attempts', 'certificates.attempt_id', 'quiz_attempts.id')
      .join('topics', 'quiz_attempts.topic_id', 'topics.id')
      .join('categories', 'quiz_attempts.category_id', 'categories.id')
      .where('certificates.user_id', userId)
      .select(
        'certificates.id as certificateId',
        'certificates.verification_code as verificationCode',
        'certificates.created_at as issuedAt',
        'topics.name as topicName',
        'categories.name as categoryName',
        'quiz_attempts.total_score as score',
        'quiz_attempts.max_score as maxScore',
        'quiz_attempts.percentage'
      )
      .orderBy('certificates.created_at', 'desc');

    res.status(200).json(certs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { message: 'Failed to load user certificates.' } });
  }
}
