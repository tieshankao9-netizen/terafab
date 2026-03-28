import { json } from '../../lib/http'
import { getConfirmedDonations } from '../../lib/repository'

export async function GET() {
  return json({ donations: await getConfirmedDonations(50) })
}
