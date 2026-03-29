import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/hooks/useGameStore'
import { useSiteLanguage } from '@/i18n/siteLanguage'

export default function LaunchOverlay() {
  const { launchPhase } = useGameStore()
  const { copy } = useSiteLanguage()
  const isIgnition = launchPhase === 'ignition'
  const isLaunched = launchPhase === 'launched'

  return (
    <>
      {/* Fire burst on ignition */}
      <AnimatePresence>
        {isIgnition && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Orange flash */}
            <motion.div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(circle at center bottom, rgba(255,77,0,0.4) 0%, transparent 70%)' }}
              animate={{ opacity: [0, 0.6, 0.2, 0.5, 0.1] }}
              transition={{ duration: 1.5, times: [0, 0.1, 0.3, 0.5, 1] }}
            />

            {/* Screen shake (simulated via scale jitter) */}
            <motion.div
              className="absolute inset-0"
              animate={{ x: [0, -3, 3, -2, 2, 0], y: [0, -2, 2, -1, 1, 0] }}
              transition={{ duration: 0.5, repeat: 3, repeatType: 'mirror' }}
            />

            {/* T-0 text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 1.2], opacity: [0, 1, 0] }}
                transition={{ duration: 2, times: [0, 0.3, 1] }}
                className="font-display font-black text-center"
                style={{
                  fontSize: 'clamp(3rem, 12vw, 8rem)',
                  color: '#FFD700',
                  textShadow: '0 0 60px rgba(255,215,0,1), 0 0 120px rgba(255,77,0,0.8)',
                  letterSpacing: '-0.02em',
                }}
              >
                {copy.overlay.ignitionTitle}
                <br />
                <span style={{ fontSize: '0.5em', letterSpacing: '0.15em', color: '#FF8C00' }}>
                  {copy.overlay.ignitionSubtitle}
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success banner after launch */}
      <AnimatePresence>
        {isLaunched && (
          <motion.div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-40 text-center px-6 py-3 rounded-xl"
            style={{
              background: 'rgba(0, 255, 204, 0.08)',
              border: '1px solid rgba(0, 255, 204, 0.3)',
              boxShadow: '0 0 40px rgba(0, 255, 204, 0.2)',
            }}
            initial={{ y: -40, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 1, type: 'spring', damping: 15 }}
          >
            <div
              className="font-display font-bold text-sm tracking-widest"
              style={{ color: '#00FFCC', textShadow: '0 0 15px rgba(0,255,204,0.8)' }}
            >
              {copy.overlay.successTitle}
            </div>
            <div className="font-mono text-xs text-metal-light opacity-50 mt-1 tracking-wider">
              {copy.overlay.successSubtitle}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
