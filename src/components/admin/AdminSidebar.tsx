/**
 * AdminSidebar — Navigation for the admin panel
 */

import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  ThumbsUp,
  Trophy,
  Settings,
  LogOut,
  Rocket,
  ChevronRight,
} from 'lucide-react'
import { clearAdminToken } from '@/utils/adminApi'

export type AdminTab = 'dashboard' | 'likes' | 'donations' | 'config'

interface Props {
  activeTab: AdminTab
  onTabChange: (tab: AdminTab) => void
  onLogout: () => void
}

const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'dashboard', label: '总览', icon: <LayoutDashboard size={16} />, desc: 'Mission Status' },
  { id: 'likes',     label: '点赞记录', icon: <ThumbsUp size={16} />, desc: 'Like Records' },
  { id: 'donations', label: '捐款管理', icon: <Trophy size={16} />, desc: 'Donations' },
  { id: 'config',    label: '系统配置', icon: <Settings size={16} />, desc: 'Config' },
]

export default function AdminSidebar({ activeTab, onTabChange, onLogout }: Props) {
  const handleLogout = () => {
    clearAdminToken()
    onLogout()
  }

  return (
    <aside
      className="flex flex-col w-56 min-h-screen flex-shrink-0"
      style={{
        background: 'linear-gradient(180deg, #0a1525 0%, #070d1a 100%)',
        borderRight: '1px solid rgba(0,212,255,0.1)',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b border-[rgba(0,212,255,0.08)]">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #FF4D00, #FF8C00)',
              boxShadow: '0 0 15px rgba(255,77,0,0.5)',
            }}
          >
            <Rocket size={14} className="text-white" />
          </div>
          <div>
            <div
              className="font-display font-bold text-sm tracking-widest"
              style={{ color: '#FF8C00' }}
            >
              TERAFAB
            </div>
            <div className="font-mono text-[9px] text-metal-light opacity-30 tracking-widest">
              MISSION CONTROL
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all relative"
              style={{
                background: isActive ? 'rgba(255,77,0,0.12)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(255,77,0,0.3)' : 'transparent'}`,
                color: isActive ? '#FF8C00' : '#6070a0',
              }}
              whileHover={{ x: 2, color: '#C0C8D8' }}
              whileTap={{ scale: 0.98 }}
            >
              <span style={{ color: isActive ? '#FF8C00' : '#4060a0' }}>{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-body text-sm font-medium">{item.label}</div>
                <div className="font-mono text-[9px] opacity-40 tracking-wider">{item.desc}</div>
              </div>
              {isActive && <ChevronRight size={12} className="flex-shrink-0" style={{ color: '#FF8C00' }} />}
            </motion.button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 border-t border-[rgba(0,212,255,0.08)] pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
          style={{ color: '#506080' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FF4D00')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#506080')}
        >
          <LogOut size={15} />
          <span className="font-body text-sm">退出登录</span>
        </button>
        <p className="font-mono text-[9px] text-metal-light opacity-20 mt-3 px-3">
          v1.0.0 · terafab.top
        </p>
      </div>
    </aside>
  )
}
