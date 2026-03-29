/**
 * main.tsx — Stage 3
 * Wraps app with wagmi + React Query providers for Web3.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './styles/globals.css'
import { SiteLanguageProvider } from './i18n/siteLanguage'
import { wagmiConfig, queryClient } from './utils/web3Config'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SiteLanguageProvider>
          <App />
        </SiteLanguageProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
