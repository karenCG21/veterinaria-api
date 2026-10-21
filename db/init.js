import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {
  host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 5433),
  user: process.env.POSTGRES_USER || 'postgres', password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB || 'veterinaria',
});

try {
  await pool.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
  await pool.query(await readFile(new URL('./seed.sql', import.meta.url), 'utf8'));
  console.log('Esquema y datos iniciales listos.');
} finally {
  await pool.end();
}
