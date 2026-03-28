import { requireCronSecret } from '../../lib/auth'
import { json, serverError } from '../../lib/http'
import {
  confirmDonation,
  getPendingDonations,
} from '../../lib/repository'
import { verifyUsdtTx } from '../../lib/tx-verifier'

export async function GET(request: Request) {
  const authError = requireCronSecret(request)
  if (authError) return authError

  try {
    const pending = await getPendingDonations(20)
    let confirmed = 0

    for (const donation of pending) {
      const result = await verifyUsdtTx(donation.tx_hash, donation.amount)
      if (result.success) {
        await confirmDonation(donation.id)
        confirmed += 1
      }
    }

    return json({
      success: true,
      checked: pending.length,
      confirmed,
    })
  } catch (error) {
    console.error('cron verify donations error:', error)
    return serverError()
  }
}
