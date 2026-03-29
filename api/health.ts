import { json, readJson, serverError } from '../lib/http.js'
import { recordVisit } from '../lib/repository.js'
import { getVisitContext } from '../lib/visitor-analytics.js'

export function GET() {
  return json({
    status: 'ok',
    runtime: 'vercel-functions',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{
      path?: string
      referrer?: string
      fingerprint?: string
    }>(request)

    const context = getVisitContext(request, body)
    await recordVisit(context)

    return json({ success: true })
  } catch (error) {
    console.error('health POST visitor tracking error:', error)
    return serverError()
  }
}
