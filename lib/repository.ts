import { ensureSchema, getSql } from './db.js'

export interface ConfigMap {
  [key: string]: string
}

export interface LikeRecord {
  id: number
  ip_fingerprint: string
  ip_address: string
  user_agent: string | null
  created_at: string
}

export interface DonationRecord {
  id: number
  name: string
  amount: number
  tx_hash: string
  status?: number
  is_manual?: number
  created_at: string
}

export async function getConfig(key: string) {
  await ensureSchema()
  const sql = getSql()
  const rows = await sql`
    SELECT value FROM config WHERE key = ${key}
  ` as Array<{ value: string }>
  return rows[0]?.value ?? null
}

export async function getAllConfig(): Promise<ConfigMap> {
  await ensureSchema()
  const sql = getSql()
  const rows = await sql`
    SELECT key, value
    FROM config
    ORDER BY key ASC
  ` as Array<{ key: string; value: string }>

  return Object.fromEntries(rows.map((row) => [row.key, row.value]))
}

export async function setConfig(key: string, value: string) {
  await ensureSchema()
  const sql = getSql()
  await sql`
    INSERT INTO config (key, value)
    VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `
}

export async function setConfigs(values: ConfigMap) {
  await ensureSchema()
  for (const [key, value] of Object.entries(values)) {
    await setConfig(key, value)
  }
}

export async function getTotalLikes() {
  return Number((await getConfig('total_likes')) ?? '0')
}

export async function getLikesToLaunch() {
  return Number((await getConfig('likes_to_launch')) ?? '10000')
}

export async function hasLaunchTriggered() {
  return (await getConfig('launch_triggered')) === '1'
}

export async function hasVoted(fingerprint: string) {
  await ensureSchema()
  const sql = getSql()
  const rows = await sql`
    SELECT id
    FROM likes
    WHERE ip_fingerprint = ${fingerprint}
    LIMIT 1
  ` as Array<{ id: number }>
  return rows.length > 0
}

export async function createLikeAndIncrement(
  fingerprint: string,
  ip: string,
  userAgent: string,
) {
  await ensureSchema()
  const sql = getSql()

  const [, updatedRows] = await sql.transaction([
    sql`
      INSERT INTO likes (ip_fingerprint, ip_address, user_agent)
      VALUES (${fingerprint}, ${ip}, ${userAgent})
      RETURNING id
    `,
    sql`
      UPDATE config
      SET value = (COALESCE(value, '0')::integer + 1)::text
      WHERE key = 'total_likes'
      RETURNING value
    `,
  ])

  return Number((updatedRows as Array<{ value: string }>)[0]?.value ?? '0')
}

export async function getLikes(limit = 100, offset = 0): Promise<LikeRecord[]> {
  await ensureSchema()
  const sql = getSql()
  const rows = await sql`
    SELECT
      id,
      ip_fingerprint,
      ip_address,
      user_agent,
      created_at::text
    FROM likes
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  ` as LikeRecord[]

  return rows
}

export async function getConfirmedDonations(limit = 50): Promise<DonationRecord[]> {
  await ensureSchema()
  const sql = getSql()
  const rows = await sql`
    SELECT
      id,
      name,
      amount::text,
      tx_hash,
      created_at::text
    FROM donations
    WHERE status = 1
    ORDER BY amount DESC, created_at ASC
    LIMIT ${limit}
  ` as Array<DonationRecord & { amount: string }>

  return rows.map((row) => ({ ...row, amount: Number(row.amount) }))
}

export async function getAllDonations(): Promise<DonationRecord[]> {
  await ensureSchema()
  const sql = getSql()
  const rows = await sql`
    SELECT
      id,
      name,
      amount::text,
      tx_hash,
      status,
      is_manual,
      created_at::text
    FROM donations
    ORDER BY created_at DESC
  ` as Array<DonationRecord & { amount: string; status: number; is_manual: number }>

  return rows.map((row) => ({ ...row, amount: Number(row.amount) }))
}

export async function insertPendingDonation(name: string, amount: number, txHash: string) {
  await ensureSchema()
  const sql = getSql()
  const rows = await sql`
    INSERT INTO donations (name, amount, tx_hash, status, is_manual)
    VALUES (${name}, ${amount}, ${txHash}, 0, 0)
    RETURNING id
  ` as Array<{ id: number }>
  return rows[0]?.id ?? 0
}

export async function confirmDonation(id: number) {
  await ensureSchema()
  const sql = getSql()
  await sql`
    UPDATE donations
    SET status = 1
    WHERE id = ${id}
  `
}

export async function upsertManualDonation(
  name: string,
  amount: number,
  txHash: string,
  id?: number,
) {
  await ensureSchema()
  const sql = getSql()

  if (id) {
    await sql`
      UPDATE donations
      SET
        name = ${name},
        amount = ${amount},
        tx_hash = ${txHash},
        status = 1,
        is_manual = 1
      WHERE id = ${id}
    `
    return
  }

  await sql`
    INSERT INTO donations (name, amount, tx_hash, status, is_manual)
    VALUES (${name}, ${amount}, ${txHash}, 1, 1)
  `
}

export async function deleteDonation(id: number) {
  await ensureSchema()
  const sql = getSql()
  await sql`
    DELETE FROM donations
    WHERE id = ${id}
  `
}

export async function getPendingDonations(limit = 20) {
  await ensureSchema()
  const sql = getSql()
  const rows = await sql`
    SELECT
      id,
      name,
      amount::text,
      tx_hash,
      created_at::text
    FROM donations
    WHERE status = 0
    ORDER BY created_at ASC
    LIMIT ${limit}
  ` as Array<DonationRecord & { amount: string }>

  return rows.map((row) => ({ ...row, amount: Number(row.amount) }))
}
