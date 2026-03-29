import { requireAdmin } from '../../lib/auth.js'
import { getSearchParam, json, serverError } from '../../lib/http.js'
import { getVisitorAnalytics } from '../../lib/repository.js'

export async function GET(request: Request) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const days = Number(getSearchParam(request, 'days') ?? '14')
    const limit = Number(getSearchParam(request, 'limit') ?? '25')

    return json(await getVisitorAnalytics(days, Math.min(Math.max(limit, 5), 100)))
  } catch (error) {
    console.error('admin visitors GET error:', error)
    return serverError()
  }
}
