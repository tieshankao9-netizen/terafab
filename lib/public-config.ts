import { getConfig, getLikesToLaunch, getTotalLikes, hasLaunchTriggered } from './repository.js'

export async function getPublicConfigPayload() {
  const totalLikes = await getTotalLikes()
  const likesToLaunch = await getLikesToLaunch()
  const launchTriggered = await hasLaunchTriggered()
  const energyPercent = Math.min(100, Math.floor((totalLikes / likesToLaunch) * 100))

  return {
    siteName: (await getConfig('site_name')) ?? 'Terafab',
    siteDescription:
      (await getConfig('site_description')) ??
      'Interactive fan mission on BNB Chain with supporter board, entertainment-first launch play, and future NFT or community airdrop experiments for verified supporters.',
    totalLikes,
    likesToLaunch,
    energyPercent,
    launchTriggered,
    walletAddress: (await getConfig('wallet_address')) ?? '',
  }
}
