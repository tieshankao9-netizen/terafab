import { json } from '../../lib/http.js'
import { getPublicConfigPayload } from '../../lib/public-config.js'

export async function GET() {
  return json(await getPublicConfigPayload())
}
