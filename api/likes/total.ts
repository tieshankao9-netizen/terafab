import { json } from '../../lib/http'
import { getLikesToLaunch, getTotalLikes, hasLaunchTriggered } from '../../lib/repository'

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
