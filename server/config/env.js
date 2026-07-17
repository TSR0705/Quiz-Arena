import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const requiredEnv = ['PORT', 'NODE_ENV', 'DATABASE_URL', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET', 'FRONTEND_URL', 'CORS_ORIGIN'];

const WEAK_SECRET_VALUES = ['secret', 'dev-secret', 'changeme', 'password', 'your-secret', 'test'];

export function validateEnv() {
  const missing = requiredEnv.filter(name => !process.env[name]);
  if (missing.length > 0) {
    console.error(`CRITICAL CONFIGURATION ERROR: Missing required env variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    // Validate SendGrid API key
    if (!process.env.SENDGRID_API_KEY) {
      console.error('CRITICAL CONFIGURATION ERROR: SENDGRID_API_KEY must be configured in production!');
      process.exit(1);
    }

    // Validate EMAIL_FROM
    if (!process.env.EMAIL_FROM) {
      console.error('CRITICAL CONFIGURATION ERROR: EMAIL_FROM must be configured in production!');
      process.exit(1);
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
