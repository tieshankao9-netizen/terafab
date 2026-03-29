import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  Globe2,
  MonitorSmartphone,
  MousePointerClick,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  adminGetVisitorAnalytics,
  RecentVisitorRecord,
  VisitorCountryStat,
  VisitorDailyStat,
  VisitorOverview,
} from '@/utils/adminApi'

type RangeOption = 7 | 14 | 30

const CHART_WIDTH = 680
const CHART_HEIGHT = 240
const LINE_COLORS = {
  unique: '#00D4FF',
  hits: '#FF8C00',
}

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

function buildLinePath(values: number[], width: number, height: number, maxValue?: number) {
  if (values.length === 0) return ''

  const safeMaxValue = Math.max(maxValue ?? Math.max(...values, 1), 1)
  const stepX = values.length > 1 ? width / (values.length - 1) : width

  return values
    .map((value, index) => {
      const x = Number((index * stepX).toFixed(2))
      const y = Number((height - (value / safeMaxValue) * height).toFixed(2))
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

function buildAreaPath(values: number[], width: number, height: number, maxValue?: number) {
  if (values.length === 0) return ''

  const line = buildLinePath(values, width, height, maxValue)
  const stepX = values.length > 1 ? width / (values.length - 1) : width
  const lastX = Number(((values.length - 1) * stepX).toFixed(2))
  return `${line} L ${lastX} ${height} L 0 ${height} Z`
}

function formatCsvCell(value: unknown) {
  const text = String(value ?? '')
  if (!/[",\n]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = `\uFEFF${rows.map((row) => row.map(formatCsvCell).join(',')).join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
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

function TrendLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: LINE_COLORS.unique, boxShadow: '0 0 10px rgba(0,212,255,0.55)' }}
        />
        <span className="font-mono text-[11px] text-metal-light opacity-55">独立访客</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: LINE_COLORS.hits, boxShadow: '0 0 10px rgba(255,140,0,0.45)' }}
        />
        <span className="font-mono text-[11px] text-metal-light opacity-55">总访问次数</span>
      </div>
    </div>
  )
}

