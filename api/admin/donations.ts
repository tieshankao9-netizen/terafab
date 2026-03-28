import { requireAdmin } from '../../lib/auth.js'
import { badRequest, json, readJson, serverError } from '../../lib/http.js'
import {
  deleteDonation,
  getAllDonations,
  getConfirmedDonations,
  upsertManualDonation,
} from '../../lib/repository.js'
import { sanitizeText } from '../../lib/helpers.js'

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
