/**
 * AdminDonations — Full CRUD for donations / leaderboard
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Plus, Pencil, Trash2, Check, X,
  ExternalLink, RefreshCw, AlertTriangle,
} from 'lucide-react'
import {
  adminGetAllDonations,
  adminAddDonation,
  adminEditDonation,
  adminDeleteDonation,
  adminVerifyDonation,
  AdminDonation,
} from '@/utils/adminApi'

// ── Edit / Add Modal ──────────────────────────────────────────────────────────
interface EditModalProps {
  donation?: AdminDonation | null
  onClose: () => void
  onSave: (data: { name: string; amount: number; tx_hash: string }) => Promise<void>
}

function EditModal({ donation, onClose, onSave }: EditModalProps) {
  const [name, setName] = useState(donation?.name ?? '')
  const [amount, setAmount] = useState(donation ? String(donation.amount) : '')
  const [txHash, setTxHash] = useState(donation?.tx_hash ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name.trim() || !amount) { setError('姓名和金额必填'); return }
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { setError('金额必须大于0'); return }
    setSaving(true)
    setError('')
    try {
      await onSave({ name: name.trim(), amount: amt, tx_hash: txHash.trim() || `manual_${Date.now()}` })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-space-black/85 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{
          background: 'linear-gradient(135deg, #0d1525, #070d1a)',
          border: '1px solid rgba(255,215,0,0.2)',
          boxShadow: '0 0 60px rgba(255,215,0,0.08)',
        }}
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        {/* Top bar */}
        <div className="h-[1px] -mx-6 -mt-6 mb-4" style={{ background: 'linear-gradient(90deg, transparent, #FFD700, transparent)' }} />

        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg" style={{ color: '#FFD700' }}>
            {donation ? '编辑捐款' : '手动添加捐款'}
          </h3>
          <button onClick={onClose} className="text-metal-light opacity-50 hover:opacity-100"><X size={16} /></button>
        </div>

        {/* Fields */}
        {[
          { label: '姓名 / 代号 *', value: name, setter: setName, placeholder: '光荣榜显示名称', type: 'text' },
          { label: '金额 USDT *', value: amount, setter: setAmount, placeholder: '例：100', type: 'number' },
          { label: '交易哈希 (可选)', value: txHash, setter: setTxHash, placeholder: '0x...（留空自动生成）', type: 'text' },
        ].map(({ label, value, setter, placeholder, type }) => (
          <div key={label}>
            <label className="font-mono text-[10px] text-metal-light opacity-50 uppercase tracking-wider block mb-1.5">
              {label}
            </label>
            <input
              type={type}
              value={value}
              onChange={(e) => setter(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2.5 rounded-lg font-mono text-sm text-metal-light bg-transparent outline-none"
              style={{ border: '1px solid rgba(255,215,0,0.2)', background: 'rgba(255,215,0,0.03)' }}
            />
          </div>
        ))}

        {error && (
          <div className="flex items-center gap-2 p-2 rounded" style={{ background: 'rgba(255,77,0,0.1)', border: '1px solid rgba(255,77,0,0.3)' }}>
            <AlertTriangle size={13} className="text-ignite-orange" />
            <span className="font-mono text-xs text-ignite-amber">{error}</span>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl font-display font-bold text-white text-sm uppercase tracking-wider disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #FF4D00, #FF8C00)', boxShadow: '0 0 20px rgba(255,77,0,0.3)' }}
          >
            {saving ? '保存中...' : <><Check size={14} className="inline mr-1" />保存</>}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-mono text-sm"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#6070a0' }}
          >
            取消
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-space-black/85 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        className="relative w-full max-w-xs rounded-2xl p-6 space-y-4 text-center"
        style={{ background: '#0d1525', border: '1px solid rgba(255,77,0,0.3)' }}
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
      >
        <Trash2 size={32} className="text-ignite-orange mx-auto" />
        <div>
          <p className="font-display font-bold text-metal-light">确认删除？</p>
          <p className="font-mono text-xs text-metal-light opacity-50 mt-1">"{name}" 的捐款记录将被永久删除</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg font-mono text-sm font-bold text-white"
            style={{ background: '#FF4D00' }}
          >
            删除
          </button>
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg font-mono text-sm" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#6070a0' }}>
            取消
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminDonations() {
  const [donations, setDonations] = useState<AdminDonation[]>([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<AdminDonation | null | undefined>(undefined) // undefined=closed, null=add new
  const [deleteTarget, setDeleteTarget] = useState<AdminDonation | null>(null)
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending'>('all')
  const [actionBusyId, setActionBusyId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminGetAllDonations()
      setDonations(data.donations)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (data: { name: string; amount: number; tx_hash: string }) => {
    if (editTarget === null) {
      await adminAddDonation(data)
      setFeedback({ success: true, msg: '手动记录已保存，并直接进入支持者榜单。' })
    } else if (editTarget) {
      await adminEditDonation(editTarget.id, data)
      setFeedback({ success: true, msg: '捐款记录已更新。' })
    }
    await load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await adminDeleteDonation(deleteTarget.id)
    setFeedback({ success: true, msg: '捐款记录已删除。' })
    setDeleteTarget(null)
    await load()
  }

  const handleVerify = async (donation: AdminDonation) => {
    setActionBusyId(donation.id)
    setFeedback(null)

    try {
      const result = await adminVerifyDonation(donation.id)
      setFeedback({
        success: result.success,
        msg: result.message,
      })
      await load()
    } catch (error) {
      setFeedback({
        success: false,
        msg: error instanceof Error ? error.message : '链上复核失败',
      })
    } finally {
      setActionBusyId(null)
    }
  }

  const filtered = donations.filter((d) => {
    if (filter === 'confirmed') return d.status === 1
    if (filter === 'pending') return d.status === 0
    return true
  })

  const totalUSDT = donations.filter((d) => d.status === 1).reduce((s, d) => s + d.amount, 0)
  const pendingCount = donations.filter((d) => d.status === 0).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold" style={{ color: '#FF8C00' }}>捐款管理</h2>
          <p className="font-mono text-xs text-metal-light opacity-40 mt-1">
            DONATIONS · 共 {donations.length} 条 · 已确认 {totalUSDT.toLocaleString()} USDT · 待复核 {pendingCount} 条
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-xs" style={{ border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}>
            <motion.div animate={loading ? { rotate: 360 } : {}} transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}>
              <RefreshCw size={13} />
            </motion.div>
            刷新
          </button>
          <button
            onClick={() => setEditTarget(null)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #FF4D00, #FF8C00)', color: '#fff', boxShadow: '0 0 15px rgba(255,77,0,0.3)' }}
          >
            <Plus size={13} />
            手动添加
          </button>
        </div>
      </div>

      <div
        className="rounded-xl px-4 py-4 space-y-2"
        style={{
          background: 'linear-gradient(135deg, rgba(0,212,255,0.06), rgba(255,140,0,0.05))',
          border: '1px solid rgba(0,212,255,0.14)',
        }}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-plasma-cyan opacity-75">
          真实捐款录入流程
        </div>
        <div className="font-mono text-xs text-metal-light opacity-60 leading-6">
          1. 前台用户连接钱包并发送 USDT，随后提交交易哈希。
          <br />
          2. 后端会校验收款地址、USDT 合约和金额，验证成功后自动进入支持者榜单。
          <br />
          3. 若链上尚未返回确认，记录会先留在“待链上复核”；你可以在这里点“立即复核”，Vercel 定时任务也会每日复核一次。
          <br />
          4. “手动添加”只建议用于补录已经线下核实过的真实支持，不建议伪造链上记录。
        </div>
      </div>

      {feedback && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{
            background: feedback.success ? 'rgba(0,255,204,0.08)' : 'rgba(255,77,0,0.08)',
            border: `1px solid ${feedback.success ? 'rgba(0,255,204,0.22)' : 'rgba(255,77,0,0.22)'}`,
          }}
        >
          <AlertTriangle
            size={14}
            className={feedback.success ? 'text-plasma-cyan' : 'text-ignite-orange'}
          />
          <span className="font-mono text-xs text-metal-light opacity-80">{feedback.msg}</span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {([['all', '全部'], ['confirmed', '已确认'], ['pending', '待验证']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className="px-3 py-1.5 rounded-lg font-mono text-xs transition-all"
            style={{
              background: filter === val ? 'rgba(255,77,0,0.15)' : 'transparent',
              border: `1px solid ${filter === val ? 'rgba(255,77,0,0.4)' : 'rgba(255,255,255,0.06)'}`,
              color: filter === val ? '#FF8C00' : '#506080',
            }}
          >
            {label}
            <span className="ml-1.5 opacity-50">
              {val === 'all' ? donations.length : donations.filter((d) => val === 'confirmed' ? d.status === 1 : d.status === 0).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <motion.div
        className="rounded-xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d1525, #070d1a)', border: '1px solid rgba(255,215,0,0.08)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        {/* Head */}
        <div
          className="grid grid-cols-[1.5rem_1fr_5rem_5rem_6rem_8rem] gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,215,0,0.06)', background: 'rgba(255,215,0,0.02)' }}
        >
          {['#', '姓名', '金额', '状态', '时间', '操作'].map((h) => (
            <div key={h} className="font-mono text-[10px] text-metal-light opacity-40 uppercase tracking-wider">{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <motion.div className="w-6 h-6 border-2 border-transparent rounded-full" style={{ borderTopColor: '#FFD700' }} animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center font-mono text-xs text-metal-light opacity-30">暂无记录</div>
        ) : (
          <div className="divide-y divide-[rgba(255,215,0,0.04)]">
            {filtered.map((d, i) => (
              <motion.div
                key={d.id}
                className="grid grid-cols-[1.5rem_1fr_5rem_5rem_6rem_8rem] gap-3 px-4 py-3 items-center hover:bg-[rgba(255,215,0,0.02)] transition-colors"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              >
                <div className="font-mono text-xs opacity-30 text-metal-light">{i + 1}</div>

                {/* Name + tx */}
                <div className="min-w-0">
                  <div className="font-body text-sm text-metal-light truncate">{d.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="font-mono text-[9px] opacity-25 truncate max-w-[140px]">
                      {d.tx_hash.startsWith('manual') ? '手动录入' : d.tx_hash.slice(0, 14) + '…'}
                    </span>
                    {!d.tx_hash.startsWith('manual') && (
                      <a href={`https://bscscan.com/tx/${d.tx_hash}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={9} className="text-plasma-cyan opacity-40 hover:opacity-100" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="font-display text-sm font-bold" style={{ color: '#FFD700' }}>
                  {d.amount} <span className="font-mono text-[9px] opacity-40">USDT</span>
                </div>

                <div>
                  <span
                    className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                    style={
                      d.status === 1
                        ? { background: 'rgba(0,255,204,0.1)', color: '#00FFCC', border: '1px solid rgba(0,255,204,0.25)' }
                        : { background: 'rgba(255,140,0,0.1)', color: '#FF8C00', border: '1px solid rgba(255,140,0,0.25)' }
                    }
                  >
                    {d.status === 1 ? '已确认' : '待链上复核'}
                  </span>
                  {d.is_manual === 1 && (
                    <span className="ml-1 font-mono text-[9px] opacity-40 text-metal-light">手动</span>
                  )}
                </div>

                <div className="font-mono text-[10px] text-metal-light opacity-30">
                  {new Date(d.created_at).toLocaleDateString('zh-CN')}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {d.status === 0 && !d.tx_hash.startsWith('manual') && (
                    <button
                      onClick={() => handleVerify(d)}
                      disabled={actionBusyId === d.id}
                      className="w-7 h-7 rounded flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                      style={{ border: '1px solid rgba(255,215,0,0.2)', color: '#FFD700' }}
                      title="立即链上复核"
                    >
                      <motion.div
                        animate={actionBusyId === d.id ? { rotate: 360 } : { rotate: 0 }}
                        transition={{
                          duration: 0.9,
                          repeat: actionBusyId === d.id ? Infinity : 0,
                          ease: 'linear',
                        }}
                      >
                        <RefreshCw size={12} />
                      </motion.div>
                    </button>
                  )}
                  <button
                    onClick={() => setEditTarget(d)}
                    className="w-7 h-7 rounded flex items-center justify-center transition-all hover:scale-110"
                    style={{ border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(d)}
                    className="w-7 h-7 rounded flex items-center justify-center transition-all hover:scale-110"
                    style={{ border: '1px solid rgba(255,77,0,0.2)', color: '#FF4D00' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {editTarget !== undefined && (
          <EditModal
            donation={editTarget}
            onClose={() => setEditTarget(undefined)}
            onSave={handleSave}
          />
        )}
        {deleteTarget && (
          <DeleteConfirm
            name={deleteTarget.name}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
