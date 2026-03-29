import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Globe2,
  MousePointerClick,
  RefreshCw,
  Users,
  TrendingUp,
  MonitorSmartphone,
} from 'lucide-react'
import {
  adminGetVisitorAnalytics,
  RecentVisitorRecord,
  VisitorCountryStat,
  VisitorDailyStat,
  VisitorOverview,
} from '@/utils/adminApi'

type RangeOption = 7 | 14 | 30

function toFlag(countryCode: string) {
  if (!/^[A-Z]{2}$/.test(countryCode) || countryCode === 'ZZ') return '??'
  return Array.from(countryCode)
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('')
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`)
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  })
}

function fillDailyData(days: number, rows: VisitorDailyStat[]) {
  const rowMap = new Map(rows.map((row) => [row.visit_date, row]))
  const filled: VisitorDailyStat[] = []

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - i)
    const key = date.toISOString().slice(0, 10)
    const existing = rowMap.get(key)

    filled.push(
      existing ?? {
        visit_date: key,
        unique_visitors: 0,
        total_visits: 0,
      },
    )
  }

  return filled
}

function OverviewCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <motion.div
      className="rounded-xl p-5"
      style={{
        background: 'linear-gradient(135deg, #0d1525, #070d1a)',
        border: `1px solid ${color}24`,
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: `${color}14`, border: `1px solid ${color}2c`, color }}
        >
          {icon}
        </div>
      </div>
      <div className="font-display text-3xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 font-body text-sm text-metal-light opacity-65">{label}</div>
      {sub && <div className="mt-1 font-mono text-[10px] text-metal-light opacity-35">{sub}</div>}
    </motion.div>
  )
}

function CountryRow({
  row,
  peak,
}: {
  row: VisitorCountryStat
  peak: number
}) {
  const ratio = peak > 0 ? (row.unique_visitors / peak) * 100 : 0

  return (
    <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="font-display text-lg">{toFlag(row.country_code)}</div>
          <div className="min-w-0">
            <div className="truncate font-body text-sm text-metal-light">{row.country_name}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-metal-light opacity-35">
              {row.country_code}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-sm font-bold text-plasma-cyan">
            {row.unique_visitors}
          </div>
          <div className="font-mono text-[10px] text-metal-light opacity-35">
            hits {row.total_visits}
          </div>
        </div>
      </div>
      <div className="h-2 rounded-full bg-metal-dark overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #00D4FF, #FF8C00)' }}
          initial={{ width: 0 }}
          animate={{ width: `${ratio}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function RecentVisitRow({ visit, index }: { visit: RecentVisitorRecord; index: number }) {
  return (
    <motion.div
      className="grid grid-cols-[1.2fr_1fr_0.9fr_1.2fr_1fr_0.6fr] gap-3 px-4 py-3 items-center hover:bg-[rgba(0,212,255,0.02)] transition-colors"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
    >
      <div className="min-w-0">
        <div className="font-mono text-xs text-metal-light opacity-55">
          {new Date(visit.last_seen_at).toLocaleString('zh-CN')}
        </div>
        <div className="font-mono text-[10px] text-metal-light opacity-30">
          first {new Date(visit.first_seen_at).toLocaleTimeString('zh-CN')}
        </div>
      </div>
      <div className="min-w-0">
        <div className="truncate font-body text-sm text-metal-light">
          {toFlag(visit.country_code)} {visit.country_name}
        </div>
        <div className="font-mono text-[10px] text-metal-light opacity-30">
          {[visit.region, visit.city].filter(Boolean).join(' / ') || 'Unknown area'}
        </div>
      </div>
      <div className="min-w-0">
        <div className="font-mono text-xs text-plasma-cyan">{visit.device_type}</div>
        <div className="truncate font-mono text-[10px] text-metal-light opacity-30">
          {visit.user_agent || 'Unknown UA'}
        </div>
      </div>
      <div className="min-w-0">
        <div className="truncate font-mono text-xs text-metal-light opacity-70">{visit.ip_address}</div>
        <div className="truncate font-mono text-[10px] text-metal-light opacity-30">
          {visit.referrer || 'Direct / no referrer'}
        </div>
      </div>
      <div className="min-w-0">
        <div className="truncate font-mono text-xs text-ignite-amber">{visit.path}</div>
        <div className="font-mono text-[10px] text-metal-light opacity-30">
          date {visit.visit_date}
        </div>
      </div>
      <div className="text-right font-display text-sm font-bold text-ignite-gold">
        {visit.hit_count}
      </div>
    </motion.div>
  )
}

export default function AdminVisitors() {
  const [days, setDays] = useState<RangeOption>(14)
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<VisitorOverview | null>(null)
  const [daily, setDaily] = useState<VisitorDailyStat[]>([])
  const [countries, setCountries] = useState<VisitorCountryStat[]>([])
  const [recent, setRecent] = useState<RecentVisitorRecord[]>([])

  const load = async (range = days) => {
    setLoading(true)
    try {
      const data = await adminGetVisitorAnalytics(range)
      setOverview(data.overview)
      setDaily(data.daily)
      setCountries(data.countries)
      setRecent(data.recent)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(days)
  }, [days])

  const filledDaily = useMemo(() => fillDailyData(days, daily), [daily, days])
  const peakDaily = Math.max(...filledDaily.map((row) => row.unique_visitors), 1)
  const peakCountry = Math.max(...countries.map((row) => row.unique_visitors), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold" style={{ color: '#00D4FF' }}>
            访客分析
          </h2>
          <p className="mt-1 font-mono text-xs text-metal-light opacity-40">
            VISITOR ANALYTICS · 每日独立访客 / 国家来源 / 最近访问明细
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[7, 14, 30].map((value) => {
            const active = days === value
            return (
              <button
                key={value}
                onClick={() => setDays(value as RangeOption)}
                className="rounded-lg px-3 py-2 font-mono text-xs transition-all"
                style={{
                  color: active ? '#030508' : '#C0C8D8',
                  background: active ? '#00D4FF' : 'rgba(0,212,255,0.04)',
                  border: `1px solid ${active ? '#00D4FF' : 'rgba(0,212,255,0.12)'}`,
                }}
              >
                {value}D
              </button>
            )
          })}
          <button
            onClick={() => load(days)}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-xs"
            style={{ border: '1px solid rgba(255,140,0,0.2)', color: '#FF8C00' }}
          >
            <motion.div
              animate={loading ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.8, repeat: loading ? Infinity : 0, ease: 'linear' }}
            >
              <RefreshCw size={13} />
            </motion.div>
            刷新
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <OverviewCard
          label="今日独立访客"
          value={overview?.todayUniqueVisitors ?? 0}
          sub="按每日唯一访客去重"
          icon={<Users size={18} />}
          color="#00D4FF"
        />
        <OverviewCard
          label="今日总访问次数"
          value={overview?.todayTotalVisits ?? 0}
          sub="同一访客重复进入会累计 hits"
          icon={<MousePointerClick size={18} />}
          color="#FF8C00"
        />
        <OverviewCard
          label="近7天独立访客"
          value={overview?.last7DaysUniqueVisitors ?? 0}
          sub={`近7天总访问 ${overview?.last7DaysTotalVisits ?? 0}`}
          icon={<TrendingUp size={18} />}
          color="#FFD700"
        />
        <OverviewCard
          label="当前 TOP 国家"
          value={`${toFlag(overview?.topCountryCode ?? 'ZZ')} ${overview?.topCountryName ?? 'Unknown'}`}
          sub="按当前时间范围统计"
          icon={<Globe2 size={18} />}
          color="#7EE787"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <motion.div
          className="rounded-xl p-5"
          style={{
            background: 'linear-gradient(135deg, #0d1525, #070d1a)',
            border: '1px solid rgba(0,212,255,0.12)',
          }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-plasma-cyan" />
            <span className="font-mono text-xs uppercase tracking-wider text-metal-light opacity-60">
              每日访客趋势
            </span>
          </div>

          <div className="space-y-3">
            {filledDaily.map((row) => {
              const width = peakDaily > 0 ? (row.unique_visitors / peakDaily) * 100 : 0
              return (
                <div key={row.visit_date}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-mono text-xs text-metal-light opacity-50">
                      {formatShortDate(row.visit_date)}
                    </span>
                    <div className="flex items-center gap-3 font-mono text-[10px] text-metal-light opacity-50">
                      <span>unique {row.unique_visitors}</span>
                      <span>hits {row.total_visits}</span>
                    </div>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-metal-dark">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #00D4FF, #FF8C00)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          className="rounded-xl p-5"
          style={{
            background: 'linear-gradient(135deg, #0d1525, #070d1a)',
            border: '1px solid rgba(255,215,0,0.12)',
          }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <Globe2 size={15} className="text-ignite-gold" />
            <span className="font-mono text-xs uppercase tracking-wider text-metal-light opacity-60">
              国家来源排行
            </span>
          </div>

          <div className="space-y-3">
            {countries.length === 0 ? (
              <div className="py-10 text-center font-mono text-xs text-metal-light opacity-30">
                暂无访客数据
              </div>
            ) : (
              countries.slice(0, 8).map((row) => (
                <CountryRow key={`${row.country_code}-${row.country_name}`} row={row} peak={peakCountry} />
              ))
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0d1525, #070d1a)',
          border: '1px solid rgba(0,212,255,0.1)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(0,212,255,0.08)', background: 'rgba(0,212,255,0.03)' }}
        >
          <div className="flex items-center gap-2">
            <MonitorSmartphone size={15} className="text-plasma-cyan" />
            <span className="font-mono text-xs uppercase tracking-wider text-metal-light opacity-60">
              最近访问明细
            </span>
          </div>
          <span className="font-mono text-[10px] text-metal-light opacity-35">
            最新 {recent.length} 条
          </span>
        </div>

        <div
          className="grid grid-cols-[1.2fr_1fr_0.9fr_1.2fr_1fr_0.6fr] gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid rgba(0,212,255,0.06)' }}
        >
          {['时间', '国家 / 地区', '设备', 'IP / 来源', '页面', 'Hits'].map((title) => (
            <div key={title} className="font-mono text-[10px] uppercase tracking-wider text-metal-light opacity-35">
              {title}
            </div>
          ))}
        </div>

        {recent.length === 0 ? (
          <div className="py-10 text-center font-mono text-xs text-metal-light opacity-30">
            暂无最近访问记录
          </div>
        ) : (
          <div className="divide-y divide-[rgba(0,212,255,0.04)]">
            {recent.map((visit, index) => (
              <RecentVisitRow key={visit.id} visit={visit} index={index} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
