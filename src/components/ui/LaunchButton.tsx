/**
 * LaunchButton — Stage 2
 * Calls real /api/likes endpoint with optimistic UI update.
 * Falls back gracefully if backend is offline.
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/hooks/useGameStore'
import { useSiteLanguage } from '@/i18n/siteLanguage'
import { submitLike } from '@/utils/api'

const calcEnergyPercent = (totalLikes: number, likesToLaunch: number) =>
  Math.min(100, Math.floor((totalLikes / likesToLaunch) * 100))

function Ripple({ x, y, id }: { x: number; y: number; id: number }) {
  return (
    <motion.div
      key={id}
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x - 4, top: y - 4,
        width: 8, height: 8,
        background: 'rgba(255, 140, 0, 0.8)',
        zIndex: 20,
      }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 30, opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
  )
}

function FloatingPlus({ id, x, y }: { id: number; x: number; y: number }) {
  return (
    <motion.div
      key={id}
      className="absolute pointer-events-none font-display font-bold text-ignite-gold z-30"
      style={{ left: x - 20, top: y - 20, textShadow: '0 0 10px rgba(255,215,0,0.8)', fontSize: '1.1rem' }}
      initial={{ y: 0, opacity: 1, scale: 1 }}
      animate={{ y: -80, opacity: 0, scale: 1.5 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      +1 ⚡
    </motion.div>
  )
}

export default function LaunchButton() {
  const {
    addLike,
    hasVoted,
    launchPhase,
    energyPercent,
    hasLaunched,
    setHasVoted,
    serverConnected,
  } = useGameStore()
  const { copy } = useSiteLanguage()

  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const [floatingNums, setFloatingNums] = useState<{ id: number; x: number; y: number }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (hasVoted || isSubmitting) return

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = Date.now()

      // Particle effects
      setRipples((prev) => [...prev.slice(-5), { id, x, y }])
      setFloatingNums((prev) => [...prev.slice(-5), { id, x, y }])
      setTimeout(() => {
        setRipples((p) => p.filter((r) => r.id !== id))
        setFloatingNums((p) => p.filter((n) => n.id !== id))
      }, 1200)

      // Optimistic UI update immediately
      addLike()

      // Call backend API
      if (serverConnected) {
        setIsSubmitting(true)
        try {
          const result = await submitLike()
          if (result.alreadyVoted) {
            const { likesToLaunch, hasLaunched: launchedState } = useGameStore.getState()
            const totalLikes =
              result.total ?? Math.max(0, useGameStore.getState().totalLikes - 1)
            const energyPercentFromServer =
              result.energyPercent ?? calcEnergyPercent(totalLikes, likesToLaunch)

            useGameStore.setState({
              hasVoted: true,
              totalLikes,
              energyPercent: energyPercentFromServer,
              showDonateModal: false,
              hasLaunched: result.launchTriggered ?? launchedState,
              launchPhase:
                result.launchTriggered ?? launchedState
                  ? 'launched'
                  : energyPercentFromServer >= 90
                  ? 'countdown'
                  : energyPercentFromServer > 0
                  ? 'charging'
                  : 'idle',
            })
            setErrorMsg(copy.launch.alreadyVoted)
            setTimeout(() => setErrorMsg(null), 3000)
          } else if (result.success) {
            setHasVoted(true)
          }
          // On success, socket will broadcast the real total to all clients
        } catch {
          // Backend error — keep optimistic state (offline mode)
        } finally {
          setIsSubmitting(false)
        }
      }
    },
    [addLike, copy.launch.alreadyVoted, hasVoted, isSubmitting, serverConnected, setHasVoted]
  )

  const isLaunching = launchPhase === 'ignition'
  const disabled = (hasVoted && !hasLaunched) || isSubmitting

  const buttonLabel = isSubmitting
    ? copy.launch.button.submitting
    : hasVoted
    ? hasLaunched
      ? copy.launch.button.afterLaunch
      : copy.launch.button.voted
    : isLaunching
    ? copy.launch.button.ignition
    : energyPercent >= 90
    ? copy.launch.button.critical
    : copy.launch.button.idle

  const buttonGlow =
    energyPercent >= 90
      ? 'rgba(255, 77, 0, 0.9)'
      : 'rgba(255, 77, 0, 0.5)'

  return (
    <div className="relative flex flex-col items-center gap-4">
      {floatingNums.map((n) => (
        <FloatingPlus key={n.id} id={n.id} x={n.x} y={n.y} />
      ))}

      <motion.button
        onClick={handleClick}
        disabled={disabled}
        className="relative overflow-hidden font-display font-bold tracking-widest rounded-xl px-10 py-5 text-white uppercase select-none"
        style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
          background: hasVoted
            ? 'linear-gradient(135deg, #1a2a40, #253550)'
            : 'linear-gradient(135deg, #FF4D00, #FF8C00)',
          boxShadow: hasVoted
            ? '0 0 20px rgba(0, 212, 255, 0.3)'
            : `0 0 40px ${buttonGlow}, 0 0 80px ${buttonGlow}40, inset 0 1px 0 rgba(255,255,255,0.15)`,
          border: `2px solid ${hasVoted ? 'rgba(0,212,255,0.4)' : 'rgba(255,215,0,0.4)'}`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          letterSpacing: '0.15em',
          minWidth: 220,
        }}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.96 } : {}}
        animate={
          isLaunching
            ? { scale: [1, 1.03, 0.98, 1.03, 1], transition: { repeat: Infinity, duration: 0.3 } }
            : energyPercent >= 90 && !hasVoted
            ? { scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 1 } }
            : {}
        }
      >
        {ripples.map((r) => (
          <Ripple key={r.id} id={r.id} x={r.x} y={r.y} />
        ))}

        {/* Shimmer */}
        {!hasVoted && (
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
          />
        )}

        {/* Spinner on submit */}
        {isSubmitting && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-5 h-5 border-2 border-transparent rounded-full"
              style={{ borderTopColor: '#FFD700' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}

        <span className={`relative z-10 ${isSubmitting ? 'opacity-0' : ''}`}>
          {buttonLabel}
        </span>
      </motion.button>

      {/* Error message */}
      <AnimatePresence>
        {errorMsg && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="font-mono text-xs text-ignite-orange text-center"
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Voted hint */}
      <AnimatePresence>
        {hasVoted && !hasLaunched && !errorMsg && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-xs text-metal-light opacity-60 text-center"
          >
            {copy.launch.hints.singleVote}
          </motion.p>
        )}
        {hasLaunched && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-xs text-center"
            style={{ color: '#00FFCC', textShadow: '0 0 10px #00FFCC' }}
          >
            {copy.launch.hints.afterLaunch}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Energy dots */}
      {!hasVoted && (
        <div className="flex items-center gap-2 mt-1">
          {[...Array(5)].map((_, i) => {
            const threshold = (i + 1) * 20
            const filled = energyPercent >= threshold
            return (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: filled ? '#FF4D00' : 'rgba(255,77,0,0.2)',
                  boxShadow: filled ? '0 0 6px rgba(255,77,0,0.8)' : 'none',
                }}
                animate={filled ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              />
            )
          })}
          <span className="font-mono text-xs text-metal-light opacity-40 ml-1">
            {energyPercent < 20
              ? copy.launch.status.cold
              : energyPercent < 60
              ? copy.launch.status.charging
              : energyPercent < 90
              ? copy.launch.status.nearCritical
              : copy.launch.status.ready}
          </span>
        </div>
      )}

      {/* Server status indicator */}
      <div className="flex items-center gap-1.5 mt-1">
        <div
          className="w-1 h-1 rounded-full"
          style={{ background: serverConnected ? '#00FFCC' : '#FF4D00' }}
        />
        <span className="font-mono text-[9px] opacity-30 text-metal-light">
          {serverConnected ? copy.launch.live : copy.launch.offline}
        </span>
      </div>
    </div>
  )
}
