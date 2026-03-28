/**
 * Rate limiting middleware configurations.
 * Protects the API from abuse and DDoS.
 */

import rateLimit from 'express-rate-limit'

/**
 * General API rate limiter — 60 requests per minute per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please slow down.',
    code: 'RATE_LIMITED',
  },
  // Use Cloudflare IP if available
  keyGenerator: (req) => {
    return (
      (req.headers['cf-connecting-ip'] as string) ??
      (req.headers['x-real-ip'] as string) ??
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ??
      req.ip ??
      'unknown'
    )
  },
})

/**
 * Strict limiter for the likes endpoint — 3 attempts per 10 minutes per IP.
 * Even if someone bypasses fingerprint, they can't spam the server.
 */
export const likesLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many like attempts. Each person can only assist once.',
    code: 'LIKE_RATE_LIMITED',
  },
  keyGenerator: (req) => {
    return (
      (req.headers['cf-connecting-ip'] as string) ??
      (req.headers['x-real-ip'] as string) ??
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ??
      req.ip ??
      'unknown'
    )
  },
})

/**
 * Donation submission limiter — 5 attempts per 15 minutes per IP
 */
export const donationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many donation attempts.',
    code: 'DONATION_RATE_LIMITED',
  },
})
