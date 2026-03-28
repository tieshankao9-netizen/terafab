/**
 * Web3 Configuration — wagmi v2 + Web3Modal
 *
 * Supports: MetaMask, WalletConnect, Coinbase Wallet, and injected wallets
 * Chain: BNB Smart Chain (BSC) — where USDT BEP-20 lives
 */

import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { QueryClient } from '@tanstack/react-query'
import { defineChain, http } from 'viem'
import {
  hasWalletConnectProjectId,
  walletConnectProjectId,
} from './runtimeConfig'

// ── BNB Smart Chain definition ────────────────────────────────────────────────
export const bsc = defineChain({
  id: 56,
  name: 'BNB Smart Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://bsc-dataseed.binance.org/'] },
    public: { http: ['https://bsc-dataseed.binance.org/'] },
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://bscscan.com' },
  },
})

// ── BSC Testnet (for development) ─────────────────────────────────────────────
export const bscTestnet = defineChain({
  id: 97,
  name: 'BSC Testnet',
  nativeCurrency: { name: 'BNB', symbol: 'tBNB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545/'] },
    public: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545/'] },
  },
  blockExplorers: {
    default: { name: 'BscScan Testnet', url: 'https://testnet.bscscan.com' },
  },
})

// ── USDT BEP-20 contract addresses ────────────────────────────────────────────
export const USDT_BSC_ADDRESS = '0x55d398326f99059fF775485246999027B3197955' as const
export const USDT_BSC_TESTNET_ADDRESS = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd' as const

// USDT ERC-20 ABI (minimal — only what we need: transfer + balanceOf + decimals)
export const USDT_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const

// ── WalletConnect project ID ───────────────────────────────────────────────────
// Get yours free at: https://cloud.walletconnect.com
const chains = [bsc, bscTestnet] as const

const transports = {
  [bsc.id]: http(bsc.rpcUrls.default.http[0]),
  [bscTestnet.id]: http(bscTestnet.rpcUrls.default.http[0]),
}

// ── Wagmi config ──────────────────────────────────────────────────────────────
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId: walletConnectProjectId,
  transports,
  enableWalletConnect: hasWalletConnectProjectId,
  enableEmail: false,
  metadata: {
    name: 'Terafab',
    description: '点燃火星征程 — 助力飞船起飞',
    url: 'https://terafab.top',
    icons: ['https://terafab.top/favicon.svg'],
  },
})

// ── Web3Modal instance ────────────────────────────────────────────────────────
createWeb3Modal({
  wagmiConfig,
  projectId: walletConnectProjectId,
  defaultChain: bsc,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#FF4D00',
    '--w3m-color-mix-strength': 20,
    '--w3m-accent': '#FF8C00',
    '--w3m-border-radius-master': '8px',
  },
})

// ── React Query client ────────────────────────────────────────────────────────
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 10_000 },
  },
})
