import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { validateEnv } from './config/env.js';
import apiRouter from './routes/api.js';

// 1. Validate environment configuration on startup
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

// 2. Mount helmet security headers
app.use(helmet({
  contentSecurityPolicy: false // Defer to CDN/Vercel or custom config if required to prevent asset loading blocking
}));

// 3. Trust proxy for production reverse proxy support
app.set('trust proxy', 1);

// 4. CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = process.env.NODE_ENV === 'production'
      ? (process.env.CORS_ORIGIN || process.env.FRONTEND_URL)
      : 'http://localhost:5173';
    
    if (!allowed || allowed === origin || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));

// 5. Global Middleware
app.use(express.json());
app.use(cookieParser());

// Request logger for development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// 6. API Router
app.use('/api', apiRouter);

// 7. API 404 Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.originalUrl} not found.`
    }
  });
});

// 8. Global Error Handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    console.error('Unhandled Server Error:', err.message);
  } else {
    console.error('Unhandled Server Error:', err);
  }
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred on the server.'
    }
  });
});

// 9. Start listening
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`QuizArena Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

// 10. Graceful Shutdown
function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      try {
        const db = (await import('./config/db.js')).default;
        await db.destroy();
        console.log('Database connections closed.');
      } catch (e) {
        // ignore
      }
      process.exit(0);
    });
    // Force exit after 10 seconds
    setTimeout(() => process.exit(1), 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, server };
export default app;
