/**
 * useSocket — Vercel MVP compatibility layer
 * Replaces Socket.io with lightweight polling.
 */

import { useEffect } from 'react'
import { Donation, useGameStore } from './useGameStore'
import { fetchDonations, fetchLikesTotal } from '@/utils/api'

const POLL_INTERVAL_MS = 8000

export function useSocket(enabled = true) {
  const { triggerLaunch, triggerBoost, setServerConnected } = useGameStore()

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    const syncState = async () => {
      try {
        const [likesData, donationsData] = await Promise.all([
          fetchLikesTotal(),
          fetchDonations().catch(() => ({ donations: [] as Donation[] })),
        ])

        if (cancelled) return

        setServerConnected(true)

        {
          const data = likesData
          const store = useGameStore.getState()
          if (data.total >= store.totalLikes) {
            useGameStore.setState({
              totalLikes: data.total,
              energyPercent: data.energyPercent,
              isLoadingInitial: false,
            })
          }
          if (data.launchTriggered && !store.hasLaunched) {
            useGameStore.setState({ hasLaunched: true, launchPhase: 'launched' })
          }
        }

        if (donationsData.donations.length > 0) {
          useGameStore.setState({ liveDonations: donationsData.donations })
        }
      } catch {
        if (!cancelled) {
          setServerConnected(false)
        }
      }
    }

    const tick = async () => {
      try {
        const data = await fetchLikesTotal()
        if (cancelled) return

        setServerConnected(true)

        const store = useGameStore.getState()
        if (data.total > store.totalLikes) {
          useGameStore.setState({
            totalLikes: data.total,
            energyPercent: data.energyPercent,
            lastLikeTimestamp: Date.now(),
          })
        } else {
          useGameStore.setState({
            totalLikes: data.total,
            energyPercent: data.energyPercent,
          })
        }

        if (data.launchTriggered && !store.hasLaunched) {
          triggerLaunch()
        } else if (store.hasLaunched && data.total > store.totalLikes) {
          triggerBoost()
        } else if (data.energyPercent >= 90) {
          useGameStore.setState({ launchPhase: 'countdown' })
        }
      } catch {
        if (!cancelled) {
          setServerConnected(false)
        }
      }
    }

    void syncState()
    const interval = window.setInterval(() => {
      void tick()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [enabled, setServerConnected, triggerBoost, triggerLaunch])

  return null
}

// ── FingerprintJS helper ─────────────────────────────────────────────────────
let cachedFingerprint: string | null = null

export async function getBrowserFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint

  try {
    // Dynamically import to avoid blocking initial render
    const FingerprintJS = await import('@fingerprintjs/fingerprintjs')
    const fp = await FingerprintJS.load()
    const result = await fp.get()
    cachedFingerprint = result.visitorId
    return result.visitorId
  } catch {
    // Fallback: use a random ID stored in sessionStorage
    const stored = sessionStorage.getItem('tfp_id')
    if (stored) return stored
    const fallback = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('tfp_id', fallback)
    cachedFingerprint = fallback
    return fallback
  }
}
