/**
 * AdminPage — /admin route
 * Password-protected management console with dark HUD aesthetic.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminSidebar, { AdminTab } from '@/components/admin/AdminSidebar'
import AdminDashboard from '@/components/admin/AdminDashboard'
import AdminLikes from '@/components/admin/AdminLikes'
import AdminDonations from '@/components/admin/AdminDonations'
import AdminConfig from '@/components/admin/AdminConfig'
import { getAdminToken, clearAdminToken } from '@/utils/adminApi'

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [checkingToken, setCheckingToken] = useState(true)

  // Check for existing session token on mount
  useEffect(() => {
    const token = getAdminToken()
    if (token) {
      // Re-verify token is still valid
      import('@/utils/adminApi').then(({ adminGetConfig }) =>
        adminGetConfig()
          .then(() => setIsAuthed(true))
          .catch(() => clearAdminToken())
          .finally(() => setCheckingToken(false))
      )
    } else {
      setCheckingToken(false)
    }
  }, [])

  const handleLogout = () => {
    setIsAuthed(false)
    setActiveTab('dashboard')
  }

  // Loading spinner while checking stored token
  if (checkingToken) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#030508' }}
      >
        <motion.div
          className="w-8 h-8 border-2 border-transparent rounded-full"
          style={{ borderTopColor: '#FF4D00' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    )
  }

  // Not authenticated → show login
  if (!isAuthed) {
    return <AdminLogin onSuccess={() => setIsAuthed(true)} />
  }

  // Authenticated → show admin panel
  return (
    <div
      className="flex min-h-screen"
      style={{ background: 'radial-gradient(ellipse at top left, #0a1525 0%, #030508 60%)' }}
    >
      {/* Background grid decoration */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          zIndex: 0,
        }}
      />

      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main className="flex-1 relative z-10 overflow-auto">
        {/* Top bar */}
        <div
          className="sticky top-0 z-20 flex items-center justify-between px-8 py-4"
          style={{
            background: 'rgba(3,5,8,0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0,212,255,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-ignite-orange animate-pulse" />
            <span className="font-mono text-xs text-metal-light opacity-50 tracking-widest uppercase">
              {activeTab === 'dashboard' && 'Mission Dashboard'}
              {activeTab === 'likes' && 'Like Records'}
              {activeTab === 'donations' && 'Donation Management'}
              {activeTab === 'config' && 'System Configuration'}
            </span>
          </div>

          {/* Live clock */}
          <LiveClock />
        </div>

        {/* Tab content */}
        <div className="px-8 py-6 max-w-5xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <AdminDashboard />}
              {activeTab === 'likes' && <AdminLikes />}
              {activeTab === 'donations' && <AdminDonations />}
              {activeTab === 'config' && <AdminConfig />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

// Live UTC clock in the top bar
function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="font-mono text-xs text-metal-light opacity-30 tracking-widest">
      {time.toISOString().replace('T', ' ').slice(0, 19)} UTC
    </div>
  )
}
