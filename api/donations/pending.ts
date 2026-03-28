import { badRequest, json, readJson, serverError } from '../../lib/http.js'
import { isValidTxHash, sanitizeText } from '../../lib/helpers.js'
import {
  confirmDonation,
  getConfirmedDonations,
  insertPendingDonation,
} from '../../lib/repository.js'
import { verifyUsdtTx } from '../../lib/tx-verifier.js'

export async function POST(request: Request) {
  try {
    const body = await readJson<{ name?: string; amount?: number; tx_hash?: string }>(request)
    const name = sanitizeText(String(body.name ?? ''), 30)
    const amount = Number(body.amount ?? 0)
    const txHash = String(body.tx_hash ?? '').trim().toLowerCase()

    if (!name) return badRequest('Name is required')
    if (!amount || amount <= 0 || amount > 1_000_000) return badRequest('Invalid amount')
    if (!isValidTxHash(txHash)) return badRequest('Invalid tx hash format')

    const id = await insertPendingDonation(name, amount, txHash)
    const verification = await verifyUsdtTx(txHash, amount)

    if (verification.success) {
      await confirmDonation(id)
      return json({
        success: true,
        id,
        confirmed: true,
        donations: await getConfirmedDonations(50),
        message: '链上验证成功，已进入光荣榜 🏆',
      })
    }

    return json({
      success: true,
      id,
      confirmed: false,
      message: verification.errorMsg ?? '交易已记录，等待后续确认',
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return json({ error: 'Transaction already submitted' }, 409)
    }
    console.error('donation pending error:', error)
    return serverError()
  }
}
