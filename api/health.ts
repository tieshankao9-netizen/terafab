import { json } from '../lib/http.js'

export function GET() {
  return json({
    status: 'ok',
    runtime: 'vercel-functions',
    timestamp: new Date().toISOString(),
  })
}
