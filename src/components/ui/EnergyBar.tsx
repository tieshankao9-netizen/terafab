import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/hooks/useGameStore'

// Animated segment bar (NASA/SpaceX HUD style)
function SegmentBar({ percent }: { percent: number }) {
  const segments = 40
  const filledCount = Math.floor((percent / 100) * segments)

  return (
    <div className="flex gap-[2px] w-full">
      {Array.from({ length: segments }, (_, i) => {
        const filled = i < filledCount
        const isFront = i === filledCount - 1
        const isLast = percent >= 100

        let color = 'bg-ignite-orange'
        if (percent > 70) color = 'bg-ignite-amber'
        if (percent > 90) color = 'bg-ignite-gold'
        if (isLast) color = 'bg-ignite-gold'

        return (
          <div
            key={i}
            className={`flex-1 h-5 rounded-[1px] transition-all duration-300 ${
              filled
                ? `${color} ${isFront && !isLast ? 'animate-pulse' : ''}`
                : 'bg-metal-dark border border-[rgba(192,200,216,0.05)]'
            }`}
            style={
              filled
                ? {
                    boxShadow: isLast
                      ? '0 0 8px rgba(255, 215, 0, 0.8)'
                      : isFront
                      ? '0 0 12px rgba(255, 77, 0, 0.9)'
                      : '0 0 4px rgba(255, 77, 0, 0.3)',
                  }
                : {}
            }
          />
        )
      })}
    </div>
  )
}

export default function EnergyBar() {
  const { energyPercent, totalLikes, launchPhase, hasLaunched } = useGameStore()
  const [displayPercent, setDisplayPercent] = useState(energyPercent)
  const [displayLikes, setDisplayLikes] = useState(totalLikes)
  const prevLikes = useRef(totalLikes)
  const [likeFlash, setLikeFlash] = useState(false)

  // Animate numbers
  useEffect(() => {
    if (totalLikes !== prevLikes.current) {
      prevLikes.current = totalLikes
      setLikeFlash(true)
      setTimeout(() => setLikeFlash(false), 400)
    }

    let frame: number
    const target = energyPercent
    const start = displayPercent
    const duration = 800
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayPercent(Math.round(start + (target - start) * eased))
      setDisplayLikes(Math.round(prevLikes.current - 1 + (totalLikes - (prevLikes.current - 1)) * eased))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [energyPercent, totalLikes])

  const phaseLabel: Record<string, { text: string; color: string }> = {
    idle: { text: 'STANDBY', color: '#00D4FF' },
    charging: { text: 'CHARGING', color: '#FF8C00' },
    countdown: { text: 'T-MINUS', color: '#FF4D00' },
    ignition: { text: 'IGNITION', color: '#FFD700' },
    launched: { text: 'LAUNCHED', color: '#00FFCC' },
    boosting: { text: 'BOOSTING', color: '#FF8C00' },
  }
  const phase = phaseLabel[launchPhase] ?? phaseLabel.charging

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* HUD Panel */}
      <div className="relative hud-border rounded-lg p-4 metal-surface overflow-hidden">
        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-30"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,212,255,0.04) 3px, rgba(0,212,255,0.04) 4px)',
          }}
        />

        {/* Corner brackets decoration */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-ignite-orange rounded-tl" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-ignite-orange rounded-tr" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-ignite-orange rounded-bl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-ignite-orange rounded-br" />

        <div className="relative z-10 space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-ignite-orange animate-pulse" />
              <span className="font-mono text-xs text-metal-light tracking-widest uppercase opacity-70">
                IGNITION ENERGY
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: phase.color }}
              />
              <span
                className="font-mono text-xs tracking-widest"
                style={{ color: phase.color }}
              >
                {phase.text}
              </span>
            </div>
          </div>

          {/* Main progress bar */}
          <SegmentBar percent={displayPercent} />

          {/* Stats row */}
          <div className="flex items-center justify-between">
            {/* Percent counter */}
            <motion.div
              key={displayPercent}
              className="flex items-baseline gap-1"
            >
              <span
                className="font-display text-4xl font-bold"
                style={{
                  color: hasLaunched ? '#FFD700' : energyPercent > 90 ? '#FF4D00' : '#FF8C00',
                  textShadow:
                    energyPercent > 90
                      ? '0 0 30px rgba(255, 77, 0, 0.9), 0 0 60px rgba(255, 77, 0, 0.5)'
                      : '0 0 20px rgba(255, 140, 0, 0.6)',
                }}
              >
                {displayPercent}
              </span>
              <span className="font-display text-xl text-ignite-amber">%</span>
            </motion.div>

            {/* Center label */}
            <div className="text-center">
              <div className="font-mono text-xs text-metal-light opacity-50 tracking-widest">
                TOTAL ASSISTS
              </div>
              <div
                className={`font-display text-xl font-bold text-ignite-gold ${likeFlash ? 'number-pop' : ''}`}
                style={{ textShadow: '0 0 15px rgba(255, 215, 0, 0.6)' }}
              >
                {totalLikes.toLocaleString()}
              </div>
            </div>

            {/* Target indicator */}
            <div className="text-right">
              <div className="font-mono text-xs text-metal-light opacity-50 tracking-widest">
                TARGET
              </div>
              <div className="font-display text-xl font-bold text-plasma-blue">
                10,000
              </div>
            </div>
          </div>

          {/* Status messages */}
          <AnimatePresence mode="wait">
            {launchPhase === 'ignition' && (
              <motion.div
                key="ignition"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-1"
              >
                <span
                  className="font-display text-lg font-bold tracking-widest glitch-text"
                  style={{
                    color: '#FFD700',
                    textShadow: '0 0 30px #FFD700, 0 0 60px #FF4D00',
                  }}
                >
                  🔥 MAIN ENGINE START — T-0 🔥
                </span>
              </motion.div>
            )}
            {launchPhase === 'launched' && (
              <motion.div
                key="launched"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-1"
              >
                <span
                  className="font-display text-sm font-bold tracking-widest"
                  style={{ color: '#00FFCC', textShadow: '0 0 20px #00FFCC' }}
                >
                  🚀 TERAFAB HAS LEFT THE BUILDING — ORBIT ACHIEVED
                </span>
              </motion.div>
            )}
            {launchPhase === 'countdown' && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.7, 1] }}
                className="text-center py-1"
              >
                <span
                  className="font-display text-sm font-bold tracking-widest"
                  style={{ color: '#FF4D00', textShadow: '0 0 20px #FF4D00' }}
                >
                  ⚡ CRITICAL ENERGY — LAUNCH IMMINENT ⚡
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
