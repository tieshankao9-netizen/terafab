import { requireAdmin } from '../../lib/auth.js'
import { json, getSearchParam, serverError } from '../../lib/http.js'
import { getLikes, getTotalLikes, getVisitorAnalytics } from '../../lib/repository.js'

export async function GET(request: Request) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const view = getSearchParam(request, 'view') ?? 'likes'

    if (view === 'visitors') {
      const days = Number(getSearchParam(request, 'days') ?? '14')
      const limit = Number(getSearchParam(request, 'limit') ?? '25')
      return json(await getVisitorAnalytics(days, Math.min(Math.max(limit, 5), 100)))
    }

    const limit = Math.min(Number(getSearchParam(request, 'limit') ?? '100'), 500)
    const offset = Number(getSearchParam(request, 'offset') ?? '0')

    return json({
      records: await getLikes(limit, offset),
      total: await getTotalLikes(),
    })
  } catch (error) {
    console.error('admin likes GET error:', error)
    return serverError()
  }
}
