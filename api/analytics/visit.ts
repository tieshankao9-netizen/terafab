import { json, readJson, serverError } from '../../lib/http.js'
import { recordVisit } from '../../lib/repository.js'
import { getVisitContext } from '../../lib/visitor-analytics.js'

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
    console.error('analytics visit POST error:', error)
    return serverError()
  }
}
