import 'dotenv/config';
import pg from 'pg';
if (!process.env.DATABASE_URL) throw new Error('Defina DATABASE_URL no .env');
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n'), rejectUnauthorized: true } : { rejectUnauthorized: true }
});
