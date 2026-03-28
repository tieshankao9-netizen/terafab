/**
 * Database initialization & schema
 * Uses better-sqlite3 (sync SQLite, perfect for single-process Node)
 * Designed to swap to PostgreSQL via pg driver in production
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const DB_PATH = process.env.DB_PATH ?? './data/terafab.db'
const DB_DIR = path.dirname(path.resolve(DB_PATH))

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

// Open (or create) the database file
export const db: Database.Database = new Database(path.resolve(DB_PATH))

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

/**
 * Initialize all tables + default config values
 */
export function initDatabase(): void {
  // ── config table (key-value store) ──────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  // ── likes table ─────────────────────────────────────────────────
  // ip_fingerprint: combination of IP + browser fingerprint
  db.exec(`
    CREATE TABLE IF NOT EXISTS likes (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_fingerprint  TEXT    NOT NULL UNIQUE,
      ip_address      TEXT    NOT NULL,
      user_agent      TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // ── donations table ──────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS donations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      amount      REAL    NOT NULL,
      tx_hash     TEXT    NOT NULL UNIQUE,
      status      INTEGER NOT NULL DEFAULT 0,  -- 0=pending, 1=confirmed
      is_manual   INTEGER NOT NULL DEFAULT 0,  -- 1=manually added by admin
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // ── Seed default config values (ignore if already exist) ────────
  const insertConfig = db.prepare(`
    INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)
  `)

  const seedConfigs: [string, string][] = [
    ['total_likes', '0'],
    ['launch_triggered', '0'],         // 0 = not yet launched
    ['wallet_address', process.env.WALLET_ADDRESS ?? ''],
    ['likes_to_launch', process.env.LIKES_TO_LAUNCH ?? '10000'],
    ['site_name', 'Terafab'],
    ['site_description', '点燃火星征程 · BNB链USDT捐赠'],
  ]

  for (const [key, value] of seedConfigs) {
    insertConfig.run(key, value)
  }

  const likeRow = db.prepare('SELECT COUNT(*) as count FROM likes').get() as { count: number }
  const existingTotalLikes = getConfig('total_likes')

  if (likeRow.count === 0 && existingTotalLikes === '3721') {
    setConfig('total_likes', '0')
    setConfig('launch_triggered', '0')
  }

  console.log('✅ Database initialized at', path.resolve(DB_PATH))
}

// ── Typed query helpers ──────────────────────────────────────────────────────

/** Get a config value by key */
export function getConfig(key: string): string | null {
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key) as
    | { value: string }
    | undefined
  return row?.value ?? null
}

/** Set a config value by key */
export function setConfig(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run(key, value)
}

/** Get total likes count (reads from config cache for speed) */
export function getTotalLikes(): number {
  return parseInt(getConfig('total_likes') ?? '0', 10)
}

/** Increment total likes atomically */
export function incrementTotalLikes(): number {
  // Use a transaction for atomicity
  const tx = db.transaction(() => {
    const current = getTotalLikes()
    const newTotal = current + 1
    setConfig('total_likes', String(newTotal))
    return newTotal
  })
  return tx() as number
}

/** Check if a fingerprint has already voted */
export function hasVoted(fingerprint: string): boolean {
  const row = db.prepare('SELECT id FROM likes WHERE ip_fingerprint = ?').get(fingerprint)
  return !!row
}

/** Record a new like */
export function recordLike(fingerprint: string, ip: string, userAgent: string): void {
  db.prepare(`
    INSERT INTO likes (ip_fingerprint, ip_address, user_agent)
    VALUES (?, ?, ?)
  `).run(fingerprint, ip, userAgent)
}

/** Get like records for admin */
export function getLikes(limit = 100, offset = 0) {
  return db.prepare(`
    SELECT id, ip_fingerprint, ip_address, user_agent, created_at
    FROM likes
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset)
}

/** Get confirmed donations (leaderboard) */
export function getConfirmedDonations(limit = 50) {
  return db.prepare(`
    SELECT id, name, amount, tx_hash, created_at
    FROM donations
    WHERE status = 1
    ORDER BY amount DESC, created_at ASC
    LIMIT ?
  `).all(limit)
}

/** Get all donations for admin */
export function getAllDonations() {
  return db.prepare(`
    SELECT id, name, amount, tx_hash, status, is_manual, created_at
    FROM donations
    ORDER BY created_at DESC
  `).all()
}

/** Insert a pending donation */
export function insertDonation(name: string, amount: number, txHash: string): number {
  const result = db.prepare(`
    INSERT INTO donations (name, amount, tx_hash, status, is_manual)
    VALUES (?, ?, ?, 0, 0)
  `).run(name, amount, txHash)
  return result.lastInsertRowid as number
}

/** Confirm a donation (after tx verification) */
export function confirmDonation(id: number): void {
  db.prepare('UPDATE donations SET status = 1 WHERE id = ?').run(id)
}

/** Manually add/edit a donation (admin) */
export function upsertManualDonation(
  name: string,
  amount: number,
  txHash: string,
  id?: number
): void {
  if (id) {
    db.prepare(`
      UPDATE donations
      SET name = ?, amount = ?, tx_hash = ?, status = 1, is_manual = 1
      WHERE id = ?
    `).run(name, amount, txHash, id)
  } else {
    db.prepare(`
      INSERT INTO donations (name, amount, tx_hash, status, is_manual)
      VALUES (?, ?, ?, 1, 1)
    `).run(name, amount, txHash)
  }
}

/** Delete a donation (admin) */
export function deleteDonation(id: number): void {
  db.prepare('DELETE FROM donations WHERE id = ?').run(id)
}
