import { requireAdmin } from '../../lib/auth.js'
import { badRequest, json, readJson, serverError } from '../../lib/http.js'
import { isValidAddress } from '../../lib/helpers.js'
import { getAllConfig, setConfigs } from '../../lib/repository.js'

const ALLOWED_KEYS = new Set([
  'wallet_address',
  'likes_to_launch',
  'site_name',
  'site_description',
  'total_likes',
  'launch_triggered',
])

const HIDDEN_KEYS = new Set(['admin_username', 'admin_password'])

export async function GET(request: Request) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  const config = await getAllConfig()
  const visibleConfig = Object.fromEntries(
    Object.entries(config).filter(([key]) => !HIDDEN_KEYS.has(key)),
  )

  return json({ config: visibleConfig })
}

export async function POST(request: Request) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const body = await readJson<Record<string, unknown>>(request)
    const errors: string[] = []
    const updates: Record<string, string> = {}

    for (const [key, rawValue] of Object.entries(body)) {
      if (!ALLOWED_KEYS.has(key)) {
        errors.push(`Unknown config key: ${key}`)
        continue
      }

      if (typeof rawValue !== 'string' && typeof rawValue !== 'number') {
        errors.push(`Invalid value type for key: ${key}`)
        continue
      }

      const value = String(rawValue).trim()

      if (key === 'wallet_address' && value && !isValidAddress(value)) {
        errors.push('wallet_address must be a valid EVM address (0x...)')
        continue
      }

      if ((key === 'likes_to_launch' || key === 'total_likes') && !/^\d+$/.test(value)) {
        errors.push(`${key} must be a non-negative integer`)
        continue
      }

      if (key === 'launch_triggered' && !['0', '1'].includes(value)) {
        errors.push('launch_triggered must be 0 or 1')
        continue
      }

      updates[key] = value
    }

    if (errors.length > 0) {
      return json({ success: false, applied: [], errors }, 400)
    }

    if (Object.keys(updates).length === 0) {
      return badRequest('No valid updates provided')
    }

    await setConfigs(updates)
    return json({ success: true, applied: Object.keys(updates) })
  } catch (error) {
    console.error('admin config POST error:', error)
    return serverError()
  }
}
