export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  })
}

export function methodNotAllowed(allowed: string[]) {
  return json(
    { error: `Method not allowed. Use: ${allowed.join(', ')}` },
    405,
    { Allow: allowed.join(', ') },
  )
}

export function unauthorized(message = 'Unauthorized') {
  return json({ error: message }, 401)
}

export function badRequest(message: string) {
  return json({ error: message }, 400)
}

export function serverError(message = 'Internal server error') {
  return json({ error: message }, 500)
}

export async function readJson<T>(request: Request): Promise<T> {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return {} as T
  }

  return request.json() as Promise<T>
}

export function getSearchParam(request: Request, key: string): string | null {
  return new URL(request.url).searchParams.get(key)
}
