/**
 * AdminDashboard — Mission Status overview tab
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Users, Trophy, TrendingUp, Activity, RefreshCw } from 'lucide-react'
import { adminGetStats, adminGetAllDonations, AdminStats, AdminDonation } from '@/utils/adminApi'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color: string
  delay?: number
}

function StatCard({ label, value, sub, icon, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      className="rounded-xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0d1525, #070d1a)',
        border: `1px solid ${color}25`,
        boxShadow: `0 0 30px ${color}08`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      {/* Glow corner */}
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div
        className="font-display text-3xl font-bold mb-1"
        style={{ color, textShadow: `0 0 20px ${color}50` }}
      >
        {value}
      </div>
      <div className="font-body text-sm text-metal-light opacity-60">{label}</div>
      {sub && <div className="font-mono text-xs opacity-30 mt-1">{sub}</div>}
    </motion.div>
  )
}

// Mini energy bar
function EnergyMini({ percent }: { percent: number }) {
  return (
    <div className="mt-2">
      <div className="flex justify-between font-mono text-xs text-metal-light opacity-50 mb-1">
        <span>点火能量</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-metal-dark overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: percent >= 100
              ? 'linear-gradient(90deg, #FFD700, #FF8C00)'
              : 'linear-gradient(90deg, #FF4D00, #FF8C00)',
            boxShadow: `0 0 8px rgba(255,77,0,0.6)`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [donations, setDonations] = useState<AdminDonation[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const load = async () => {
    setLoading(true)
    try {
      const [s, d] = await Promise.all([adminGetStats(), adminGetAllDonations()])
      setStats(s)
      setDonations(d.donations)
      setLastRefresh(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const confirmedDonations = donations.filter((d) => d.status === 1)
  const pendingDonations = donations.filter((d) => d.status === 0)
  const totalUSDT = confirmedDonations.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="font-display text-2xl font-bold"
            style={{ color: '#FF8C00', textShadow: '0 0 15px rgba(255,140,0,0.4)' }}
          >
            任务总览
          </h2>
          <p className="font-mono text-xs text-metal-light opacity-40 mt-1">
            MISSION DASHBOARD · 最后更新 {lastRefresh.toLocaleTimeString('zh-CN')}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs transition-all"
          style={{ border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}
        >
          <motion.div animate={loading ? { rotate: 360 } : {}} transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}>
            <RefreshCw size={13} />
          </motion.div>
          刷新
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="总助力次数"
          value={stats?.totalLikes.toLocaleString() ?? '—'}
          sub={`目标 ${stats?.likesToLaunch.toLocaleString() ?? '10,000'}`}
          icon={<Users size={18} />}
          color="#FF8C00"
          delay={0}
        />
        <StatCard
          label="点火能量"
          value={`${stats?.energyPercent ?? 0}%`}
          sub={stats?.launchTriggered ? '✅ 已起飞' : '🚀 蓄能中'}
          icon={<Zap size={18} />}
          color="#FF4D00"
          delay={0.1}
        />
        <StatCard
          label="总捐款额"
          value={`${totalUSDT.toLocaleString()} U`}
          sub={`${confirmedDonations.length} 笔已确认`}
          icon={<Trophy size={18} />}
          color="#FFD700"
          delay={0.2}
        />
        <StatCard
          label="待审捐款"
          value={pendingDonations.length}
          sub="pending verification"
          icon={<Activity size={18} />}
          color="#00D4FF"
          delay={0.3}
        />
      </div>

      {/* Energy bar */}
      {stats && (
        <motion.div
          className="rounded-xl p-5"
          style={{
            background: 'linear-gradient(135deg, #0d1525, #070d1a)',
            border: '1px solid rgba(255,77,0,0.15)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-ignite-orange" />
            <span className="font-mono text-xs text-metal-light opacity-60 uppercase tracking-wider">
              点火能量状态
            </span>
            {stats.launchTriggered && (
              <span
                className="ml-auto font-mono text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(0,255,204,0.1)', color: '#00FFCC', border: '1px solid rgba(0,255,204,0.3)' }}
              >
                🚀 已起飞
              </span>
            )}
          </div>
          <EnergyMini percent={stats.energyPercent} />
          <div className="flex justify-between font-mono text-[10px] text-metal-light opacity-30 mt-2">
            <span>{stats.totalLikes.toLocaleString()} 次助力</span>
            <span>目标 {stats.likesToLaunch.toLocaleString()} 次</span>
          </div>
        </motion.div>
      )}

      {/* Recent donations */}
      <motion.div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0d1525, #070d1a)',
          border: '1px solid rgba(255,215,0,0.1)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,215,0,0.08)' }}
        >
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-ignite-gold" />
            <span className="font-mono text-xs text-metal-light opacity-60 uppercase tracking-wider">
              最近捐款（前5条）
            </span>
          </div>
          <span className="font-mono text-[10px] text-metal-light opacity-30">
            共 {donations.length} 条
          </span>
        </div>

        {donations.length === 0 ? (
          <div className="px-5 py-8 text-center font-mono text-xs text-metal-light opacity-30">
            暂无捐款记录
          </div>
        ) : (
          <div className="divide-y divide-[rgba(0,212,255,0.05)]">
            {donations.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center gap-4 px-5 py-3">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: d.status === 1 ? '#00FFCC' : '#FF8C00' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-body text-sm text-metal-light truncate">{d.name}</div>
                  <div className="font-mono text-[10px] opacity-30">
                    {new Date(d.created_at).toLocaleString('zh-CN')}
                    {d.is_manual === 1 && ' · 手动录入'}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className="font-display text-sm font-bold"
                    style={{ color: d.status === 1 ? '#FFD700' : '#FF8C00' }}
                  >
                    {d.amount} USDT
                  </div>
                  <div
                    className="font-mono text-[9px]"
                    style={{ color: d.status === 1 ? '#00FFCC' : '#FF8C00', opacity: 0.7 }}
                  >
                    {d.status === 1 ? '已确认' : '待验证'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
