import express from 'express';
import db from '../config/db.js';
import * as auth from '../controllers/authController.js';
import * as catalog from '../controllers/catalogController.js';
import * as attempt from '../controllers/attemptController.js';
import * as certificate from '../controllers/certificateController.js';
import * as feedback from '../controllers/feedbackController.js';
import * as leaderboard from '../controllers/leaderboardController.js';
import * as admin from '../controllers/adminController.js';
import * as user from '../controllers/userController.js';
import { authenticate, requireUser, requireAdmin } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ==========================================
// HEALTH & READINESS ENDPOINTS
// ==========================================
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/ready', async (req, res) => {
  try {
    await db.raw('SELECT 1');
    res.status(200).json({ status: 'ready', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'not_ready', database: 'disconnected' });
  }
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
router.post('/auth/signup', rateLimiter(15, 15 * 60 * 1000), auth.signup);
router.post('/auth/login', rateLimiter(15, 15 * 60 * 1000), auth.login);
router.post('/auth/logout', auth.logout);
router.post('/auth/guest', auth.guest);
router.post('/auth/register-guest', auth.registerGuest);
router.post('/auth/refresh', auth.refresh);
router.post('/auth/forgot-password', rateLimiter(5, 15 * 60 * 1000), auth.forgotPassword);
router.post('/auth/reset-password', rateLimiter(5, 15 * 60 * 1000), auth.resetPassword);
router.get('/auth/me', authenticate, auth.me);

// ==========================================
// USER DASHBOARD ROUTES
// ==========================================
router.get('/dashboard', authenticate, requireUser, user.getUserDashboard);
router.put('/users/profile', authenticate, requireUser, user.updateUserProfile);
router.get('/users/calendar-activity', authenticate, requireUser, user.getUserCalendarActivity);

// ==========================================
// CATALOG ROUTES
// ==========================================
router.get('/categories', catalog.getCategories);
router.get('/questions/count', catalog.getQuestionCount);

// ==========================================
// QUIZ ATTEMPT ROUTES
// ==========================================
router.post('/attempts', authenticate, attempt.createAttempt);
router.get('/attempts/:id', authenticate, attempt.getAttempt);
router.get('/attempts/:id/results', authenticate, attempt.getAttemptResults);
router.post('/attempts/:id/answers', authenticate, attempt.saveAnswer);
router.post('/attempts/:id/index', authenticate, attempt.updateIndex); // Jump position in Assessment Mode (FR-044)
router.post('/attempts/:id/submit', authenticate, attempt.submitAttempt);
router.post('/attempts/:id/lifelines/hint', authenticate, attempt.useLifelineHint);
router.post('/attempts/:id/lifelines/fifty-fifty', authenticate, attempt.useLifelineFiftyFifty);

// ==========================================
// CERTIFICATE ROUTES
// ==========================================
router.post('/certificates', authenticate, requireUser, certificate.generateCertificate);
router.get('/certificates', authenticate, requireUser, certificate.getUserCertificates);
router.get('/certificates/verify/:code', rateLimiter(10, 60 * 1000), certificate.verifyCertificate); // Abuse rate limiting (Patch 6)

// ==========================================
// FEEDBACK & RATINGS ROUTES
// ==========================================
router.post('/feedback/rate', authenticate, feedback.rateQuestion);
router.post('/feedback/report', authenticate, feedback.reportQuestion);
router.post('/contact', feedback.submitContactMessage);
router.post('/newsletter/subscribe', feedback.subscribeNewsletter);

// ==========================================
// LEADERBOARD ROUTES
// ==========================================
router.get('/leaderboard', leaderboard.getLeaderboard);

// ==========================================
// ADMINISTRATOR ROUTES
// ==========================================
router.post('/admin/questions', authenticate, requireAdmin, admin.createQuestion);
router.put('/admin/questions/:id', authenticate, requireAdmin, admin.updateQuestion);
router.delete('/admin/questions/:id', authenticate, requireAdmin, admin.deleteQuestion);
router.get('/admin/reports', authenticate, requireAdmin, admin.getReports);
router.post('/admin/reports/:id/resolve', authenticate, requireAdmin, admin.resolveReport);
router.get('/admin/audit-logs', authenticate, requireAdmin, admin.getAuditLogs);

export default router;
