/**
 * Config Routes (admin-protected)
 *
 * GET  /api/config       → read all config values
 * POST /api/config       → update one or more config values
 */

import { Router, Request, Response } from 'express'
import { db, getConfig, setConfig, getTotalLikes } from '../db/database'
import { requireAdmin } from '../middleware/auth'
import { isValidAddress } from '../utils/helpers'

const router = Router()

// ── GET /api/config ──────────────────────────────────────────────────────────
router.get('/', requireAdmin, (_req: Request, res: Response) => {
  const allConfig = db.prepare('SELECT key, value FROM config ORDER BY key').all() as {
    key: string
    value: string
  }[]

  const config: Record<string, string> = {}
  for (const row of allConfig) {
    config[row.key] = row.value
  }

  res.json({ config })
})

// ── POST /api/config ─────────────────────────────────────────────────────────
router.post('/', requireAdmin, (req: Request, res: Response) => {
  const updates = req.body as Record<string, unknown>

  const allowedKeys = [
    'wallet_address',
    'likes_to_launch',
    'site_name',
    'site_description',
    'total_likes',
    'launch_triggered',
  ]

  const errors: string[] = []
  const applied: string[] = []

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'admin_key') continue  // skip auth field
    if (!allowedKeys.includes(key)) {
      errors.push(`Unknown config key: ${key}`)
      continue
    }
    if (typeof value !== 'string' && typeof value !== 'number') {
      errors.push(`Invalid value type for key: ${key}`)
      continue
    }

    const strValue = String(value).trim()

    // Validate wallet address
    if (key === 'wallet_address' && strValue && !isValidAddress(strValue)) {
      errors.push('wallet_address must be a valid EVM address (0x...)')
      continue
    }

    // Validate numeric fields
    if (['likes_to_launch', 'total_likes'].includes(key)) {
      const num = parseInt(strValue)
      if (isNaN(num) || num < 0) {
        errors.push(`${key} must be a non-negative integer`)
        continue
      }
    }

    setConfig(key, strValue)
    applied.push(key)
  }

  res.json({
    success: errors.length === 0,
    applied,
    errors: errors.length > 0 ? errors : undefined,
  })
})

// ── GET /api/config/public ───────────────────────────────────────────────────
// Public endpoint — only exposes non-sensitive config
router.get('/public', (_req: Request, res: Response) => {
  const total = getTotalLikes()
  const likesToLaunch = parseInt(getConfig('likes_to_launch') ?? '10000', 10)

  res.json({
    siteName: getConfig('site_name') ?? 'Terafab',
    siteDescription: getConfig('site_description') ?? '',
    totalLikes: total,
    likesToLaunch,
    energyPercent: Math.min(100, Math.floor((total / likesToLaunch) * 100)),
    launchTriggered: getConfig('launch_triggered') === '1',
    walletAddress: getConfig('wallet_address') ?? '',
  })
})

export default router
