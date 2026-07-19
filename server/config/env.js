import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const requiredEnv = ['NODE_ENV', 'DATABASE_URL', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET'];

const WEAK_SECRET_VALUES = ['secret', 'dev-secret', 'changeme', 'password', 'your-secret', 'test'];

export function validateEnv() {
  const missing = requiredEnv.filter(name => !process.env[name]);
  if (missing.length > 0) {
    console.error(`CRITICAL CONFIGURATION ERROR: Missing required env variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    // Validate FRONTEND_URL & CORS_ORIGIN - warn instead of crashing at startup
    if (!process.env.FRONTEND_URL) {
      console.warn('WARNING: FRONTEND_URL is not configured in production. Defaulting reset links to localhost.');
    }
    if (!process.env.CORS_ORIGIN) {
      console.warn('WARNING: CORS_ORIGIN is not configured in production. CORS limits will fallback.');
    }

    // Validate SendGrid API key - warn instead of crashing at startup
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('WARNING: SENDGRID_API_KEY is not configured in production. Email features will throw errors at runtime.');
    }

    // Validate EMAIL_FROM - warn instead of crashing at startup
    if (!process.env.EMAIL_FROM) {
      console.warn('WARNING: EMAIL_FROM is not configured in production. Defaulting to no-reply@quizarena.com');
    }

    // Validate JWT secrets are not weak/default values
    const secretsToValidate = [
      { name: 'JWT_SECRET', value: process.env.JWT_SECRET },
      { name: 'REFRESH_TOKEN_SECRET', value: process.env.REFRESH_TOKEN_SECRET }
    ];

    for (const { name, value } of secretsToValidate) {
      if (value.length < 32) {
        console.error(`CRITICAL CONFIGURATION ERROR: ${name} must be at least 32 characters in production (current length: ${value.length}).`);
        process.exit(1);
      }
      if (WEAK_SECRET_VALUES.includes(value.toLowerCase())) {
        console.error(`CRITICAL CONFIGURATION ERROR: ${name} is set to a weak/default value. Use a strong, random secret in production.`);
        process.exit(1);
      }
    }
  }
}
