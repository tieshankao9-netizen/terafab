import { requireAdmin } from '../../lib/auth.js'
import { badRequest, json, readJson, serverError } from '../../lib/http.js'
import { getAdminCredentials, setConfigs } from '../../lib/repository.js'

function normalizeUsername(value: string) {
  return value.trim().slice(0, 32)
}

function normalizePassword(value: string) {
  return value.replace(/[\r\n]/g, '').trim()
}

function isValidUsername(value: string) {
  return value.length >= 3 && value.length <= 32 && !/[\s:]/u.test(value)
}

export async function GET(request: Request) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const credentials = await getAdminCredentials()
    return json({
      username: credentials.username || 'admin',
      passwordConfigured: Boolean(credentials.password),
    })
  } catch (error) {
    console.error('admin credentials GET error:', error)
    return serverError()
  }
}

export async function POST(request: Request) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const currentCredentials = await getAdminCredentials()
    const body = await readJson<{ username?: string; password?: string }>(request)

    const username = normalizeUsername(body.username ?? currentCredentials.username ?? 'admin')
    const password = normalizePassword(body.password ?? '')

    if (!isValidUsername(username)) {
      return badRequest('Username must be 3-32 characters and cannot contain spaces or :')
    }

    if (password && password.length < 8) {
      return badRequest('Password must be at least 8 characters')
    }

    const updates: Record<string, string> = {
      admin_username: username,
    }

    if (password) {
      updates.admin_password = password
    }

    const usernameChanged = username !== currentCredentials.username
    const passwordChanged = Boolean(password)

    if (!usernameChanged && !passwordChanged) {
      return badRequest('No credential changes provided')
    }

    await setConfigs(updates)

    return json({
      success: true,
      username,
      passwordUpdated: passwordChanged,
    })
  } catch (error) {
    console.error('admin credentials POST error:', error)
    return serverError()
  }
}
