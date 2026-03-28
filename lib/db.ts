import { neon } from '@neondatabase/serverless'

let schemaPromise: Promise<void> | null = null
let client: ReturnType<typeof neon> | null = null

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured')
  }
  return databaseUrl
}

export function getSql() {
  if (!client) {
    client = neon(getDatabaseUrl())
  }

  return client
}

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = getSql()

      await sql`
        CREATE TABLE IF NOT EXISTS config (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS likes (
          id BIGSERIAL PRIMARY KEY,
          ip_fingerprint TEXT NOT NULL UNIQUE,
          ip_address TEXT NOT NULL,
          user_agent TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS donations (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          amount NUMERIC(20, 8) NOT NULL,
          tx_hash TEXT NOT NULL UNIQUE,
          status SMALLINT NOT NULL DEFAULT 0,
          is_manual SMALLINT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `

      await sql`
        INSERT INTO config (key, value)
        VALUES
          ('total_likes', '0'),
          ('launch_triggered', '0'),
          ('wallet_address', ${process.env.WALLET_ADDRESS ?? ''}),
          ('likes_to_launch', ${process.env.LIKES_TO_LAUNCH ?? '10000'}),
          ('site_name', 'Terafab'),
          ('site_description', '点燃火星征程 · BNB链USDT捐赠'),
          ('admin_username', ${process.env.ADMIN_USERNAME ?? 'admin'}),
          ('admin_password', ${process.env.ADMIN_PASSWORD ?? ''})
        ON CONFLICT (key) DO NOTHING
      `
    })()
  }

  await schemaPromise
}
