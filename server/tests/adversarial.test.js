import request from 'supertest';
import app, { server } from '../index.js';
import db from '../config/db.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

describe('QuizArena Adversarial Verification Suite', () => {
  let userCookie1 = null;
  let userCookie2 = null;
  let guestCookie1 = null;
  let guestCookie2 = null;
  let categoryId = null;
  let topicId = null;

  beforeAll(async () => {
    // Clean database before tests
    await db('password_resets').del();
    await db('refresh_tokens').del();
    await db('admin_audit_logs').del();
    await db('question_reports').del();
    await db('certificates').del();
    await db('user_badges').del();
    await db('question_ratings').del();
    await db('attempt_answers').del();
    await db('attempt_questions').del();
    await db('quiz_attempts').del();
    await db('users').del();
    await db('guest_sessions').del();

    // Fetch active category and topic (specifically scheduling slug which has questions seeded)
    const topic = await db('topics').where({ slug: 'scheduling' }).first();
    topicId = topic ? topic.id : null;
    categoryId = topic ? topic.category_id : null;

    console.log("DB_PARAMS:", { categoryId, topicId });

    // Register User 1
    const res1 = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'user1@example.com', password: 'password123', displayName: 'User One' });
    console.log("res1.body:", res1.body, "res1.status:", res1.status);
    userCookie1 = res1.headers['set-cookie']?.find(c => c.includes('access_token='))?.split(';')[0];

    // Register User 2
    const res2 = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'user2@example.com', password: 'password123', displayName: 'User Two' });
    userCookie2 = res2.headers['set-cookie'].find(c => c.includes('access_token=')).split(';')[0];

    // Initialize Guest 1
    const g1 = await request(app).post('/api/auth/guest');
    guestCookie1 = g1.headers['set-cookie'].find(c => c.includes('guest_token=')).split(';')[0];

    // Initialize Guest 2
    const g2 = await request(app).post('/api/auth/guest');
    guestCookie2 = g2.headers['set-cookie'].find(c => c.includes('guest_token=')).split(';')[0];
  });

  afterAll(async () => {
    await db.destroy();
    if (server) {
      server.close();
    }
  });

  // ==========================================
  // 1. FINALIZATION & CONCURRENCY AUDIT
  // ==========================================
  describe('Attempt Finalization Concurrency Race', () => {
    it('should handle concurrent finalization requests idempotently and award XP/badges exactly once', async () => {
      // Create a fresh attempt for User 1
      const attemptRes = await request(app)
        .post('/api/attempts')
        .set('Cookie', userCookie1)
        .send({ categoryId, topicId, difficulty: 'easy', questionCount: 2, quizMode: 'assessment' })
        .expect(201);

      const attemptId = attemptRes.body.attemptId;

      // Fetch user's starting XP
      const startingUser = await db('users').where({ email: 'user1@example.com' }).first();
      const startingXp = startingUser.total_xp;

      // Submit answers
      const qList = await db('attempt_questions').where({ attempt_id: attemptId });
      for (let i = 0; i < qList.length; i++) {
        await request(app)
          .post(`/api/attempts/${attemptId}/index`)
          .set('Cookie', userCookie1)
          .send({ index: i })
          .expect(200);

        const q = qList[i];
        const qSnapshot = q.question_snapshot_json;
        const options = qSnapshot.options_json;
        await request(app)
          .post(`/api/attempts/${attemptId}/answers`)
          .set('Cookie', userCookie1)
          .send({ selectedOptionId: options[0].id })
          .expect(200);
      }

      // Fire concurrent finalization requests
      const promises = [
        request(app).post(`/api/attempts/${attemptId}/submit`).set('Cookie', userCookie1),
        request(app).post(`/api/attempts/${attemptId}/submit`).set('Cookie', userCookie1)
      ];

      const results = await Promise.all(promises);

      // Verify both returned success
      expect(results[0].status).toBe(200);
      expect(results[1].status).toBe(200);

      // Fetch user's final XP
      const endingUser = await db('users').where({ email: 'user1@example.com' }).first();
      const endingXp = endingUser.total_xp;

      const xpEarned0 = results[0].body.results.xpEarned;
      const xpEarned1 = results[1].body.results.xpEarned;

      expect(xpEarned0).toBe(xpEarned1);
      // XP should only be added once!
      expect(endingXp - startingXp).toBe(xpEarned0);

      // Verify badge count
      const badgeCount = await db('user_badges').where({ user_id: endingUser.id }).count('id as count').first();
      // Even under race, badge cannot be awarded twice due to UNIQUE constraint and onConflict().ignore()
      expect(parseInt(badgeCount.count)).toBeLessThanOrEqual(5); 
    });
  });

  // ==========================================
  // 2. AUTHORIZATION / IDOR AUDIT
  // ==========================================
  describe('IDOR / Authorization Constraints', () => {
    let user1AttemptId = null;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/attempts')
        .set('Cookie', userCookie1)
        .send({ categoryId, topicId, difficulty: 'easy', questionCount: 1, quizMode: 'assessment' });
      user1AttemptId = res.body.attemptId;
    });

    it('should deny User 2 access to read User 1\'s attempt', async () => {
      await request(app)
        .get(`/api/attempts/${user1AttemptId}`)
        .set('Cookie', userCookie2)
        .expect(403);
    });

    it('should deny User 2 access to mutate User 1\'s attempt answers', async () => {
      await request(app)
        .post(`/api/attempts/${user1AttemptId}/answers`)
        .set('Cookie', userCookie2)
        .send({ selectedOptionId: 'opt_1' })
        .expect(403);
    });

    it('should deny User 2 access to submit User 1\'s attempt', async () => {
      await request(app)
        .post(`/api/attempts/${user1AttemptId}/submit`)
        .set('Cookie', userCookie2)
        .expect(403);
    });

    it('should deny User 2 access to use lifelines on User 1\'s attempt', async () => {
      await request(app)
        .post(`/api/attempts/${user1AttemptId}/lifelines/hint`)
        .set('Cookie', userCookie2)
        .expect(403);
    });

    it('should deny Guest 2 access to read Guest 1\'s attempt', async () => {
      const gAttempt = await request(app)
        .post('/api/attempts')
        .set('Cookie', guestCookie1)
        .send({ categoryId, topicId, difficulty: 'easy', questionCount: 1, quizMode: 'assessment' });
      
      await request(app)
        .get(`/api/attempts/${gAttempt.body.attemptId}`)
        .set('Cookie', guestCookie2)
        .expect(403);
    });
  });

  // ==========================================
  // 3. QUESTION SNAPSHOT & ANSWER LEAKAGE AUDIT
  // ==========================================
  describe('Question Snapshot & Answer Leakage Constraints', () => {
    it('should never expose correctOptionId/correctOptionIds/correct_answer_json/explanation in active DTO responses', async () => {
      const res = await request(app)
        .post('/api/attempts')
        .set('Cookie', userCookie1)
        .send({ categoryId, topicId, difficulty: 'easy', questionCount: 1, quizMode: 'assessment' });
      
      const currentQuestion = res.body.currentQuestion;

      // Recursive scan for forbidden answer/scoring keys
      const forbiddenKeys = ['correctOptionId', 'correctOptionIds', 'correct_answer_json', 'explanation', 'correctAnswer'];
      
      const checkLeakage = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        for (const key in obj) {
          expect(forbiddenKeys.includes(key)).toBe(false);
          if (typeof obj[key] === 'object') {
            checkLeakage(obj[key]);
          }
        }
      };

      checkLeakage(currentQuestion);
    });
  });

  // ==========================================
  // 4. AUTH & SESSION SECURITY AUDIT
  // ==========================================
  describe('Auth & Session Security Constraints', () => {
    it('should enforce single-use reset tokens and reject expired or reused tokens', async () => {
      // 1. Create password reset request
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'user1@example.com' })
        .expect(200);

      // Fetch the token hash from database
      const resetRecord = await db('password_resets').where({ is_used: false }).first();
      expect(resetRecord).toBeDefined();

      // We need raw token (not hashed). Since we don't have it, let's simulate by creating a known raw token and hash
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      
      await db('password_resets').insert({
        user_id: resetRecord.user_id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 60 * 1000), // 1 minute from now
        is_used: false
      });

      // Reset password using raw token
      await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'user1@example.com', token: rawToken, newPassword: 'newPassword123' })
        .expect(200);

      // Try to reuse the same token
      await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'user1@example.com', token: rawToken, newPassword: 'anotherPassword123' })
        .expect(400); // Reused token must be rejected!

      // Try with an expired token
      const expiredRawToken = crypto.randomBytes(32).toString('hex');
      const expiredTokenHash = crypto.createHash('sha256').update(expiredRawToken).digest('hex');
      
      await db('password_resets').insert({
        user_id: resetRecord.user_id,
        token_hash: expiredTokenHash,
        expires_at: new Date(Date.now() - 60 * 1000), // 1 minute in the past
        is_used: false
      });

      await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'user1@example.com', token: expiredRawToken, newPassword: 'newPassword123' })
        .expect(400); // Expired token must be rejected!
    });
  });

  // ==========================================
  // 5. CERTIFICATE AUDIT
  // ==========================================
  describe('Certificates Constraints & Verification Rate Limits', () => {
    let perfectAttemptId = null;

    beforeAll(async () => {
      // Create a perfect 100% attempt of 5 questions
      const attemptRes = await request(app)
        .post('/api/attempts')
        .set('Cookie', userCookie2)
        .send({ categoryId, topicId, difficulty: 'easy', questionCount: 5, quizMode: 'assessment' });
      perfectAttemptId = attemptRes.body.attemptId;

      const qList = await db('attempt_questions').where({ attempt_id: perfectAttemptId });
      
      // Submit all correct answers
      for (let i = 0; i < qList.length; i++) {
        await request(app)
          .post(`/api/attempts/${perfectAttemptId}/index`)
          .set('Cookie', userCookie2)
          .send({ index: i })
          .expect(200);

        const q = qList[i];
        const qSnapshot = typeof q.question_snapshot_json === 'string'
          ? JSON.parse(q.question_snapshot_json)
          : q.question_snapshot_json;
        const correctAnswers = Array.isArray(qSnapshot.correct_answer_json)
          ? qSnapshot.correct_answer_json
          : JSON.parse(qSnapshot.correct_answer_json || '[]');
        
        await request(app)
          .post(`/api/attempts/${perfectAttemptId}/answers`)
          .set('Cookie', userCookie2)
          .send({ selectedOptionId: correctAnswers[0] })
          .expect(200);
      }

      const submitRes = await request(app)
        .post(`/api/attempts/${perfectAttemptId}/submit`)
        .set('Cookie', userCookie2)
        .expect(200);
      console.log("SUBMIT_RESULT:", submitRes.body);
    });

    it('should generate a certificate idempotently and reject concurrent duplication', async () => {
      // Fire concurrent requests
      const promises = [
        request(app).post('/api/certificates').set('Cookie', userCookie2).send({ attemptId: perfectAttemptId }),
        request(app).post('/api/certificates').set('Cookie', userCookie2).send({ attemptId: perfectAttemptId })
      ];

      const results = await Promise.all(promises);
      console.log("CERT_RESULT_0:", results[0].status, results[0].body);
      console.log("CERT_RESULT_1:", results[1].status, results[1].body);
      expect(results[0].status).toBe(201);
      expect(results[1].status).toBe(201);
      expect(results[0].body.verificationCode).toBe(results[1].body.verificationCode);

      // Verify DB row count
      const rows = await db('certificates').where({ attempt_id: perfectAttemptId });
      expect(rows.length).toBe(1);
    });

    it('should trigger rate limiting (429) on public verification endpoint after exceeding limits', async () => {
      const cert = await db('certificates').where({ attempt_id: perfectAttemptId }).first();
      const code = cert.verification_code;

      // Toggle NODE_ENV to trigger rate limiting logic
      process.env.NODE_ENV = 'production';

      // Rate limiting: configured for 10 requests/minute. Send 12 requests.
      const promises = [];
      for (let i = 0; i < 12; i++) {
        promises.push(request(app).get(`/api/certificates/verify/${code}`));
      }

      const results = await Promise.all(promises);
      
      // Restore NODE_ENV
      process.env.NODE_ENV = 'test';

      const statuses = results.map(r => r.status);
      expect(statuses).toContain(429); // Must contain at least one 429 status code
    });
  });
});
