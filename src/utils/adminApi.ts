/**
 * Admin API client
 * All requests include Bearer token authentication.
 */

import { API_BASE_URL } from './runtimeConfig'

const BASE_URL = API_BASE_URL

// ── Auth token management ────────────────────────────────────────────────────

export function getAdminToken(): string {
  return sessionStorage.getItem('terafab_admin_token') ?? ''
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem('terafab_admin_token', token)
}

export function clearAdminToken(): void {
  sessionStorage.removeItem('terafab_admin_token')
}

// ── Base fetch with auth ─────────────────────────────────────────────────────

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAdminToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
    ...options,
  })
  if (res.status === 401) throw new Error('UNAUTHORIZED')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalLikes: number
  energyPercent: number
  launchTriggered: boolean
  likesToLaunch: number
}

export interface LikeRecord {
  id: number
  ip_fingerprint: string
  ip_address: string
  user_agent: string
  created_at: string
}

export interface AdminDonation {
  id: number
  name: string
  amount: number
  tx_hash: string
  status: number     // 0=pending, 1=confirmed
  is_manual: number
  created_at: string
}

export interface ConfigMap {
  [key: string]: string
}

// ── Likes ────────────────────────────────────────────────────────────────────

export async function adminGetLikes(limit = 100, offset = 0): Promise<{
  records: LikeRecord[]
  total: number
}> {
  return adminFetch(`/api/admin/likes?limit=${limit}&offset=${offset}`)
}

export async function adminGetStats(): Promise<AdminStats> {
  return adminFetch<AdminStats>('/api/likes/total')
}

// ── Donations ─────────────────────────────────────────────────────────────────

export async function adminGetAllDonations(): Promise<{ donations: AdminDonation[] }> {
  return adminFetch('/api/admin/donations')
}

export async function adminAddDonation(data: {
  name: string
  amount: number
  tx_hash?: string
}): Promise<{ success: boolean }> {
  return adminFetch('/api/admin/donations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function adminEditDonation(
  id: number,
  data: { name: string; amount: number; tx_hash?: string }
): Promise<{ success: boolean }> {
  return adminFetch('/api/admin/donations', {
    method: 'PUT',
    body: JSON.stringify({ id, ...data }),
  })
}

export async function adminDeleteDonation(id: number): Promise<{ success: boolean }> {
  return adminFetch('/api/admin/donations', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  })
}

// ── Config ────────────────────────────────────────────────────────────────────

export async function adminGetConfig(): Promise<{ config: ConfigMap }> {
  return adminFetch('/api/admin/config')
}

export async function adminSetConfig(updates: Partial<ConfigMap>): Promise<{
  success: boolean
  applied: string[]
  errors?: string[]
}> {
  return adminFetch('/api/admin/config', {
    method: 'POST',
    body: JSON.stringify(updates),
  })
}
