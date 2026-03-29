/**
 * Admin API client
 * Supports Basic auth (username + password) with Bearer fallback.
 */

import { API_BASE_URL } from './runtimeConfig'

const BASE_URL = API_BASE_URL
const LEGACY_TOKEN_KEY = 'terafab_admin_token'
const SESSION_KEY = 'terafab_admin_session'

export interface AdminSession {
  username: string
  password: string
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage
}

function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

export function getAdminSession(): AdminSession | null {
  const storage = getStorage()
  const raw = storage?.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<AdminSession>
    if (!parsed.username || !parsed.password) return null
    return {
      username: String(parsed.username),
      password: String(parsed.password),
    }
  } catch {
    return null
  }
}

export function hasAdminSession(): boolean {
  return Boolean(getAdminAuthHeader())
}

export function setAdminCredentials(username: string, password: string): void {
  const storage = getStorage()
  if (!storage) return

  storage.setItem(SESSION_KEY, JSON.stringify({ username, password }))
  storage.removeItem(LEGACY_TOKEN_KEY)
}

export function getAdminToken(): string {
  const session = getAdminSession()
  if (session) return session.password

  const storage = getStorage()
  return storage?.getItem(LEGACY_TOKEN_KEY) ?? ''
}

export function setAdminToken(token: string): void {
  const storage = getStorage()
  if (!storage) return
  storage.setItem(LEGACY_TOKEN_KEY, token)
}

export function clearAdminToken(): void {
  const storage = getStorage()
  if (!storage) return

  storage.removeItem(SESSION_KEY)
  storage.removeItem(LEGACY_TOKEN_KEY)
}

function getAdminAuthHeader(): string {
  const session = getAdminSession()
  if (session) {
    return `Basic ${encodeBase64Utf8(`${session.username}:${session.password}`)}`
  }

  const legacyToken = getStorage()?.getItem(LEGACY_TOKEN_KEY) ?? ''
  return legacyToken ? `Bearer ${legacyToken}` : ''
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const authHeader = getAdminAuthHeader()

  if (authHeader) {
    headers.set('Authorization', authHeader)
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) throw new Error('UNAUTHORIZED')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

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
  status: number
  is_manual: number
  created_at: string
}

export interface ConfigMap {
  [key: string]: string
}

export interface AdminCredentialsInfo {
  username: string
  passwordConfigured: boolean
}

export async function adminGetLikes(limit = 100, offset = 0): Promise<{
  records: LikeRecord[]
  total: number
}> {
  return adminFetch(`/api/admin/likes?limit=${limit}&offset=${offset}`)
}

export async function adminGetStats(): Promise<AdminStats> {
  return adminFetch<AdminStats>('/api/likes/total')
}

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
  data: { name: string; amount: number; tx_hash?: string },
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

export async function adminVerifyDonation(id: number): Promise<{
  success: boolean
  confirmed: boolean
  message: string
}> {
  return adminFetch('/api/admin/donations', {
    method: 'PATCH',
    body: JSON.stringify({ id, action: 'verify' }),
  })
}

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

export async function adminGetCredentials(): Promise<AdminCredentialsInfo> {
  return adminFetch('/api/admin/credentials')
}

export async function adminUpdateCredentials(data: {
  username: string
  password?: string
}): Promise<{
  success: boolean
  username: string
  passwordUpdated: boolean
}> {
  return adminFetch('/api/admin/credentials', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
