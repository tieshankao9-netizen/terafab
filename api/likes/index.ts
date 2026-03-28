import { badRequest, json, readJson, serverError } from '../../lib/http.js'
import { buildFingerprint, getClientIp, sanitizeText } from '../../lib/helpers.js'
import {
  createLikeAndIncrement,
  getLikesToLaunch,
  getTotalLikes,
  getConfig,
  hasLaunchTriggered,
  hasVoted,
  setConfig,
} from '../../lib/repository.js'

export async function POST(request: Request) {
  try {
    const body = await readJson<{ fingerprint?: string }>(request)
    const ip = getClientIp(request)
    const userAgent = sanitizeText(request.headers.get('user-agent') ?? 'unknown', 200)
    const fingerprintBase = body.fingerprint?.trim() ? `${ip}|${body.fingerprint.trim()}` : ip
    const fingerprint = buildFingerprint(fingerprintBase, userAgent)

    if (await hasVoted(fingerprint)) {
      const total = await getTotalLikes()
      const likesToLaunch = await getLikesToLaunch()
      return json({
        success: false,
        alreadyVoted: true,
        total,
        energyPercent: Math.min(100, Math.floor((total / likesToLaunch) * 100)),
        launchTriggered: await hasLaunchTriggered(),
        message: '每个地球人只能助力一次！你的支持已被记录 🚀',
      })
    }

    let newTotal = 0
    try {
      newTotal = await createLikeAndIncrement(fingerprint, ip, userAgent)
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        const total = await getTotalLikes()
        const likesToLaunch = await getLikesToLaunch()
        return json({
          success: false,
          alreadyVoted: true,
          total,
          energyPercent: Math.min(100, Math.floor((total / likesToLaunch) * 100)),
          launchTriggered: await hasLaunchTriggered(),
          message: '你已经助力过了！',
        })
      }
      throw error
    }

    const likesToLaunch = await getLikesToLaunch()
    const energyPercent = Math.min(100, Math.floor((newTotal / likesToLaunch) * 100))
    const launchTriggered = energyPercent >= 100

    if (launchTriggered && (await getConfig('launch_triggered')) !== '1') {
      await setConfig('launch_triggered', '1')
    }

    return json({
      success: true,
      newTotal,
      energyPercent,
      launchTriggered,
      message: `点火能量 +1%！飞船蓄势待发！当前能量：${energyPercent}% 🚀`,
    })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequest('Invalid JSON body')
    }
    console.error('likes POST error:', error)
    return serverError()
  }
}
