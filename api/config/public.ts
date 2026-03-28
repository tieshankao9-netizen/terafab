import { json } from '../../lib/http'
import { getPublicConfigPayload } from '../../lib/public-config'

export async function GET() {
  return json(await getPublicConfigPayload())
}
