import request from 'supertest';
import app, { server } from '../index.js';
import db from '../config/db.js';

beforeAll(async () => {
  // Clear transactional table data
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
});

afterAll(async () => {
  await db.destroy();
  if (server) {
    server.close();
  }
});

describe('QuizArena Integration API Suite', () => {
  let userCookie = null;
  let guestCookie = null;
  let categoryId = null;
  let topicId = null;
  let attemptId = null;
  let questionId = null;
  let attemptQuestionId = null;

  describe('Catalog & Configuration Checks', () => {
    it('should retrieve active categories with their nested topics', async () => {
      const res = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      
      // Find a category and topic that has questions (like 'scheduling' topic)
      let found = false;
      for (const cat of res.body) {
        const topic = cat.topics.find(t => t.slug === 'scheduling' || t.slug === 'sql-queries');
        if (topic) {
          categoryId = cat.id;
          topicId = topic.id;
          found = true;
          break;
        }
      }
      
      if (!found) {
        categoryId = res.body[0].id;
        topicId = res.body[0].topics[0].id;
      }
    });

    it('should retrieve published question count for a topic', async () => {
      const res = await request(app)
        .get(`/api/questions/count?topicId=${topicId}&difficulty=easy`)
        .expect(200);

      expect(res.body).toHaveProperty('count');
      expect(res.body.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Guest Authentication Flow', () => {
    it('should initialize a guest session cookie', async () => {
      const res = await request(app)
        .post('/api/auth/guest')
        .expect(200);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const guestCookieMatch = cookies.find(c => c.includes('guest_token='));
      expect(guestCookieMatch).toBeDefined();
      guestCookie = guestCookieMatch.split(';')[0];
    });
  });

  describe('User Authentication Flow', () => {
    it('should sign up a new user and return user cookies', async () => {
      const signupData = {
        email: 'testuser@example.com',
        password: 'securePassword123',
        displayName: 'Test Student'
      };

      const res = await request(app)
        .post('/api/auth/signup')
        .send(signupData)
        .expect(201);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('testuser@example.com');
      
      const cookies = res.headers['set-cookie'];
      const accessCookieMatch = cookies.find(c => c.includes('access_token='));
      expect(accessCookieMatch).toBeDefined();
      userCookie = accessCookieMatch.split(';')[0];
    });

    it('should login an existing user', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'securePassword123'
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(res.body.user).toBeDefined();
      
      const cookies = res.headers['set-cookie'];
      const accessCookieMatch = cookies.find(c => c.includes('access_token='));
      expect(accessCookieMatch).toBeDefined();
      userCookie = accessCookieMatch.split(';')[0];
    });

    it('should retrieve the current logged-in user profile details', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', userCookie)
        .expect(200);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('testuser@example.com');
      expect(res.body.user.displayName).toBe('Test Student');
    });

    it('should deny profile access when not authenticated', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });
  });

  describe('Quiz Attempt Engine', () => {
    it('should fail starting quiz if questions pool is insufficient', async () => {
      await request(app)
        .post('/api/attempts')
        .set('Cookie', userCookie)
        .send({
          categoryId,
          topicId,
          difficulty: 'hard', // Should have less than 50 questions seeded
          questionCount: 50,
          quizMode: 'assessment'
        })
        .expect(400);
    });

    it('should successfully create an Assessment Mode attempt', async () => {
      const res = await request(app)
        .post('/api/attempts')
        .set('Cookie', userCookie)
        .send({
          categoryId,
          topicId,
          difficulty: 'easy',
          questionCount: 2,
          quizMode: 'assessment'
        })
        .expect(201);

      expect(res.body).toHaveProperty('attemptId');
      expect(res.body.quizMode).toBe('assessment');
      expect(res.body.currentQuestion).toBeDefined();
      
      attemptId = res.body.attemptId;
      attemptQuestionId = res.body.currentQuestion.attemptQuestionId;
      // Get the real question ID from snapshot to test reports later
      const aq = await db('attempt_questions').where({ id: attemptQuestionId }).first();
      questionId = aq.question_id;
    });

    it('should retrieve the in-progress attempt state', async () => {
      const res = await request(app)
        .get(`/api/attempts/${attemptId}`)
        .set('Cookie', userCookie)
        .expect(200);

      expect(res.body.attemptId).toBe(attemptId);
      expect(res.body.status).toBe('in_progress');
    });

    it('should save drafts in Assessment Mode without grading immediately', async () => {
      const answerData = {
        selectedOptionId: 'opt_1'
      };

      await request(app)
        .post(`/api/attempts/${attemptId}/answers`)
        .set('Cookie', userCookie)
        .send(answerData)
        .expect(200);

      // Verify that the answer was saved but points are not graded yet (points_awarded = null)
      const answer = await db('attempt_answers').where({ attempt_question_id: attemptQuestionId }).first();
      expect(answer.selected_option_id).toBe('opt_1');
      expect(answer.points_awarded).toBeNull();
    });

    it('should execute 50/50 lifeline', async () => {
      const res = await request(app)
        .post(`/api/attempts/${attemptId}/lifelines/fifty-fifty`)
        .set('Cookie', userCookie)
        .expect(200);

      expect(res.body).toHaveProperty('eliminatedOptionIds');
      expect(res.body.eliminatedOptionIds.length).toBe(2);
    });

    it('should execute hint lifeline', async () => {
      const res = await request(app)
        .post(`/api/attempts/${attemptId}/lifelines/hint`)
        .set('Cookie', userCookie)
        .expect(200);

      expect(res.body).toHaveProperty('hintText');
    });

    it('should submit the assessment quiz and final grade it', async () => {
      const res = await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set('Cookie', userCookie)
        .expect(200);

      expect(res.body.results.status).toBe('submitted');
      expect(res.body.results.totalScore).toBeDefined();
    });

    it('should return 409 Conflict if attempting to get results for an unsubmitted attempt', async () => {
      // Create a fresh draft first
      const draftRes = await request(app)
        .post('/api/attempts')
        .set('Cookie', userCookie)
        .send({
          categoryId,
          topicId,
          difficulty: 'easy',
          questionCount: 1,
          quizMode: 'assessment'
        })
        .expect(201);

      await request(app)
        .get(`/api/attempts/${draftRes.body.attemptId}/results`)
        .set('Cookie', userCookie)
        .expect(409);
    });
  });

  describe('Feedback & Ratings', () => {
    it('should rate a question', async () => {
      await request(app)
        .post('/api/feedback/rate')
        .set('Cookie', userCookie)
        .send({
          attemptQuestionId,
          rating: 'helpful'
        })
        .expect(200);
    });

    it('should submit a question issue report', async () => {
      await request(app)
        .post('/api/feedback/report')
        .set('Cookie', userCookie)
        .send({
          questionId,
          attemptId,
          reportType: 'typo',
          message: 'The question contains a minor typo.'
        })
        .expect(201);
    });

    it('should submit a contact message successfully', async () => {
      await request(app)
        .post('/api/contact')
        .send({
          name: 'Anonymous User',
          email: 'contact@example.com',
          message: 'Hello, this is a test contact message!'
        })
        .expect(201);
    });

    it('should subscribe an email to the newsletter successfully', async () => {
      await request(app)
        .post('/api/newsletter/subscribe')
        .send({
          email: 'news@example.com'
        })
        .expect(200);
    });
  });

  describe('User Dashboard API', () => {
    it('should retrieve user dashboard stats', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Cookie', userCookie)
        .expect(200);

      expect(res.body).toHaveProperty('profile');
      expect(res.body).toHaveProperty('stats');
      expect(res.body).toHaveProperty('recentAttempts');
      expect(res.body).toHaveProperty('badges');
      expect(res.body).toHaveProperty('weakTopics');
    });

    it('should deny access to guest users', async () => {
      await request(app)
        .get('/api/dashboard')
        .set('Cookie', guestCookie)
        .expect(401);
    });
  });
});
