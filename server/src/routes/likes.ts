/**
 * Likes Routes
 *
 * GET  /api/likes/total   → { total: number, launchTriggered: boolean }
 * POST /api/likes         → { success: boolean, newTotal?: number, message: string }
 */

import { Router, Request, Response } from 'express'
import {
  getTotalLikes,
  hasVoted,
  recordLike,
  incrementTotalLikes,
  getConfig,
  setConfig,
  getLikes,
} from '../db/database'
import { getClientIP, buildFingerprint, sanitizeText } from '../utils/helpers'
import { likesLimiter } from '../middleware/rateLimiter'
import { requireAdmin } from '../middleware/auth'
import { getIO } from '../socket'

const router = Router()

// ── GET /api/likes/total ─────────────────────────────────────────────────────
router.get('/total', (_req: Request, res: Response) => {
  const total = getTotalLikes()
  const likesToLaunch = parseInt(getConfig('likes_to_launch') ?? '10000', 10)
  const launchTriggered = getConfig('launch_triggered') === '1'
  const energyPercent = Math.min(100, Math.floor((total / likesToLaunch) * 100))

  res.json({
    total,
    energyPercent,
    launchTriggered,
    likesToLaunch,
  })
})

// ── POST /api/likes ──────────────────────────────────────────────────────────
router.post('/', likesLimiter, (req: Request, res: Response) => {
  // 1. Extract IP and user agent
  const ip = getClientIP(req)
  const userAgent = sanitizeText(req.headers['user-agent'] ?? 'unknown', 200)

  // 2. Build fingerprint (IP + UA hash)
  //    Optionally accept a browser fingerprint from the client body for extra uniqueness
  const clientFingerprint = (req.body as Record<string, unknown>)?.fingerprint
  const fingerprintBase = typeof clientFingerprint === 'string' && clientFingerprint.length > 0
    ? `${ip}|${clientFingerprint}`
    : ip
  const fingerprint = buildFingerprint(fingerprintBase, userAgent)

  // 3. Check if already voted
  if (hasVoted(fingerprint)) {
    const total = getTotalLikes()
    const likesToLaunch = parseInt(getConfig('likes_to_launch') ?? '10000', 10)
    const energyPercent = Math.min(100, Math.floor((total / likesToLaunch) * 100))
    const launchTriggered = getConfig('launch_triggered') === '1'
    return res.status(200).json({
      success: false,
      alreadyVoted: true,
      total,
      energyPercent,
      launchTriggered,
      message: '每个地球人只能助力一次！你的支持已被记录 🚀',
    })
  }

  // 4. Record the like
  try {
    recordLike(fingerprint, ip, userAgent)
  } catch (err) {
    // Race condition: another request with same fingerprint slipped in
    const total = getTotalLikes()
    const likesToLaunch = parseInt(getConfig('likes_to_launch') ?? '10000', 10)
    return res.status(200).json({
      success: false,
      alreadyVoted: true,
      total,
      energyPercent: Math.min(100, Math.floor((total / likesToLaunch) * 100)),
      launchTriggered: getConfig('launch_triggered') === '1',
      message: '你已经助力过了！',
    })
  }

  // 5. Increment total (atomic via transaction)
  const newTotal = incrementTotalLikes()
  const likesToLaunch = parseInt(getConfig('likes_to_launch') ?? '10000', 10)
  const energyPercent = Math.min(100, Math.floor((newTotal / likesToLaunch) * 100))

  // 6. Check if launch should be triggered
  const wasLaunched = getConfig('launch_triggered') === '1'
  if (energyPercent >= 100 && !wasLaunched) {
    setConfig('launch_triggered', '1')
    // Broadcast launch event to all connected clients
    getIO().emit('LAUNCH_TRIGGERED', { total: newTotal, energyPercent: 100 })
  }

  // 7. Broadcast updated total to all clients via Socket.io
  getIO().emit('LIKES_UPDATED', {
    total: newTotal,
    energyPercent,
    launchTriggered: energyPercent >= 100,
  })

  return res.json({
    success: true,
    newTotal,
    energyPercent,
    launchTriggered: energyPercent >= 100,
    message: `点火能量 +1%！飞船蓄势待发！当前能量：${energyPercent}% 🚀`,
  })
})

// ── GET /api/likes/list (admin) ──────────────────────────────────────────────
router.get('/list', requireAdmin, (req: Request, res: Response) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? '100')), 500)
  const offset = parseInt(String(req.query.offset ?? '0'))
  const records = getLikes(limit, offset)
  res.json({ records, total: getTotalLikes() })
})

export default router
