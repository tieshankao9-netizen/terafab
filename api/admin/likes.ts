import { requireAdmin } from '../../lib/auth'
import { json, getSearchParam, serverError } from '../../lib/http'
import { getLikes, getTotalLikes } from '../../lib/repository'

export async function GET(request: Request) {
  const authError = requireAdmin(request)
  if (authError) return authError

  try {
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
