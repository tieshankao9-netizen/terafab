/**
 * AdminConfig — System settings tab
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Save, RefreshCw, CheckCircle, AlertTriangle, Copy, Eye, EyeOff } from 'lucide-react'
import { adminGetConfig, adminSetConfig, ConfigMap } from '@/utils/adminApi'

interface FieldDef {
  key: string
  label: string
  desc: string
  type: 'text' | 'number' | 'address' | 'toggle'
  placeholder?: string
  sensitive?: boolean
}

const FIELDS: FieldDef[] = [
  {
    key: 'wallet_address',
    label: '收款钱包地址',
    desc: 'BNB链 USDT捐款将转到此地址 (0x...)',
    type: 'address',
    placeholder: '0x...',
    sensitive: true,
  },
  {
    key: 'likes_to_launch',
    label: '点火所需助力数',
    desc: '达到此数字时飞船起飞（默认10000）',
    type: 'number',
    placeholder: '10000',
  },
  {
    key: 'total_likes',
    label: '手动修正点赞总数',
    desc: '直接设置当前点赞数（谨慎操作）',
    type: 'number',
    placeholder: '0',
  },
  {
    key: 'launch_triggered',
    label: '起飞状态',
    desc: '1=已起飞 / 0=未起飞（重置用）',
    type: 'toggle',
  },
  {
    key: 'site_name',
    label: '站点名称',
    desc: '显示在页面标题和SEO中',
    type: 'text',
    placeholder: 'Terafab',
  },
  {
    key: 'site_description',
    label: '站点描述',
    desc: 'SEO description',
    type: 'text',
    placeholder: '点燃火星征程',
  },
]

function ConfigField({
  fieldDef,
  value,
  onChange,
}: {
  fieldDef: FieldDef
  value: string
  onChange: (v: string) => void
}) {
  const [showSensitive, setShowSensitive] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (fieldDef.type === 'toggle') {
    const isOn = value === '1'
    return (
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 mr-4">
          <div className="font-body text-sm font-medium text-metal-light">{fieldDef.label}</div>
          <div className="font-mono text-[10px] text-metal-light opacity-40 mt-0.5">{fieldDef.desc}</div>
        </div>
        <button
          onClick={() => onChange(isOn ? '0' : '1')}
          className="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
          style={{
            background: isOn ? 'linear-gradient(90deg, #FF4D00, #FF8C00)' : 'rgba(255,255,255,0.1)',
            boxShadow: isOn ? '0 0 15px rgba(255,77,0,0.4)' : 'none',
          }}
        >
          <motion.div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
            animate={{ left: isOn ? '1.4rem' : '0.125rem' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
        </button>
      </div>
    )
  }

  const inputType = fieldDef.sensitive && !showSensitive ? 'password' : 'text'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="font-body text-sm font-medium text-metal-light">{fieldDef.label}</label>
        <span className="font-mono text-[9px] text-metal-light opacity-30">{fieldDef.key}</span>
      </div>
      <div className="font-mono text-[10px] text-metal-light opacity-40 mb-2">{fieldDef.desc}</div>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fieldDef.placeholder}
          className="w-full px-3 py-2.5 pr-16 rounded-lg font-mono text-sm text-metal-light bg-transparent outline-none"
          style={{
            border: `1px solid ${
              fieldDef.type === 'address' && value && !/^0x[0-9a-fA-F]{40}$/.test(value)
                ? 'rgba(255,77,0,0.5)'
                : 'rgba(0,212,255,0.2)'
            }`,
            background: 'rgba(0,212,255,0.03)',
          }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button onClick={copyToClipboard} className="p-1 rounded text-metal-light opacity-40 hover:opacity-80">
              {copied ? <CheckCircle size={12} className="text-plasma-cyan" /> : <Copy size={12} />}
            </button>
          )}
          {fieldDef.sensitive && (
            <button onClick={() => setShowSensitive(!showSensitive)} className="p-1 rounded text-metal-light opacity-40 hover:opacity-80">
              {showSensitive ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          )}
        </div>
      </div>
      {fieldDef.type === 'address' && value && !/^0x[0-9a-fA-F]{40}$/.test(value) && (
        <p className="font-mono text-[10px] text-ignite-orange mt-1">⚠ 地址格式不正确</p>
      )}
    </div>
  )
}

export default function AdminConfig() {
  const [config, setConfig] = useState<ConfigMap>({})
  const [draft, setDraft] = useState<ConfigMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ success: boolean; msg: string } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminGetConfig()
      setConfig(data.config)
      setDraft(data.config)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(config)

  const handleSave = async () => {
    setSaving(true)
    setSaveResult(null)
    try {
      // Only send changed keys
      const changes: ConfigMap = {}
      for (const key of Object.keys(draft)) {
        if (draft[key] !== config[key]) changes[key] = draft[key]
      }
      const result = await adminSetConfig(changes)
      if (result.success) {
        setConfig({ ...config, ...changes })
        setSaveResult({ success: true, msg: `已保存: ${result.applied.join(', ')}` })
      } else {
        setSaveResult({ success: false, msg: result.errors?.join('; ') ?? '保存失败' })
      }
    } catch (e) {
      setSaveResult({ success: false, msg: e instanceof Error ? e.message : '保存失败' })
    } finally {
      setSaving(false)
      setTimeout(() => setSaveResult(null), 4000)
    }
  }

  const updateField = (key: string, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold" style={{ color: '#FF8C00' }}>系统配置</h2>
          <p className="font-mono text-xs text-metal-light opacity-40 mt-1">SYSTEM CONFIG · 修改后点击保存生效</p>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-xs" style={{ border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}>
            <motion.div animate={loading ? { rotate: 360 } : {}} transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}>
              <RefreshCw size={13} />
            </motion.div>
            重载
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-display font-bold text-sm disabled:opacity-40"
            style={{
              background: hasChanges ? 'linear-gradient(135deg, #FF4D00, #FF8C00)' : '#1a2a40',
              color: '#fff',
              boxShadow: hasChanges ? '0 0 20px rgba(255,77,0,0.35)' : 'none',
            }}
          >
            {saving ? (
              <motion.div className="w-4 h-4 border-2 border-transparent rounded-full" style={{ borderTopColor: '#fff' }} animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
            ) : (
              <><Save size={14} />保存配置</>
            )}
          </button>
        </div>
      </div>

      {/* Save result toast */}
      <AnimatePresence>
        {saveResult && (
          <motion.div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: saveResult.success ? 'rgba(0,255,204,0.08)' : 'rgba(255,77,0,0.08)',
              border: `1px solid ${saveResult.success ? 'rgba(0,255,204,0.3)' : 'rgba(255,77,0,0.3)'}`,
            }}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            {saveResult.success
              ? <CheckCircle size={15} className="text-plasma-cyan" />
              : <AlertTriangle size={15} className="text-ignite-orange" />
            }
            <span className="font-mono text-sm" style={{ color: saveResult.success ? '#00FFCC' : '#FF8C00' }}>
              {saveResult.msg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsaved changes banner */}
      {hasChanges && (
        <motion.div
          className="flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-ignite-gold animate-pulse" />
          <span className="font-mono text-xs text-ignite-gold">有未保存的更改</span>
          <button onClick={() => setDraft(config)} className="ml-auto font-mono text-xs text-metal-light opacity-50 hover:opacity-80">
            还原
          </button>
        </motion.div>
      )}

      {/* Config fields */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <motion.div className="w-8 h-8 border-2 border-transparent rounded-full" style={{ borderTopColor: '#FF4D00' }} animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
        </div>
      ) : (
        <div className="space-y-3">
          {FIELDS.map((field, i) => (
            <motion.div
              key={field.key}
              className="rounded-xl p-4"
              style={{
                background: 'linear-gradient(135deg, #0d1525, #070d1a)',
                border: `1px solid ${draft[field.key] !== config[field.key] ? 'rgba(255,215,0,0.25)' : 'rgba(0,212,255,0.1)'}`,
              }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            >
              <ConfigField
                fieldDef={field}
                value={draft[field.key] ?? ''}
                onChange={(v) => updateField(field.key, v)}
              />
              {draft[field.key] !== config[field.key] && (
                <div className="mt-2 font-mono text-[10px] text-ignite-gold opacity-60">
                  原值: {config[field.key] || '(空)'}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Danger zone */}
      <motion.div
        className="rounded-xl p-5"
        style={{ background: 'rgba(255,77,0,0.04)', border: '1px solid rgba(255,77,0,0.15)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-ignite-orange" />
          <span className="font-mono text-xs text-ignite-orange uppercase tracking-wider">危险区域</span>
        </div>
        <p className="font-mono text-xs text-metal-light opacity-40 mb-3">
          重置起飞状态会让飞船回到"未起飞"，将 launch_triggered 设为 0 并保存即可。
        </p>
        <button
          onClick={() => {
            updateField('launch_triggered', '0')
            updateField('total_likes', '0')
          }}
          className="font-mono text-xs px-3 py-2 rounded-lg"
          style={{ border: '1px solid rgba(255,77,0,0.3)', color: '#FF4D00' }}
        >
          重置任务计数 (归零)
        </button>
      </motion.div>
    </div>
  )
}