function TrendChart({ rows }: { rows: VisitorDailyStat[] }) {
  const uniqueValues = rows.map((row) => row.unique_visitors)
  const totalValues = rows.map((row) => row.total_visits)
  const maxValue = Math.max(...uniqueValues, ...totalValues, 1)
  const gridLines = 4
  const uniquePath = buildLinePath(uniqueValues, CHART_WIDTH, CHART_HEIGHT, maxValue)
  const uniqueArea = buildAreaPath(uniqueValues, CHART_WIDTH, CHART_HEIGHT, maxValue)
  const totalPath = buildLinePath(totalValues, CHART_WIDTH, CHART_HEIGHT, maxValue)

  return (
    <div className="space-y-4">
      <TrendLegend />

      <div
        className="rounded-2xl p-4"
        style={{
          background: 'radial-gradient(circle at top, rgba(0,212,255,0.08), rgba(7,13,26,0.88) 65%)',
          border: '1px solid rgba(0,212,255,0.1)',
        }}
      >
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + 34}`}
            className="min-w-[640px] w-full"
            role="img"
            aria-label="访客趋势图"
          >
            <defs>
              <linearGradient id="visitor-area-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(0,212,255,0.34)" />
                <stop offset="100%" stopColor="rgba(0,212,255,0.02)" />
              </linearGradient>
            </defs>

            {[...Array(gridLines + 1)].map((_, index) => {
              const y = (CHART_HEIGHT / gridLines) * index
              const label = Math.round(maxValue - (maxValue / gridLines) * index)
              return (
                <g key={index}>
                  <line
                    x1="0"
                    y1={y}
                    x2={CHART_WIDTH}
                    y2={y}
                    stroke="rgba(192,200,216,0.08)"
                    strokeDasharray="3 8"
                  />
                  <text
                    x="8"
                    y={Math.max(14, y - 6)}
                    fill="rgba(192,200,216,0.35)"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {label}
                  </text>
                </g>
              )
            })}

            {uniqueArea && <path d={uniqueArea} fill="url(#visitor-area-gradient)" />}

            <path
              d={uniquePath}
              fill="none"
              stroke={LINE_COLORS.unique}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={totalPath}
              fill="none"
              stroke={LINE_COLORS.hits}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6 6"
            />

            {rows.map((row, index) => {
              const x = rows.length > 1 ? (CHART_WIDTH / (rows.length - 1)) * index : CHART_WIDTH / 2
              const uniqueY = CHART_HEIGHT - (row.unique_visitors / maxValue) * CHART_HEIGHT
              const totalY = CHART_HEIGHT - (row.total_visits / maxValue) * CHART_HEIGHT

              return (
                <g key={row.visit_date}>
                  <circle cx={x} cy={uniqueY} r="4" fill={LINE_COLORS.unique} />
                  <circle cx={x} cy={totalY} r="3.2" fill={LINE_COLORS.hits} />
                  <text
                    x={x}
                    y={CHART_HEIGHT + 22}
                    textAnchor="middle"
                    fill="rgba(192,200,216,0.45)"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {formatShortDate(row.visit_date)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
}

function CountryShareChart({ rows }: { rows: VisitorCountryStat[] }) {
  const topRows = rows.slice(0, 6)
  const total = topRows.reduce((sum, row) => sum + row.unique_visitors, 0)
  const palette = ['#00D4FF', '#FF8C00', '#FFD700', '#7EE787', '#FF6B9E', '#A78BFA']

  let currentStop = 0
  const stops = topRows.map((row, index) => {
    const share = total > 0 ? (row.unique_visitors / total) * 100 : 0
    const nextStop = currentStop + share
    const stop = `${palette[index % palette.length]} ${currentStop}% ${nextStop}%`
    currentStop = nextStop
    return stop
  })

  const background = stops.length > 0
    ? `conic-gradient(${stops.join(', ')})`
    : 'rgba(0,212,255,0.05)'

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
      <div className="flex flex-col items-center justify-center gap-3">
        <div
          className="relative flex h-48 w-48 items-center justify-center rounded-full"
          style={{
            background,
            boxShadow: '0 0 40px rgba(0,212,255,0.08)',
          }}
        >
          <div
            className="flex h-28 w-28 flex-col items-center justify-center rounded-full"
            style={{
              background: 'linear-gradient(135deg, #0d1525, #070d1a)',
              border: '1px solid rgba(192,200,216,0.08)',
            }}
          >
            <div className="font-display text-3xl font-bold text-metal-light">
              {total}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal-light opacity-35">
              unique
            </div>
          </div>
        </div>
        <div className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-metal-light opacity-35">
          Top country share
        </div>
      </div>

      <div className="space-y-3">
        {topRows.length === 0 ? (
          <div className="py-10 text-center font-mono text-xs text-metal-light opacity-30">
            暂无访客数据
          </div>
        ) : (
          topRows.map((row, index) => {
            const share = total > 0 ? (row.unique_visitors / total) * 100 : 0
            const color = palette[index % palette.length]

            return (
              <div
                key={`${row.country_code}-${row.country_name}`}
                className="rounded-xl px-4 py-3"
                style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: color, boxShadow: `0 0 12px ${color}` }}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-body text-sm text-metal-light">
                        {toFlag(row.country_code)} {row.country_name}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-metal-light opacity-35">
                        {row.country_code} · hits {row.total_visits}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-sm font-bold" style={{ color }}>
                      {row.unique_visitors}
                    </div>
                    <div className="font-mono text-[10px] text-metal-light opacity-35">
                      {share.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-metal-dark overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${share}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )
          })
        )}
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
  const todayDevices = useMemo(() => {
    return recent.reduce<Record<string, number>>((acc, row) => {
      if (row.visit_date !== filledDaily[filledDaily.length - 1]?.visit_date) return acc
      acc[row.device_type] = (acc[row.device_type] ?? 0) + row.hit_count
      return acc
    }, {})
  }, [filledDaily, recent])
  const topPaths = useMemo(() => {
    return Array.from(
      recent.reduce<Map<string, number>>((acc, row) => {
        acc.set(row.path, (acc.get(row.path) ?? 0) + row.hit_count)
        return acc
      }, new Map()),
    ).sort((a, b) => b[1] - a[1])
  }, [recent])

  const handleExportCsv = () => {
    if (!overview) return

    const rows: string[][] = [
      ['Section', 'Field', 'Value'],
      ['overview', 'today_unique_visitors', String(overview.todayUniqueVisitors)],
      ['overview', 'today_total_visits', String(overview.todayTotalVisits)],
      ['overview', 'last7_days_unique_visitors', String(overview.last7DaysUniqueVisitors)],
      ['overview', 'last7_days_total_visits', String(overview.last7DaysTotalVisits)],
      ['overview', 'top_country_code', overview.topCountryCode],
      ['overview', 'top_country_name', overview.topCountryName],
      [],
      ['daily', 'visit_date', 'unique_visitors', 'total_visits'],
      ...filledDaily.map((row) => [
        'daily',
        row.visit_date,
        String(row.unique_visitors),
        String(row.total_visits),
      ]),
      [],
      ['countries', 'country_code', 'country_name', 'unique_visitors', 'total_visits'],
      ...countries.map((row) => [
        'countries',
        row.country_code,
        row.country_name,
        String(row.unique_visitors),
        String(row.total_visits),
      ]),
      [],
      ['recent', 'last_seen_at', 'country_name', 'device_type', 'ip_address', 'path', 'hits', 'referrer'],
      ...recent.map((row) => [
        'recent',
        row.last_seen_at,
        row.country_name,
        row.device_type,
        row.ip_address,
        row.path,
        String(row.hit_count),
        row.referrer || '',
      ]),
    ]

    downloadCsv(`terafab-visitors-${days}d.csv`, rows)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold" style={{ color: '#00D4FF' }}>
            访客分析
          </h2>
          <p className="mt-1 font-mono text-xs text-metal-light opacity-40">
            VISITOR ANALYTICS · 每日独立访客 / 国家来源 / 图表趋势 / CSV 导出
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
            onClick={handleExportCsv}
            disabled={!overview}
            className="flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-xs disabled:opacity-35"
            style={{ border: '1px solid rgba(255,215,0,0.22)', color: '#FFD700' }}
          >
            <Download size={13} />
            导出 CSV
          </button>
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

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <motion.div
          className="rounded-xl p-5"
          style={{
            background: 'linear-gradient(135deg, #0d1525, #070d1a)',
            border: '1px solid rgba(0,212,255,0.12)',
          }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-plasma-cyan" />
                <span className="font-mono text-xs uppercase tracking-wider text-metal-light opacity-60">
                  每日访客趋势图
                </span>
              </div>
              <p className="mt-2 font-body text-sm text-metal-light opacity-55">
                蓝线看每日独立访客，橙线看总访问次数。这样能快速分辨“新增人群”还是“老访客重复访问”。
              </p>
            </div>
            <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal-light opacity-35">
                range
              </div>
              <div className="font-display text-lg text-plasma-cyan">{days}D</div>
            </div>
          </div>
          <TrendChart rows={filledDaily} />
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
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Globe2 size={15} className="text-ignite-gold" />
                <span className="font-mono text-xs uppercase tracking-wider text-metal-light opacity-60">
                  国家来源占比
                </span>
              </div>
              <p className="mt-2 font-body text-sm text-metal-light opacity-55">
                优先展示最近时间范围内占比最高的国家，方便你判断流量主要来自哪里。
              </p>
            </div>
          </div>
          <CountryShareChart rows={countries} />
        </motion.div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
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
            <MonitorSmartphone size={15} className="text-plasma-cyan" />
            <span className="font-mono text-xs uppercase tracking-wider text-metal-light opacity-60">
              今日设备分布
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {Object.keys(todayDevices).length === 0 ? (
              <div className="py-10 text-center font-mono text-xs text-metal-light opacity-30 sm:col-span-2">
                今天还没有设备数据
              </div>
            ) : (
              Object.entries(todayDevices)
                .sort((a, b) => b[1] - a[1])
                .map(([device, hits]) => (
                  <div
                    key={device}
                    className="rounded-xl px-4 py-4"
                    style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.08)' }}
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-metal-light opacity-35">
                      device
                    </div>
                    <div className="mt-2 font-display text-2xl text-plasma-cyan">{device}</div>
                    <div className="mt-1 font-body text-sm text-metal-light opacity-55">
                      今日 hits {hits}
                    </div>
                  </div>
                ))
            )}
          </div>
        </motion.div>

        <motion.div
          className="rounded-xl p-5"
          style={{
            background: 'linear-gradient(135deg, #0d1525, #070d1a)',
            border: '1px solid rgba(255,140,0,0.12)',
          }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <MousePointerClick size={15} className="text-ignite-amber" />
            <span className="font-mono text-xs uppercase tracking-wider text-metal-light opacity-60">
              热门页面入口
            </span>
          </div>

          <div className="space-y-3">
            {topPaths.length === 0 ? (
              <div className="py-10 text-center font-mono text-xs text-metal-light opacity-30">
                暂无入口数据
              </div>
            ) : (
              topPaths
                .slice(0, 5)
                .map(([path, hits]) => {
                  const maxHits = Math.max(...topPaths.map((row) => row[1]), 1)

                  return (
                    <div key={path}>
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <div className="truncate font-mono text-xs text-metal-light opacity-65">{path}</div>
                        <div className="font-display text-sm text-ignite-gold">{hits}</div>
                      </div>
                      <div className="h-2 rounded-full bg-metal-dark overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #FF8C00, #FFD700)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(hits / maxHits) * 100}%` }}
                          transition={{ duration: 0.45, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )
                })
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
