import { requireAdmin } from '../../lib/auth.js'
import { badRequest, json, readJson, serverError } from '../../lib/http.js'
import {
  confirmDonation,
  deleteDonation,
  getAllDonations,
  getConfirmedDonations,
  getDonationById,
  upsertManualDonation,
} from '../../lib/repository.js'
import { sanitizeText } from '../../lib/helpers.js'
import { verifyUsdtTx } from '../../lib/tx-verifier.js'

export async function GET(request: Request) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    return json({ donations: await getAllDonations() })
  } catch (error) {
    console.error('admin donations GET error:', error)
    return serverError()
  }
}

export async function POST(request: Request) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await readJson<{ name?: string; amount?: number; tx_hash?: string }>(request)
    const name = sanitizeText(String(body.name ?? ''), 30)
    const amount = Number(body.amount ?? 0)
    const txHash = String(body.tx_hash ?? `manual_${Date.now()}`).trim()

    if (!name || amount <= 0) {
      return badRequest('Name and valid amount required')
    }

    await upsertManualDonation(name, amount, txHash)
    return json({
      success: true,
      donations: await getConfirmedDonations(50),
      message: 'Manual donation added',
    })
  } catch (error) {
    console.error('admin donations POST error:', error)
    return serverError()
  }
}

export async function PUT(request: Request) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await readJson<{ id?: number; name?: string; amount?: number; tx_hash?: string }>(request)
    const id = Number(body.id ?? 0)
    const name = sanitizeText(String(body.name ?? ''), 30)
    const amount = Number(body.amount ?? 0)
    const txHash = String(body.tx_hash ?? `manual_${Date.now()}`).trim()

    if (!id || !name || amount <= 0) {
      return badRequest('Invalid data')
    }

    await upsertManualDonation(name, amount, txHash, id)
    return json({
      success: true,
      donations: await getConfirmedDonations(50),
    })
  } catch (error) {
    console.error('admin donations PUT error:', error)
    return serverError()
  }
}

export async function PATCH(request: Request) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await readJson<{ id?: number; action?: string }>(request)
    const id = Number(body.id ?? 0)
    const action = String(body.action ?? 'verify').trim()

    if (!id) {
      return badRequest('Invalid id')
    }

    if (action !== 'verify') {
      return badRequest('Unsupported action')
    }

    const donation = await getDonationById(id)
    if (!donation) {
      return badRequest('Donation not found')
    }

    if (donation.status === 1) {
      return json({
        success: true,
        confirmed: true,
        message: 'Donation already confirmed',
        donations: await getConfirmedDonations(50),
      })
    }

    if (donation.is_manual === 1 || donation.tx_hash.startsWith('manual')) {
      return badRequest('Manual donations cannot be re-verified on chain')
    }

    const verification = await verifyUsdtTx(donation.tx_hash, donation.amount)

    if (verification.success) {
      await confirmDonation(donation.id)
      return json({
        success: true,
        confirmed: true,
        message: 'On-chain verification succeeded. The donation is now live on the supporter board.',
        donations: await getConfirmedDonations(50),
      })
    }

    return json({
      success: false,
      confirmed: false,
      message: verification.errorMsg ?? 'Verification not confirmed yet',
      donations: await getConfirmedDonations(50),
    })
  } catch (error) {
    console.error('admin donations PATCH error:', error)
    return serverError()
  }
}

export async function DELETE(request: Request) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await readJson<{ id?: number }>(request)
    const id = Number(body.id ?? 0)
    if (!id) {
      return badRequest('Invalid id')
    }

    await deleteDonation(id)
    return json({
      success: true,
      donations: await getConfirmedDonations(50),
    })
  } catch (error) {
    console.error('admin donations DELETE error:', error)
    return serverError()
  }
}
