/**
 * AdminLikes — View all like records with pagination
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ThumbsUp, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminGetLikes, LikeRecord } from '@/utils/adminApi'

const PAGE_SIZE = 20

export default function AdminLikes() {
  const [records, setRecords] = useState<LikeRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async (pg = page) => {
    setLoading(true)
    try {
      const data = await adminGetLikes(PAGE_SIZE, pg * PAGE_SIZE)
      setRecords(data.records)
      setTotal(data.total)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page) }, [page])

  const filtered = search
    ? records.filter(
        (r) =>
          r.ip_address.includes(search) ||
          r.ip_fingerprint.includes(search) ||
          r.user_agent.toLowerCase().includes(search.toLowerCase())
      )
    : records

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold" style={{ color: '#FF8C00' }}>
            点赞记录
          </h2>
          <p className="font-mono text-xs text-metal-light opacity-40 mt-1">
            LIKE RECORDS · 共 {total.toLocaleString()} 条
          </p>
        </div>
        <button
          onClick={() => load(page)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs"
          style={{ border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}
        >
          <motion.div animate={loading ? { rotate: 360 } : {}} transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}>
            <RefreshCw size={13} />
          </motion.div>
          刷新
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-metal-light opacity-40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索 IP / 指纹 / UA..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg font-mono text-sm text-metal-light bg-transparent outline-none"
          style={{ border: '1px solid rgba(0,212,255,0.15)', background: 'rgba(0,212,255,0.03)' }}
        />
      </div>

      {/* Table */}
      <motion.div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0d1525, #070d1a)',
          border: '1px solid rgba(0,212,255,0.1)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Table header */}
        <div
          className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr] gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid rgba(0,212,255,0.08)', background: 'rgba(0,212,255,0.03)' }}
        >
          {['#', 'IP 地址', '指纹 (前16位)', 'User-Agent', '时间'].map((h) => (
            <div key={h} className="font-mono text-[10px] text-metal-light opacity-40 uppercase tracking-wider">
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <motion.div
              className="w-6 h-6 border-2 border-transparent rounded-full"
              style={{ borderTopColor: '#FF4D00' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-metal-light opacity-30">
            暂无记录
          </div>
        ) : (
          <div className="divide-y divide-[rgba(0,212,255,0.04)]">
            {filtered.map((r, i) => (
              <motion.div
                key={r.id}
                className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 items-center hover:bg-[rgba(0,212,255,0.02)] transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
              >
                <div className="font-mono text-xs text-metal-light opacity-30">{page * PAGE_SIZE + i + 1}</div>
                <div className="font-mono text-xs text-plasma-cyan truncate">{r.ip_address}</div>
                <div className="font-mono text-xs text-metal-light opacity-40 truncate">
                  {r.ip_fingerprint.slice(0, 16)}…
                </div>
                <div className="font-mono text-xs text-metal-light opacity-30 truncate" title={r.user_agent}>
                  {r.user_agent.slice(0, 30)}…
                </div>
                <div className="font-mono text-xs text-metal-light opacity-40">
                  {new Date(r.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid rgba(0,212,255,0.08)' }}
          >
            <span className="font-mono text-xs text-metal-light opacity-40">
              第 {page + 1} / {totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-30"
                style={{ border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-7 h-7 rounded flex items-center justify-center disabled:opacity-30"
                style={{ border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
