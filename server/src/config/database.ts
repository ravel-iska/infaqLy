import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from './env.js';
import * as schema from '../db/schema.js';

let connString = env.DATABASE_URL;
try {
  const urlParams = new URL(connString);
  if (urlParams.searchParams.has('sslmode')) {
    urlParams.searchParams.delete('sslmode');
    connString = urlParams.toString();
  }
} catch (e) {
  // Ignore parse errors, fallback to raw
}

const pool = new pg.Pool({
  connectionString: connString,
  ssl: connString.includes('localhost') || connString.includes('127.0.0.1') ? false : {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });
export { pool };
