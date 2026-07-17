import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const user = process.env.POSTGRES_USER || 'postgres';
const password = process.env.POSTGRES_PASSWORD || '';
const host = process.env.POSTGRES_HOST || 'localhost';
const port = process.env.POSTGRES_PORT || '5432';

const url = `postgres://${user}:${password}@${host}:${port}/postgres`;

async function createDatabases() {
  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    console.log('Connected to PG successfully.');

    // 1. Create quizarena if not exists
    const res1 = await client.query("SELECT 1 FROM pg_database WHERE datname='quizarena'");
    if (res1.rows.length === 0) {
      await client.query('CREATE DATABASE quizarena');
      console.log('Database "quizarena" created.');
    } else {
      console.log('Database "quizarena" already exists.');
    }

    // 2. Create quizarena_test if not exists
    const res2 = await client.query("SELECT 1 FROM pg_database WHERE datname='quizarena_test'");
    if (res2.rows.length === 0) {
      await client.query('CREATE DATABASE quizarena_test');
      console.log('Database "quizarena_test" created.');
    } else {
      console.log('Database "quizarena_test" already exists.');
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed to create databases:', err.message);
    process.exit(1);
  }
}

createDatabases();
