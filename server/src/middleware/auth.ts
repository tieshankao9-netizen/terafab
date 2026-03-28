/**
 * Admin authentication middleware.
 * Simple password-based protection via Authorization header or query param.
 *
 * Usage in routes:
 *   router.get('/admin/...', requireAdmin, handler)
 *
 * Client sends:
 *   Authorization: Bearer <ADMIN_PASSWORD>
 *   or  ?admin_key=<ADMIN_PASSWORD>
 */

import { Request, Response, NextFunction } from 'express'

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

  if (!ADMIN_PASSWORD) {
    res.status(500).json({ error: 'Admin password not configured' })
    return
  }

  // Check Authorization: Bearer <token>
  const authHeader = req.headers['authorization']
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    if (token === ADMIN_PASSWORD) {
      next()
      return
    }
  }

  // Check query param ?admin_key=...
  const queryKey = req.query['admin_key']
  if (typeof queryKey === 'string' && queryKey === ADMIN_PASSWORD) {
    next()
    return
  }

  // Check body field { admin_key: '...' }
  const bodyKey = (req.body as Record<string, unknown>)?.admin_key
  if (typeof bodyKey === 'string' && bodyKey === ADMIN_PASSWORD) {
    next()
    return
  }

  res.status(401).json({ error: 'Unauthorized — invalid admin credentials' })
}
