/**
 * App.tsx — Stage 5
 * Adds /admin route with password protection.
 * Uses simple path-based routing (no react-router needed).
 */

import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import Header from '@/components/ui/Header'
import HomePage from '@/pages/HomePage'
import AdminPage from '@/pages/AdminPage'
import { useSocket } from '@/hooks/useSocket'
import { useGameStore } from '@/hooks/useGameStore'
import { fetchLikesTotal } from '@/utils/api'

function AppInner() {
  const { setInitialState, setServerConnected } = useGameStore()
  const isAdmin = window.location.pathname.startsWith('/admin')

  // Establish real-time Socket.io connection (only for main site)
  useSocket(!isAdmin)

  // Fetch initial state from backend on mount
  useEffect(() => {
    if (isAdmin) return
    fetchLikesTotal()
      .then((data) => {
        setInitialState(
          data.total,
          data.energyPercent,
          data.launchTriggered,
          data.likesToLaunch
        )
        setServerConnected(true)
      })
      .catch(() => {
        setServerConnected(false)
        useGameStore.setState({ isLoadingInitial: false })
      })
  }, [isAdmin, setInitialState, setServerConnected])

  // Admin route
  if (isAdmin) return <AdminPage />

  // Main site
  return (
    <div className="relative w-full min-h-screen bg-space-black overflow-x-hidden">
      <Header />
      <HomePage />
    </div>
  )
}

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <AppInner />
    </AnimatePresence>
  )
}
