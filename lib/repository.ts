import { ensureSchema, getSql } from './db.js'

export interface ConfigMap {
  [key: string]: string
}

export interface AdminCredentials {
  username: string
  password: string
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

export interface VisitorRecord {
  id: number
  visit_date: string
  ip_address: string
  user_agent: string | null
  device_type: string
  country_code: string
  country_name: string
  region: string | null
  city: string | null
  path: string
  referrer: string | null
  hit_count: number
  first_seen_at: string
  last_seen_at: string
}

export interface VisitorDailyStat {
  visit_date: string
  unique_visitors: number
  total_visits: number
}

export interface VisitorCountryStat {
  country_code: string
  country_name: string
  unique_visitors: number
  total_visits: number
}

export interface VisitorAnalyticsOverview {
  todayUniqueVisitors: number
  todayTotalVisits: number
  last7DaysUniqueVisitors: number
  last7DaysTotalVisits: number
  topCountryCode: string
  topCountryName: string
}

export interface VisitorAnalyticsSnapshot {
  overview: VisitorAnalyticsOverview
  daily: VisitorDailyStat[]
  countries: VisitorCountryStat[]
  recent: VisitorRecord[]
}

interface VisitorDailyRow {
  visit_date: string
  unique_visitors: string | number
  total_visits: string | number
}

interface VisitorCountryRow {
  country_code: string
  country_name: string
  unique_visitors: string | number
  total_visits: string | number
}

interface VisitorRecentRow extends Omit<VisitorRecord, 'hit_count'> {
  hit_count: string | number
}

interface VisitorOverviewRow {
  today_unique_visitors: string | number
  today_total_visits: string | number
  last7_days_unique_visitors: string | number
  last7_days_total_visits: string | number
}

function toIsoDate(daysAgo = 0) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - daysAgo)
  return date.toISOString().slice(0, 10)
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

