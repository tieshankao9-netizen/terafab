import { motion } from 'framer-motion'
import { Trophy, Globe } from 'lucide-react'
import { useGameStore } from '@/hooks/useGameStore'

export default function Header() {
  const { setShowLeaderboard, totalLikes } = useGameStore()

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4"
      style={{
        background: 'linear-gradient(180deg, rgba(3,5,8,0.95) 0%, transparent 100%)',
        backdropFilter: 'blur(12px)',
      }}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.6 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded flex items-center justify-center font-display font-bold text-sm"
          style={{
            background: 'linear-gradient(135deg, #FF4D00, #FF8C00)',
            boxShadow: '0 0 15px rgba(255, 77, 0, 0.6)',
          }}
        >
          T
        </div>
        <div>
          <div
            className="font-display font-bold text-base tracking-widest"
            style={{ color: '#FF8C00', textShadow: '0 0 12px rgba(255,140,0,0.5)' }}
          >
            TERAFAB
          </div>
          <div className="font-mono text-[10px] text-metal-light opacity-40 tracking-widest -mt-0.5">
            terafab.top
          </div>
        </div>
      </div>

      {/* Center: live stat */}
      <div
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{
          background: 'rgba(255, 77, 0, 0.08)',
          border: '1px solid rgba(255, 77, 0, 0.2)',
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-ignite-orange animate-pulse" />
        <span className="font-mono text-xs text-ignite-amber">
          {totalLikes.toLocaleString()} 助推者在线
        </span>
      </div>

      {/* Right nav */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowLeaderboard(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs transition-all hover:scale-105"
          style={{
            border: '1px solid rgba(0, 212, 255, 0.25)',
            color: '#00D4FF',
            background: 'rgba(0, 212, 255, 0.05)',
          }}
        >
          <Trophy size={13} />
          <span className="hidden sm:inline">光荣榜</span>
        </button>
        <a
          href="https://terafab.top"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs transition-all hover:scale-105"
          style={{
            border: '1px solid rgba(192, 200, 216, 0.15)',
            color: '#C0C8D8',
            background: 'rgba(192, 200, 216, 0.03)',
          }}
        >
          <Globe size={13} />
          <span className="hidden sm:inline">域名</span>
        </a>
      </div>
    </motion.header>
  )
}
