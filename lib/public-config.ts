import { getConfig, getLikesToLaunch, getTotalLikes, hasLaunchTriggered } from './repository.js'

export async function getPublicConfigPayload() {
  const totalLikes = await getTotalLikes()
  const likesToLaunch = await getLikesToLaunch()
  const launchTriggered = await hasLaunchTriggered()
  const energyPercent = Math.min(100, Math.floor((totalLikes / likesToLaunch) * 100))

  return {
    siteName: (await getConfig('site_name')) ?? 'Terafab',
    siteDescription: (await getConfig('site_description')) ?? '',
    totalLikes,
    likesToLaunch,
    energyPercent,
    launchTriggered,
    walletAddress: (await getConfig('wallet_address')) ?? '',
  }
}
