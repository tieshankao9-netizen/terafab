import { buildFingerprint, buildStableHash, getClientIp, sanitizeText } from './helpers.js'

const UNKNOWN_COUNTRY_CODE = 'ZZ'
const UNKNOWN_COUNTRY_NAME = 'Unknown'

function normalizeCountryCode(value: string | null) {
  const code = String(value ?? '')
    .trim()
    .toUpperCase()

  return /^[A-Z]{2}$/.test(code) ? code : UNKNOWN_COUNTRY_CODE
}

function getCountryName(countryCode: string) {
  if (countryCode === UNKNOWN_COUNTRY_CODE) {
    return UNKNOWN_COUNTRY_NAME
  }

  try {
    return (
      new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) ??
      UNKNOWN_COUNTRY_NAME
    )
  } catch {
    return UNKNOWN_COUNTRY_NAME
  }
}

function cleanOptionalText(value: string | null, maxLen = 120) {
  const cleaned = sanitizeText(String(value ?? ''), maxLen)
  return cleaned || null
}

export function inferDeviceType(userAgent: string) {
  const ua = userAgent.toLowerCase()

  if (!ua) return 'Unknown'
  if (/(bot|spider|crawl|slurp|facebookexternalhit|monitoring)/.test(ua)) return 'Bot'
  if (/(ipad|tablet|playbook|silk)|(android(?!.*mobile))/.test(ua)) return 'Tablet'
  if (/(mobi|iphone|ipod|android.*mobile|windows phone)/.test(ua)) return 'Mobile'
  return 'Desktop'
}

export function getVisitContext(
  request: Request,
  input: {
    path?: string
    referrer?: string
    fingerprint?: string
  },
) {
  const headers = request.headers
  const ipAddress = getClientIp(request)
  const userAgent = headers.get('user-agent')?.trim() ?? ''
  const countryCode = normalizeCountryCode(
    headers.get('x-vercel-ip-country') ?? headers.get('cf-ipcountry'),
  )
  const countryName = getCountryName(countryCode)
  const region = cleanOptionalText(headers.get('x-vercel-ip-country-region'))
  const city = cleanOptionalText(headers.get('x-vercel-ip-city'))
  const path = sanitizeText(String(input.path ?? '/'), 180) || '/'
  const referrer = cleanOptionalText(input.referrer ?? headers.get('referer'), 240)
  const fingerprint = sanitizeText(String(input.fingerprint ?? ''), 120)
  const visitorKey = fingerprint
    ? buildStableHash(fingerprint)
    : buildFingerprint(ipAddress, userAgent || 'unknown')

  return {
    visitorKey,
    ipAddress,
    userAgent,
    deviceType: inferDeviceType(userAgent),
    countryCode,
    countryName,
    region,
    city,
    path: path.startsWith('/') ? path : `/${path}`,
    referrer,
  }
}
