const isLocalHostname = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0'

const normalizeBaseUrl = (value?: string) => {
  const trimmed = value?.trim() ?? ''
  const normalized = trimmed.replace(/\/+$/, '')
  if (!normalized) return ''

  try {
    const configuredUrl = new URL(normalized)
    const configuredIsLocal = isLocalHostname(configuredUrl.hostname)

    if (configuredIsLocal && typeof window !== 'undefined') {
      const currentHostname = window.location.hostname
      if (!isLocalHostname(currentHostname)) {
        return ''
      }
    }
  } catch {
    return normalized
  }

  return normalized
}

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL)

export const SOCKET_URL =
  API_BASE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001')

const configuredWalletConnectProjectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim() ?? ''

export const hasWalletConnectProjectId =
  configuredWalletConnectProjectId.length > 0 &&
  !/^YOUR_/i.test(configuredWalletConnectProjectId)

export const walletConnectProjectId = hasWalletConnectProjectId
  ? configuredWalletConnectProjectId
  : '00000000000000000000000000000000'
