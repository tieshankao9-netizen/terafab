import { json } from '../../lib/http.js'
import { getLikesToLaunch, getTotalLikes, hasLaunchTriggered } from '../../lib/repository.js'

export async function GET() {
  const total = await getTotalLikes()
  const likesToLaunch = await getLikesToLaunch()
  const launchTriggered = await hasLaunchTriggered()
  const energyPercent = Math.min(100, Math.floor((total / likesToLaunch) * 100))

  return json({
    total,
    energyPercent,
    launchTriggered,
    likesToLaunch,
  })
}
