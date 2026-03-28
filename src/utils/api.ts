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
}): Promise<{ success: boolean; id?: number; message: string }> {
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
