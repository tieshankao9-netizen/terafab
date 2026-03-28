const normalizeBaseUrl = (value?: string) => {
  const trimmed = value?.trim() ?? ''
  return trimmed.replace(/\/+$/, '')
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
