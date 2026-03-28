import { unauthorized } from './http.js'
import { getAdminCredentials } from './repository.js'

function parseBasicAuthorization(authHeader: string) {
  if (!authHeader.startsWith('Basic ')) {
    return null
  }

  try {
    const decoded = Buffer.from(authHeader.slice(6).trim(), 'base64').toString('utf8')
    const separatorIndex = decoded.indexOf(':')

    if (separatorIndex === -1) {
      return null
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    }
  } catch {
    return null
  }
}

export async function requireAdmin(request: Request) {
  const authHeader = request.headers.get('authorization')?.trim() ?? ''
  const { username: adminUsername, password: adminPassword } = await getAdminCredentials()

  if (!adminPassword) {
    return unauthorized('Admin credentials not configured')
  }

  const basicAuth = parseBasicAuthorization(authHeader)
  if (
    basicAuth &&
    basicAuth.username === adminUsername &&
    basicAuth.password === adminPassword
  ) {
    return null
  }

  if (authHeader === `Bearer ${adminPassword}`) {
    return null
  }

  return unauthorized('Unauthorized — invalid admin credentials')
}

export function requireCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return unauthorized('CRON_SECRET not configured')
  }

  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return unauthorized('Unauthorized cron request')
  }

  return null
}
