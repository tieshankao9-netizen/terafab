/**
 * Utility functions for IP detection and fingerprint generation
 */

import { Request } from 'express'
import crypto from 'crypto'

/**
 * Extract the real client IP address from request headers.
 * Priority: Cloudflare > X-Real-IP > X-Forwarded-For > socket remote address
 */
export function getClientIP(req: Request): string {
  // Cloudflare sets this header with the real visitor IP
  const cfIP = req.headers['cf-connecting-ip']
  if (cfIP && typeof cfIP === 'string') return cfIP.trim()

  // Some reverse proxies use X-Real-IP
  const realIP = req.headers['x-real-ip']
  if (realIP && typeof realIP === 'string') return realIP.trim()

  // Standard forwarded-for (may contain multiple IPs; first = client)
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]
    const ip = first.trim()
    if (ip) return ip
  }

  // Fallback to direct connection
  return req.socket.remoteAddress ?? '0.0.0.0'
}

/**
 * Build a unique fingerprint for anti-duplicate-vote.
 * Combines: IP address + User-Agent + a shared salt.
 * This makes it harder to bypass just by changing one variable.
 */
export function buildFingerprint(ip: string, userAgent: string): string {
  // Use a fixed salt so fingerprints are consistent across restarts
  // but different from other sites
  const SALT = 'terafab_ignition_salt_2025'
  const raw = `${ip}|${userAgent}|${SALT}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/**
 * Check if the given string looks like a valid IPv4 or IPv6 address.
 */
export function isValidIP(ip: string): boolean {
  // Simple check — not exhaustive but catches obvious junk
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6 = /^[0-9a-fA-F:]+$/
  return ipv4.test(ip) || ipv6.test(ip)
}

/**
 * Sanitize user-provided text to prevent XSS.
 * Strips HTML tags and limits length.
 */
export function sanitizeText(input: string, maxLen = 50): string {
  return input
    .replace(/[<>'"&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;', '&': '&amp;' }[c] ?? c))
    .trim()
    .slice(0, maxLen)
}

/**
 * Validate a BNB chain transaction hash format.
 */
export function isValidTxHash(hash: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(hash)
}

/**
 * Validate a BNB chain wallet address format.
 */
export function isValidAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address)
}

/**
 * Format a number with locale-appropriate thousands separators.
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}
