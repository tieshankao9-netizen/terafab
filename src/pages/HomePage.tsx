import { motion } from 'framer-motion'
import { Suspense } from 'react'
import EnergyBar from '@/components/ui/EnergyBar'
import LaunchButton from '@/components/ui/LaunchButton'
import DonateModal from '@/components/ui/DonateModal'
import Leaderboard from '@/components/ui/Leaderboard'
import HudStats from '@/components/ui/HudStats'
import StarBackground from '@/components/effects/StarBackground'
import LaunchOverlay from '@/components/effects/LaunchOverlay'
import Scene from '@/components/scene/Scene'
import { useGameStore } from '@/hooks/useGameStore'
import { useSiteLanguage } from '@/i18n/siteLanguage'

// Loading fallback for 3D scene
function SceneLoading() {
  const { copy } = useSiteLanguage()

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-transparent rounded-full mx-auto"
          style={{ borderTopColor: '#FF4D00', borderRightColor: '#FF8C00' }}
        />
        <p className="font-mono text-xs text-metal-light opacity-40 tracking-widest">
          {copy.home.sceneLoading}
        </p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { setShowLeaderboard } = useGameStore()
  const { copy } = useSiteLanguage()

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-space-black">
      {/* Layer 0: Canvas starfield */}
      <StarBackground />

      {/* Layer 1: 3D Scene */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 1, pointerEvents: 'none' }}
      >
        <Suspense fallback={<SceneLoading />}>
          <Scene />
        </Suspense>
      </div>

      {/* Layer 2: Scanline overlay */}
      <div className="scanline-overlay" />

      {/* Layer 3: Launch overlay effects */}
      <LaunchOverlay />

      {/* Layer 4: UI */}
      <div className="relative z-20 flex flex-col min-h-screen">
        {/* Spacer for header */}
        <div className="h-20" />

        {/* Hero section */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8">
          {/* Mission badge */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: 'rgba(255, 77, 0, 0.08)',
                border: '1px solid rgba(255, 77, 0, 0.25)',
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-ignite-orange animate-pulse" />
              <span className="font-mono text-xs text-ignite-amber tracking-widest uppercase">
                {copy.home.missionBadge}
              </span>
            </motion.div>

            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: 'rgba(0, 212, 255, 0.08)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.65 }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-plasma-cyan animate-pulse" />
              <span className="font-mono text-xs text-plasma-cyan tracking-widest uppercase">
                {copy.home.entertainmentBadge}
              </span>
            </motion.div>
          </div>

          {/* Main title */}
          <motion.h1
            className="font-display font-black text-center mb-3 glitch-text"
            style={{
              fontSize: 'clamp(3rem, 10vw, 7rem)',
              lineHeight: 0.9,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #FF4D00 0%, #FF8C00 40%, #FFD700 70%, #FF8C00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 30px rgba(255,77,0,0.5))',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            TERAFAB
          </motion.h1>

          <motion.div
            className="font-display font-bold text-center mb-2 tracking-widest"
            style={{
              fontSize: 'clamp(0.7rem, 2vw, 1rem)',
              color: '#C0C8D8',
              letterSpacing: '0.4em',
              textShadow: '0 0 20px rgba(192,200,216,0.3)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {copy.home.tagline}
          </motion.div>

          <motion.p
            className="font-body text-center max-w-lg mb-10 leading-relaxed"
            style={{
              color: '#6070a0',
              fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            {copy.home.description}
            <br />
            <span style={{ color: '#4060a0' }}>
              {copy.home.descriptionAccent}
            </span>
          </motion.p>

          {/* Main interaction area */}
          <motion.div
            className="w-full max-w-xl space-y-6"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            {/* Energy bar */}
            <EnergyBar />

            {/* Launch button */}
            <div className="flex justify-center">
              <LaunchButton />
            </div>
          </motion.div>

          {/* Bottom CTA row */}
          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <button
              onClick={() => setShowLeaderboard(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-xs transition-all hover:scale-105"
              style={{
                border: '1px solid rgba(255, 215, 0, 0.2)',
                color: '#FFD700',
                background: 'rgba(255, 215, 0, 0.04)',
                letterSpacing: '0.1em',
              }}
            >
              🏆 {copy.home.leaderboardCta}
            </button>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{
                border: '1px solid rgba(0, 212, 255, 0.12)',
                color: '#4060a0',
                background: 'rgba(0, 212, 255, 0.03)',
              }}
            >
              <span className="font-mono text-[10px] tracking-widest">
                {copy.home.chainBadge}
              </span>
            </div>
          </motion.div>

          <motion.div
            className="mt-5 w-full max-w-xl rounded-2xl px-4 py-4"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.06), rgba(255, 140, 0, 0.05))',
              border: '1px solid rgba(0, 212, 255, 0.14)',
            }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.65 }}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-plasma-cyan opacity-70">
              {copy.home.missionBadge}
            </div>
            <p className="mt-2 font-body text-sm leading-relaxed text-metal-light opacity-75">
              {copy.home.entertainmentNote}
              <br />
              <span style={{ color: '#FFD700' }}>{copy.home.nftHint}</span>
            </p>
          </motion.div>

          <motion.div
            className="mt-4 grid w-full max-w-xl gap-3 sm:grid-cols-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.78 }}
          >
            <div
              className="rounded-2xl px-4 py-4"
              style={{
                background: 'rgba(0, 212, 255, 0.05)',
                border: '1px solid rgba(0, 212, 255, 0.15)',
              }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-plasma-cyan opacity-75">
                {copy.home.showCardTitle}
              </div>
              <p className="mt-2 font-body text-sm leading-relaxed text-metal-light opacity-70">
                {copy.home.showCardBody}
              </p>
            </div>

            <div
              className="rounded-2xl px-4 py-4"
              style={{
                background: 'rgba(255, 215, 0, 0.05)',
                border: '1px solid rgba(255, 215, 0, 0.18)',
              }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ignite-gold opacity-80">
                {copy.home.airdropCardTitle}
              </div>
              <p className="mt-2 font-body text-sm leading-relaxed text-metal-light opacity-72">
                {copy.home.airdropCardBody}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bottom info strip */}
        <motion.div
          className="flex-shrink-0 py-4 px-6"
          style={{ borderTop: '1px solid rgba(0,212,255,0.06)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 max-w-5xl mx-auto">
            <div className="flex items-center gap-6">
              <InfoChip label={copy.home.infoDomain} value="terafab.top" />
              <InfoChip label={copy.home.infoChain} value="BNB Smart Chain" />
              <InfoChip label={copy.home.infoToken} value="USDT · BEP-20" />
            </div>
            <div className="font-mono text-[10px] text-metal-light opacity-20 tracking-wider">
              {copy.home.footer}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Left HUD Stats panel (desktop only) */}
      <motion.div
        className="fixed left-4 top-1/2 -translate-y-1/2 z-30 hidden lg:block"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.8 }}
      >
        <HudStats />
      </motion.div>

      {/* Modals */}
      <DonateModal />
      <Leaderboard />
    </div>
  )
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[9px] text-metal-light opacity-30 uppercase tracking-wider">
        {label}:
      </span>
      <span className="font-mono text-[10px] text-metal-light opacity-50">
        {value}
      </span>
    </div>
  )
}
