import crypto from 'node:crypto'

export function sanitizeText(input: string, maxLen = 50): string {
  return input
    .replace(/[<>'"&]/g, (char) => ({
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
      '&': '&amp;',
    }[char] ?? char))
    .trim()
    .slice(0, maxLen)
}

export function isValidTxHash(hash: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(hash)
}

export function isValidAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address)
}

export function buildStableHash(...parts: string[]) {
  const salt = process.env.FINGERPRINT_SALT ?? 'terafab_vercel_salt_2026'
  const hash = crypto.createHash('sha256')

  parts.forEach((part) => {
    hash.update(part)
    hash.update('|')
  })

  hash.update(salt)
  return hash.digest('hex')
}

export function getClientIp(request: Request): string {
  const headers = request.headers
  const cfIp = headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim()
    if (firstIp) return firstIp
  }

  return '0.0.0.0'
}

export function buildFingerprint(ip: string, userAgent: string) {
  return buildStableHash(ip, userAgent)
}
