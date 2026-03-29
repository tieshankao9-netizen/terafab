/**
 * Frontend API client — Stage 2
 */

import { getBrowserFingerprint } from '@/hooks/useSocket'
import { API_BASE_URL } from './runtimeConfig'
const BASE_URL = API_BASE_URL

export interface LikesTotalResponse {
  total: number
  energyPercent: number
  launchTriggered: boolean
  likesToLaunch: number
}

export interface LikeResponse {
  success: boolean
  alreadyVoted?: boolean
  newTotal?: number
  total?: number
  energyPercent?: number
  launchTriggered?: boolean
  message: string
}

export interface Donation {
  id: number
  name: string
  amount: number
  tx_hash: string
  created_at: string
}

export interface DonationsResponse {
  donations: Donation[]
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function fetchLikesTotal(): Promise<LikesTotalResponse> {
  return apiFetch<LikesTotalResponse>('/api/likes/total')
}

export async function submitLike(): Promise<LikeResponse> {
  const fingerprint = await getBrowserFingerprint().catch(() => '')
  return apiFetch<LikeResponse>('/api/likes', {
    method: 'POST',
    body: JSON.stringify({ fingerprint }),
  })
}

export async function fetchDonations(): Promise<DonationsResponse> {
  return apiFetch<DonationsResponse>('/api/donations')
}

export async function submitDonationPending(data: {
  name: string
  amount: number
  tx_hash: string
}): Promise<{ success: boolean; id?: number; confirmed?: boolean; message: string }> {
  return apiFetch('/api/donations/pending', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export interface PublicConfig {
  siteName: string
  siteDescription: string
  totalLikes: number
  likesToLaunch: number
  energyPercent: number
  launchTriggered: boolean
  walletAddress: string
}

export async function fetchPublicConfig(): Promise<PublicConfig> {
  return apiFetch<PublicConfig>('/api/config/public')
}

const trackedVisitKeys = new Set<string>()

export async function trackVisitorVisit(pathname = '/'): Promise<void> {
  if (typeof window === 'undefined') return

  const today = new Date().toISOString().slice(0, 10)
  const storageKey = `terafab_visit_logged:${pathname}:${today}`
  if (trackedVisitKeys.has(storageKey)) return

  if (window.sessionStorage.getItem(storageKey)) {
    trackedVisitKeys.add(storageKey)
    return
  }

  trackedVisitKeys.add(storageKey)
  window.sessionStorage.setItem(storageKey, '1')

  try {
    const fingerprint = await getBrowserFingerprint().catch(() => '')
    await apiFetch<{ success: boolean }>('/api/health', {
      method: 'POST',
      keepalive: true,
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || '',
        fingerprint,
      }),
    })
  } catch {
    trackedVisitKeys.delete(storageKey)
    window.sessionStorage.removeItem(storageKey)
  }
}
