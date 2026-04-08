import pg from 'pg'

const { Pool } = pg

export const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host:     process.env.DB_HOST     ?? 'localhost',
        port:     Number(process.env.DB_PORT ?? 5432),
        database: process.env.DB_NAME     ?? 'pipeline',
        user:     process.env.DB_USER     ?? 'postgres',
        password: process.env.DB_PASSWORD ?? '',
      }
)

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      google_id  TEXT UNIQUE NOT NULL,
      email      TEXT,
      name       TEXT,
      avatar     TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company    TEXT NOT NULL,
      role       TEXT NOT NULL,
      salary     TEXT,
      stage      TEXT NOT NULL DEFAULT 'Applied',
      notes      TEXT,
      link       TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}