export async function getAdminCredentials(): Promise<AdminCredentials> {
  return {
    username: (await getConfig('admin_username')) ?? (process.env.ADMIN_USERNAME ?? 'admin'),
    password: (await getConfig('admin_password')) ?? (process.env.ADMIN_PASSWORD ?? ''),
  }
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

export async function getDonationById(id: number): Promise<DonationRecord | null> {
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
    WHERE id = ${id}
    LIMIT 1
  ` as Array<DonationRecord & { amount: string; status: number; is_manual: number }>

  const row = rows[0]
  if (!row) return null

  return {
    ...row,
    amount: Number(row.amount),
  }
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

export async function recordVisit(input: {
  visitorKey: string
  ipAddress: string
  userAgent: string
  deviceType: string
  countryCode: string
  countryName: string
  region?: string | null
  city?: string | null
  path: string
  referrer?: string | null
}) {
  await ensureSchema()
  const sql = getSql()

  await sql`
    INSERT INTO visits (
      visitor_key,
      visit_date,
      ip_address,
      user_agent,
      device_type,
      country_code,
      country_name,
      region,
      city,
      path,
      referrer,
      hit_count,
      first_seen_at,
      last_seen_at
    )
    VALUES (
      ${input.visitorKey},
      CURRENT_DATE,
      ${input.ipAddress},
      ${input.userAgent || null},
      ${input.deviceType},
      ${input.countryCode},
      ${input.countryName},
      ${input.region ?? null},
      ${input.city ?? null},
      ${input.path},
      ${input.referrer ?? null},
      1,
      NOW(),
      NOW()
    )
    ON CONFLICT (visitor_key, visit_date)
    DO UPDATE SET
      ip_address = EXCLUDED.ip_address,
      user_agent = COALESCE(EXCLUDED.user_agent, visits.user_agent),
      device_type = EXCLUDED.device_type,
      country_code = CASE
        WHEN visits.country_code = 'ZZ' AND EXCLUDED.country_code <> 'ZZ'
          THEN EXCLUDED.country_code
        ELSE visits.country_code
      END,
      country_name = CASE
        WHEN visits.country_name = 'Unknown' AND EXCLUDED.country_name <> 'Unknown'
          THEN EXCLUDED.country_name
        ELSE visits.country_name
      END,
      region = COALESCE(EXCLUDED.region, visits.region),
      city = COALESCE(EXCLUDED.city, visits.city),
      path = EXCLUDED.path,
      referrer = COALESCE(EXCLUDED.referrer, visits.referrer),
      hit_count = visits.hit_count + 1,
      last_seen_at = NOW()
  `
}

export async function getVisitorAnalytics(
  days = 14,
  recentLimit = 25,
): Promise<VisitorAnalyticsSnapshot> {
  await ensureSchema()
  const sql = getSql()
  const safeDays = Math.min(Math.max(days, 1), 90)
  const recentDaysCutoff = toIsoDate(safeDays - 1)
  const last7DaysCutoff = toIsoDate(6)
  const today = toIsoDate(0)

  const dailyRows = await sql`
    SELECT
      visit_date::text,
      COUNT(*)::int AS unique_visitors,
      COALESCE(SUM(hit_count), 0)::int AS total_visits
    FROM visits
    WHERE visit_date >= ${recentDaysCutoff}
    GROUP BY visit_date
    ORDER BY visit_date ASC
  ` as VisitorDailyRow[]

  const countryRows = await sql`
    SELECT
      country_code,
      country_name,
      COUNT(*)::int AS unique_visitors,
      COALESCE(SUM(hit_count), 0)::int AS total_visits
    FROM visits
    WHERE visit_date >= ${recentDaysCutoff}
    GROUP BY country_code, country_name
    ORDER BY COUNT(*) DESC, COALESCE(SUM(hit_count), 0) DESC, country_name ASC
    LIMIT 20
  ` as VisitorCountryRow[]

  const recentRows = await sql`
    SELECT
      id,
      visit_date::text,
      ip_address,
      user_agent,
      device_type,
      country_code,
      country_name,
      region,
      city,
      path,
      referrer,
      hit_count,
      first_seen_at::text,
      last_seen_at::text
    FROM visits
    ORDER BY last_seen_at DESC
    LIMIT ${recentLimit}
  ` as VisitorRecentRow[]

  const overviewRows = await sql`
    SELECT
      COALESCE(SUM(CASE WHEN visit_date = ${today} THEN 1 ELSE 0 END), 0)::int AS today_unique_visitors,
      COALESCE(SUM(CASE WHEN visit_date = ${today} THEN hit_count ELSE 0 END), 0)::int AS today_total_visits,
      COALESCE(SUM(CASE WHEN visit_date >= ${last7DaysCutoff} THEN 1 ELSE 0 END), 0)::int AS last7_days_unique_visitors,
      COALESCE(SUM(CASE WHEN visit_date >= ${last7DaysCutoff} THEN hit_count ELSE 0 END), 0)::int AS last7_days_total_visits
    FROM visits
  ` as VisitorOverviewRow[]

  const mappedDaily = dailyRows.map((row) => ({
    ...row,
    unique_visitors: Number(row.unique_visitors),
    total_visits: Number(row.total_visits),
  }))

  const mappedCountries = countryRows.map((row) => ({
    ...row,
    unique_visitors: Number(row.unique_visitors),
    total_visits: Number(row.total_visits),
  }))

  const mappedRecent = recentRows.map((row) => ({
    ...row,
    hit_count: Number(row.hit_count),
  }))

  const overviewRow = overviewRows[0]
  const topCountry = mappedCountries[0]

  return {
    overview: {
      todayUniqueVisitors: Number(overviewRow?.today_unique_visitors ?? 0),
      todayTotalVisits: Number(overviewRow?.today_total_visits ?? 0),
      last7DaysUniqueVisitors: Number(overviewRow?.last7_days_unique_visitors ?? 0),
      last7DaysTotalVisits: Number(overviewRow?.last7_days_total_visits ?? 0),
      topCountryCode: topCountry?.country_code ?? 'ZZ',
      topCountryName: topCountry?.country_name ?? 'Unknown',
    },
    daily: mappedDaily,
    countries: mappedCountries,
    recent: mappedRecent,
  }
}
