/**
 * Donations Routes — Stage 4
 * POST /pending now uses real BscScan verification.
 */

import { Router, Request, Response } from 'express'
import {
  getConfirmedDonations,
  getAllDonations,
  insertDonation,
  confirmDonation,
  upsertManualDonation,
  deleteDonation,
} from '../db/database'
import { sanitizeText, isValidTxHash } from '../utils/helpers'
import { donationLimiter } from '../middleware/rateLimiter'
import { requireAdmin } from '../middleware/auth'
import { verifyUsdtTx } from '../utils/txVerifier'
import { getIO } from '../socket'

const router = Router()

// ── GET /api/donations ───────────────────────────────────────────────────────
router.get('/', (_req: Request, res: Response) => {
  const donations = getConfirmedDonations(50)
  res.json({ donations })
})

// ── POST /api/donations/pending ──────────────────────────────────────────────
router.post('/pending', donationLimiter, async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>
  const name = sanitizeText(String(body.name ?? ''), 30)
  const amount = parseFloat(String(body.amount ?? '0'))
  const txHash = String(body.tx_hash ?? '').trim().toLowerCase()

  // Validation
  if (!name || name.length < 1) return res.status(400).json({ error: 'Name is required' })
  if (!amount || amount <= 0 || amount > 1_000_000) return res.status(400).json({ error: 'Invalid amount' })
  if (!isValidTxHash(txHash)) return res.status(400).json({ error: 'Invalid tx hash format' })

  try {
    const id = insertDonation(name, amount, txHash)

    if (process.env.NODE_ENV === 'development' && !process.env.BSCSCAN_API_KEY?.startsWith('your')) {
      // Dev mode with no real API key: auto-confirm immediately
      setTimeout(() => {
        try {
          confirmDonation(id)
          const donations = getConfirmedDonations(50)
          getIO().emit('LEADERBOARD_UPDATED', { donations })
        } catch { /* already confirmed */ }
      }, 2000)

      return res.json({
        success: true, id,
        message: '⚡ 开发模式：2秒后自动上榜！',
      })
    }

    // Production: verify via BscScan asynchronously
    res.json({
      success: true, id,
      message: '交易已提交，验证中... 约需30秒自动上榜 🏆',
    })

    // Run verification in background (don't block response)
    setImmediate(async () => {
      try {
        // Wait a bit for the tx to be indexed by BscScan
        await sleep(8000)

        const result = await verifyUsdtTx(txHash, amount)
        if (result.success) {
          confirmDonation(id)
          const donations = getConfirmedDonations(50)
          getIO().emit('LEADERBOARD_UPDATED', { donations })
          console.log(`✅ Donation confirmed: ${name} — ${result.confirmedAmount} USDT (tx: ${txHash})`)
        } else {
          console.warn(`❌ Donation verification failed: ${result.errorMsg} (tx: ${txHash})`)
          // Optionally notify user via socket (would need socket per-user rooms)
        }
      } catch (err) {
        console.error('Verification error:', err)
      }
    })

  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Transaction already submitted' })
    }
    console.error('Donation insert error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/donations/all (admin) ───────────────────────────────────────────
router.get('/all', requireAdmin, (_req: Request, res: Response) => {
  res.json({ donations: getAllDonations() })
})

// ── POST /api/donations/manual (admin) ────────────────────────────────────────
router.post('/manual', requireAdmin, (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>
  const name = sanitizeText(String(body.name ?? ''), 30)
  const amount = parseFloat(String(body.amount ?? '0'))
  const txHash = String(body.tx_hash ?? `manual_${Date.now()}`).trim()

  if (!name || amount <= 0) return res.status(400).json({ error: 'Name and valid amount required' })

  upsertManualDonation(name, amount, txHash)
  const donations = getConfirmedDonations(50)
  getIO().emit('LEADERBOARD_UPDATED', { donations })
  return res.json({ success: true, message: 'Manual donation added' })
})

// ── PUT /api/donations/:id (admin) ────────────────────────────────────────────
router.put('/:id', requireAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const body = req.body as Record<string, unknown>
  const name = sanitizeText(String(body.name ?? ''), 30)
  const amount = parseFloat(String(body.amount ?? '0'))
  const txHash = String(body.tx_hash ?? `manual_${Date.now()}`).trim()

  if (!id || !name || amount <= 0) return res.status(400).json({ error: 'Invalid data' })

  upsertManualDonation(name, amount, txHash, id)
  const donations = getConfirmedDonations(50)
  getIO().emit('LEADERBOARD_UPDATED', { donations })
  return res.json({ success: true })
})

// ── DELETE /api/donations/:id (admin) ─────────────────────────────────────────
router.delete('/:id', requireAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid id' })

  deleteDonation(id)
  const donations = getConfirmedDonations(50)
  getIO().emit('LEADERBOARD_UPDATED', { donations })
  return res.json({ success: true })
})

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default router
