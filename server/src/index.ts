/**
 * Terafab Server — Main Entry Point
 *
 * Express + Socket.io + SQLite backend for the SpaceX-style launch game
 */

import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables before anything else
dotenv.config()

import { initDatabase } from './db/database'
import { initSocket } from './socket'
import { generalLimiter } from './middleware/rateLimiter'

// Route handlers
import likesRouter from './routes/likes'
import donationsRouter from './routes/donations'
import configRouter from './routes/config'

// ── Bootstrap ────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3001', 10)
const configuredOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const NODE_ENV = process.env.NODE_ENV ?? 'development'
const frontendDistPath = path.resolve(__dirname, '../../dist')

// Initialize SQLite database (creates tables + seeds default data)
initDatabase()

// ── Express App ──────────────────────────────────────────────────────────────
const app = express()
const server = http.createServer(app)

// Initialize Socket.io
initSocket(server)

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Allow embedding in frontend
    contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
  })
)

// CORS — allow frontend origin
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin, configured frontend URL, and localhost variants
      const allowed = [
        ...configuredOrigins,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ]
      if (!origin || allowed.includes(origin)) {
        callback(null, true)
      } else if (NODE_ENV === 'development') {
        // Permissive in dev
        callback(null, true)
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Body parsing
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: false, limit: '10kb' }))

// Trust proxy headers (for Cloudflare / Vercel / Railway deployments)
app.set('trust proxy', 1)

// General rate limiter on all routes
app.use('/api', generalLimiter)

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'terafab-server',
    version: '1.0.0',
    env: NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/likes', likesRouter)
app.use('/api/donations', donationsRouter)
app.use('/api/config', configRouter)

// ── Static Frontend (production / preview deploys) ──────────────────────────
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath))

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      next()
      return
    }

    res.sendFile(path.join(frontendDistPath, 'index.html'))
  })
}

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err.message)
  res.status(500).json({
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
})

// ── Start Server ──────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('')
  console.log('🚀 ─────────────────────────────────────────')
  console.log(`🚀  TERAFAB SERVER — ONLINE`)
  console.log(`🚀  http://localhost:${PORT}`)
  console.log(`🚀  ENV: ${NODE_ENV}`)
  console.log(`🚀  CORS origins: ${configuredOrigins.join(', ')}`)
  if (fs.existsSync(frontendDistPath)) {
    console.log(`🚀  Frontend dist detected: ${frontendDistPath}`)
  }
  console.log('🚀 ─────────────────────────────────────────')
  console.log('')
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received — shutting down gracefully')
  server.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received — shutting down gracefully')
  server.close(() => process.exit(0))
})

export { app, server }
