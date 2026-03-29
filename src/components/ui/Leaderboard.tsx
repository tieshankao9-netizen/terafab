/**
 * Leaderboard — Stage 2
 * Shows live donations from backend (falls back to mock data if offline).
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, Star, RefreshCw } from 'lucide-react'
import { useGameStore, Donation } from '@/hooks/useGameStore'
import { useSiteLanguage } from '@/i18n/siteLanguage'
import { fetchDonations } from '@/utils/api'
import { MOCK_DONORS } from '@/utils/mockData'

const rankColors = ['#FFD700', '#C0C8D8', '#CD7F32']
const rankIcons = ['🥇', '🥈', '🥉']

function DonorCard({ donor, rank }: { donor: Donation; rank: number }) {
  const { formatDate, formatNumber } = useSiteLanguage()
  const isTop3 = rank < 3
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.04, type: 'spring', damping: 20 }}
      className="relative flex items-center gap-4 px-4 py-3 rounded-lg overflow-hidden"
      style={{
        background: isTop3
          ? `linear-gradient(135deg, rgba(${rank === 0 ? '255,215,0' : rank === 1 ? '192,200,216' : '205,127,50'},0.08) 0%, rgba(7,13,26,0.9) 100%)`
          : 'rgba(26, 32, 53, 0.6)',
        border: `1px solid ${
          isTop3
            ? `rgba(${rank === 0 ? '255,215,0' : rank === 1 ? '192,200,216' : '205,127,50'},0.25)`
            : 'rgba(0,212,255,0.08)'
        }`,
      }}
    >
      <div className="w-8 text-center flex-shrink-0">
        {isTop3 ? (
          <span className="text-xl">{rankIcons[rank]}</span>
        ) : (
          <span className="font-mono text-xs opacity-40 text-metal-light">#{rank + 1}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="font-display text-sm font-bold truncate"
          style={{ color: isTop3 ? rankColors[rank] : '#C0C8D8' }}
        >
          {donor.name}
        </div>
        <div className="font-mono text-xs opacity-40 text-metal-light">
          {formatDate(donor.created_at)}
        </div>
      </div>

      {isTop3 && (
        <div className="flex">
          {[...Array(3 - rank)].map((_, i) => (
            <Star key={i} size={10} style={{ color: rankColors[rank] }} fill="currentColor" />
          ))}
        </div>
      )}

      <div className="text-right flex-shrink-0">
        <div
          className="font-display text-base font-bold"
          style={{
            color: isTop3 ? rankColors[rank] : '#FF8C00',
            textShadow: isTop3 ? `0 0 12px ${rankColors[rank]}60` : 'none',
          }}
        >
          {formatNumber(donor.amount)}
        </div>
        <div className="font-mono text-xs opacity-40 text-plasma-cyan">USDT</div>
      </div>

      {isTop3 && (
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${rankColors[rank]}60, transparent)`,
          }}
        />
      )}
    </motion.div>
  )
}

// Adapt mock data to Donation type for offline fallback
const MOCK_AS_DONATIONS: Donation[] = MOCK_DONORS.map((d) => ({
  id: d.id,
  name: d.name,
  amount: d.amount,
  tx_hash: `mock_${d.id}`,
  created_at: d.created_at,
}))

export default function Leaderboard() {
  const { showLeaderboard, setShowLeaderboard, liveDonations } = useGameStore()
  const { copy, formatNumber } = useSiteLanguage()
  const [localDonations, setLocalDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(false)
  const [usingSamples, setUsingSamples] = useState(true)

  // Fetch on open
  useEffect(() => {
    if (!showLeaderboard) return
    let cancelled = false
    setLoading(true)

    const load = async () => {
      try {
        const data = await fetchDonations()
        if (!cancelled) {
          const hasLiveDonations = data.donations.length > 0
          setLocalDonations(hasLiveDonations ? data.donations : MOCK_AS_DONATIONS)
          setUsingSamples(!hasLiveDonations)
        }
      } catch {
        if (!cancelled) {
          setLocalDonations(MOCK_AS_DONATIONS)
          setUsingSamples(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    const interval = window.setInterval(() => {
      void load()
    }, 10000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [showLeaderboard])

  // Sync live socket updates
  useEffect(() => {
    if (liveDonations.length > 0) {
      setLocalDonations(liveDonations)
      setUsingSamples(false)
    }
  }, [liveDonations])

  const displayDonations = localDonations.length > 0 ? localDonations : MOCK_AS_DONATIONS
  const totalUsdt = displayDonations.reduce((s, d) => s + d.amount, 0)

  return (
    <AnimatePresence>
      {showLeaderboard && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-space-black/92 backdrop-blur-md"
            onClick={() => setShowLeaderboard(false)}
          />

          <motion.div
            className="relative w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl flex flex-col"
            style={{
              background: 'linear-gradient(180deg, #0a1525 0%, #070d1a 100%)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              boxShadow: '0 0 80px rgba(0, 212, 255, 0.15)',
            }}
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            <div
              className="h-[2px]"
              style={{
                background:
                  'linear-gradient(90deg, transparent, #00D4FF, #00FFCC, #00D4FF, transparent)',
              }}
            />

            {/* Header */}
            <div className="flex-shrink-0 px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <Trophy size={20} className="text-ignite-gold" />
                  <h2
                    className="font-display text-xl font-bold"
                    style={{ color: '#FFD700', textShadow: '0 0 20px rgba(255,215,0,0.5)' }}
                  >
                    {copy.leaderboard.title}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {loading && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <RefreshCw size={14} className="text-plasma-cyan opacity-60" />
                    </motion.div>
                  )}
                  <button
                    onClick={() => setShowLeaderboard(false)}
                    className="text-metal-light opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <p className="font-mono text-xs text-metal-light opacity-50">
                {copy.leaderboard.subtitle}
              </p>

              <div
                className="mt-4 px-4 py-3 rounded-lg flex items-center justify-between"
                style={{
                  background: 'rgba(0, 212, 255, 0.05)',
                  border: '1px solid rgba(0, 212, 255, 0.15)',
                }}
              >
                <span className="font-mono text-xs text-metal-light opacity-60 uppercase tracking-wider">
                  {copy.leaderboard.totalSupport}
                </span>
                <span
                  className="font-display text-lg font-bold"
                  style={{ color: '#00FFCC', textShadow: '0 0 15px rgba(0,255,204,0.5)' }}
                >
                  {formatNumber(totalUsdt)} USDT
                </span>
              </div>

              {usingSamples && (
                <div
                  className="mt-3 rounded-lg px-3 py-2"
                  style={{
                    background: 'rgba(255, 140, 0, 0.08)',
                    border: '1px solid rgba(255, 140, 0, 0.18)',
                  }}
                >
                  <span className="font-mono text-[10px] text-ignite-amber opacity-80">
                    {copy.leaderboard.sampleBanner}
                  </span>
                </div>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
              {displayDonations.map((donor, i) => (
                <DonorCard key={donor.id} donor={donor} rank={i} />
              ))}
            </div>

            <div className="absolute top-6 right-14 w-3 h-3 border-t border-r border-plasma-cyan opacity-30" />
            <div className="absolute bottom-6 left-6 w-3 h-3 border-b border-l border-plasma-cyan opacity-30" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
