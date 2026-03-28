import { json } from '../../lib/http.js'
import { getConfirmedDonations } from '../../lib/repository.js'

export async function GET() {
  return json({ donations: await getConfirmedDonations(50) })
}
