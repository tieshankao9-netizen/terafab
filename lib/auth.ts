import { unauthorized } from './http'

export function requireAdmin(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return unauthorized('Admin password not configured')
  }

  const authHeader = request.headers.get('authorization')
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
