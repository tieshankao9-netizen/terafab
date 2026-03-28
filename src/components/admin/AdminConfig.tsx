/**
 * AdminConfig — System settings + admin credentials
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  UserRound,
  KeyRound,
} from 'lucide-react'
import {
  adminGetConfig,
  adminSetConfig,
  adminGetCredentials,
  adminUpdateCredentials,
  ConfigMap,
  getAdminSession,
  getAdminToken,
  setAdminCredentials,
} from '@/utils/adminApi'

interface FieldDef {
  key: string
  label: string
  desc: string
  type: 'text' | 'number' | 'address' | 'toggle'
  placeholder?: string
  sensitive?: boolean
}

interface CredentialDraft {
  username: string
  password: string
  confirmPassword: string
}

const FIELDS: FieldDef[] = [
  {
    key: 'wallet_address',
    label: '收款钱包地址',
    desc: 'BNB链 USDT 捐款将转到此地址 (0x...)',
    type: 'address',
    placeholder: '0x...',
    sensitive: true,
  },
  {
    key: 'likes_to_launch',
    label: '点火所需助力数',
    desc: '达到此数字时飞船起飞（默认 10000）',
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
    desc: '1 = 已起飞 / 0 = 未起飞（重置用）',
    type: 'toggle',
  },
  {
    key: 'site_name',
    label: '站点名称',
    desc: '显示在页面标题和 SEO 中',
    type: 'text',
    placeholder: 'Terafab',
  },
  {
    key: 'site_description',
    label: '站点描述',
    desc: 'SEO description',
    type: 'text',
    placeholder: 'Ignite the Mars mission',
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
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

  const inputType = fieldDef.sensitive && !showSensitive ? 'password' : fieldDef.type === 'number' ? 'number' : 'text'

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

function CredentialInput({
  label,
  desc,
  value,
  onChange,
  placeholder,
  sensitive = false,
}: {
  label: string
  desc: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  sensitive?: boolean
}) {
  const [showSensitive, setShowSensitive] = useState(false)
  const inputType = sensitive && !showSensitive ? 'password' : 'text'

  return (
    <div>
      <div className="font-body text-sm font-medium text-metal-light mb-1.5">{label}</div>
      <div className="font-mono text-[10px] text-metal-light opacity-40 mb-2">{desc}</div>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pr-10 rounded-lg font-mono text-sm text-metal-light bg-transparent outline-none"
          style={{
            border: '1px solid rgba(0,212,255,0.2)',
            background: 'rgba(0,212,255,0.03)',
          }}
        />
        {sensitive && (
          <button
            onClick={() => setShowSensitive(!showSensitive)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-metal-light opacity-40 hover:opacity-80"
          >
            {showSensitive ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminConfig() {
  const [config, setConfig] = useState<ConfigMap>({})
  const [draft, setDraft] = useState<ConfigMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{ success: boolean; msg: string } | null>(null)

  const [credentialLoading, setCredentialLoading] = useState(true)
  const [credentialSaving, setCredentialSaving] = useState(false)
  const [credentialMeta, setCredentialMeta] = useState({
    username: 'admin',
    passwordConfigured: false,
  })
  const [credentialDraft, setCredentialDraft] = useState<CredentialDraft>({
    username: 'admin',
    password: '',
    confirmPassword: '',
  })
  const [credentialResult, setCredentialResult] = useState<{
    success: boolean
    msg: string
  } | null>(null)

  const load = async () => {
    setLoading(true)
    setCredentialLoading(true)

    try {
      const [configData, credentialsData] = await Promise.all([
        adminGetConfig(),
        adminGetCredentials(),
      ])

      setConfig(configData.config)
      setDraft(configData.config)
      setCredentialMeta(credentialsData)
      setCredentialDraft({
        username: credentialsData.username || 'admin',
        password: '',
        confirmPassword: '',
      })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
      setCredentialLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(config)
  const hasCredentialChanges =
    credentialDraft.username !== credentialMeta.username ||
    Boolean(credentialDraft.password) ||
    Boolean(credentialDraft.confirmPassword)

  const handleSave = async () => {
    const changes: ConfigMap = {}
    for (const key of Object.keys(draft)) {
      if (draft[key] !== config[key]) {
        changes[key] = draft[key]
      }
    }

    if (Object.keys(changes).length === 0) return

    setSaving(true)
    setSaveResult(null)

    try {
      const result = await adminSetConfig(changes)
      if (result.success) {
        setConfig({ ...config, ...changes })
        setSaveResult({ success: true, msg: `已保存: ${result.applied.join(', ')}` })
      } else {
        setSaveResult({ success: false, msg: result.errors?.join('; ') ?? '保存失败' })
      }
    } catch (error) {
      setSaveResult({
        success: false,
        msg: error instanceof Error ? error.message : '保存失败',
      })
    } finally {
      setSaving(false)
      setTimeout(() => setSaveResult(null), 4000)
    }
  }

  const handleCredentialSave = async () => {
    const username = credentialDraft.username.trim()
    const password = credentialDraft.password.trim()
    const confirmPassword = credentialDraft.confirmPassword.trim()

    if (username.length < 3 || username.length > 32) {
      setCredentialResult({ success: false, msg: '用户名长度需为 3-32 个字符' })
      return
    }

    if (/[\s:]/u.test(username)) {
      setCredentialResult({ success: false, msg: '用户名不能包含空格或冒号' })
      return
    }

    if (password && password.length < 8) {
      setCredentialResult({ success: false, msg: '新密码至少 8 位' })
      return
    }

    if (password !== confirmPassword) {
      setCredentialResult({ success: false, msg: '两次输入的新密码不一致' })
      return
    }

    if (!hasCredentialChanges) {
      setCredentialResult({ success: false, msg: '没有需要保存的账号变更' })
      return
    }

    setCredentialSaving(true)
    setCredentialResult(null)

    try {
      const result = await adminUpdateCredentials({
        username,
        password: password || undefined,
      })

      const currentPassword =
        password || getAdminSession()?.password || getAdminToken()

      if (currentPassword) {
        setAdminCredentials(username, currentPassword)
      }

      setCredentialMeta({
        username: result.username,
        passwordConfigured: credentialMeta.passwordConfigured || result.passwordUpdated,
      })
      setCredentialDraft({
        username: result.username,
        password: '',
        confirmPassword: '',
      })
      setCredentialResult({
        success: true,
        msg: result.passwordUpdated ? '后台用户名和密码已更新' : '后台用户名已更新',
      })
    } catch (error) {
      setCredentialResult({
        success: false,
        msg: error instanceof Error ? error.message : '登录账号保存失败',
      })
    } finally {
      setCredentialSaving(false)
      setTimeout(() => setCredentialResult(null), 4000)
    }
  }

  const updateField = (key: string, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold" style={{ color: '#FF8C00' }}>
            系统配置
          </h2>
          <p className="font-mono text-xs text-metal-light opacity-40 mt-1">
            SYSTEM CONFIG · 修改后点击保存生效
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={load}
            disabled={loading || credentialLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-xs"
            style={{ border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}
          >
            <motion.div
              animate={loading || credentialLoading ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: loading || credentialLoading ? Infinity : 0, ease: 'linear' }}
            >
              <RefreshCw size={13} />
            </motion.div>
            重载
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving || loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-display font-bold text-sm disabled:opacity-40"
            style={{
              background: hasChanges ? 'linear-gradient(135deg, #FF4D00, #FF8C00)' : '#1a2a40',
              color: '#fff',
              boxShadow: hasChanges ? '0 0 20px rgba(255,77,0,0.35)' : 'none',
            }}
          >
            {saving ? (
              <motion.div
                className="w-4 h-4 border-2 border-transparent rounded-full"
                style={{ borderTopColor: '#fff' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <>
                <Save size={14} />
                保存配置
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {saveResult && (
          <motion.div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: saveResult.success ? 'rgba(0,255,204,0.08)' : 'rgba(255,77,0,0.08)',
              border: `1px solid ${saveResult.success ? 'rgba(0,255,204,0.3)' : 'rgba(255,77,0,0.3)'}`,
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {saveResult.success ? (
              <CheckCircle size={15} className="text-plasma-cyan" />
            ) : (
              <AlertTriangle size={15} className="text-ignite-orange" />
            )}
            <span className="font-mono text-sm" style={{ color: saveResult.success ? '#00FFCC' : '#FF8C00' }}>
              {saveResult.msg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {credentialLoading ? (
        <div className="py-16 flex justify-center">
          <motion.div
            className="w-8 h-8 border-2 border-transparent rounded-full"
            style={{ borderTopColor: '#FF4D00' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ) : (
        <motion.div
          className="rounded-xl p-5 space-y-4"
          style={{
            background: 'linear-gradient(135deg, #0d1525, #070d1a)',
            border: '1px solid rgba(0,212,255,0.1)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <UserRound size={14} className="text-plasma-cyan" />
                <span className="font-mono text-xs text-metal-light opacity-70 uppercase tracking-wider">
                  后台登录账号
                </span>
              </div>
              <p className="font-mono text-xs text-metal-light opacity-40 leading-5">
                默认用户名为 admin。这里可以自定义后台用户名和密码；新密码留空则保持不变。
              </p>
            </div>
            <div
              className="px-3 py-1.5 rounded-full font-mono text-[10px]"
              style={{
                background: credentialMeta.passwordConfigured ? 'rgba(0,255,204,0.08)' : 'rgba(255,77,0,0.08)',
                border: `1px solid ${credentialMeta.passwordConfigured ? 'rgba(0,255,204,0.2)' : 'rgba(255,77,0,0.2)'}`,
                color: credentialMeta.passwordConfigured ? '#00FFCC' : '#FF8C00',
              }}
            >
              {credentialMeta.passwordConfigured ? '密码已配置' : '密码未配置'}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CredentialInput
              label="登录用户名"
              desc="建议使用英文字母、数字、点、横线或下划线"
              value={credentialDraft.username}
              onChange={(value) => setCredentialDraft((prev) => ({ ...prev, username: value }))}
              placeholder="admin"
            />
            <CredentialInput
              label="新密码"
              desc="至少 8 位；留空则不修改当前密码"
              value={credentialDraft.password}
              onChange={(value) => setCredentialDraft((prev) => ({ ...prev, password: value }))}
              placeholder="输入新的后台密码"
              sensitive
            />
            <div className="md:col-span-2">
              <CredentialInput
                label="确认新密码"
                desc="再次输入新密码，避免输错"
                value={credentialDraft.confirmPassword}
                onChange={(value) => setCredentialDraft((prev) => ({ ...prev, confirmPassword: value }))}
                placeholder="再次输入新密码"
                sensitive
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="font-mono text-xs text-metal-light opacity-45 leading-5">
              当前用户名：{credentialMeta.username}
              <br />
              默认登录：admin + 你的管理员密码
            </div>
            <button
              onClick={handleCredentialSave}
              disabled={!hasCredentialChanges || credentialSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-display font-bold text-sm disabled:opacity-40"
              style={{
                background: hasCredentialChanges ? 'linear-gradient(135deg, #00A3FF, #00D4FF)' : '#1a2a40',
                color: '#04111f',
                boxShadow: hasCredentialChanges ? '0 0 20px rgba(0,212,255,0.18)' : 'none',
              }}
            >
              {credentialSaving ? (
                <motion.div
                  className="w-4 h-4 border-2 border-transparent rounded-full"
                  style={{ borderTopColor: '#04111f' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <>
                  <KeyRound size={14} />
                  保存登录账号
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {credentialResult && (
              <motion.div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: credentialResult.success ? 'rgba(0,255,204,0.08)' : 'rgba(255,77,0,0.08)',
                  border: `1px solid ${credentialResult.success ? 'rgba(0,255,204,0.3)' : 'rgba(255,77,0,0.3)'}`,
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {credentialResult.success ? (
                  <CheckCircle size={15} className="text-plasma-cyan" />
                ) : (
                  <AlertTriangle size={15} className="text-ignite-orange" />
                )}
                <span className="font-mono text-sm" style={{ color: credentialResult.success ? '#00FFCC' : '#FF8C00' }}>
                  {credentialResult.msg}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {hasChanges && (
        <motion.div
          className="flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-ignite-gold animate-pulse" />
          <span className="font-mono text-xs text-ignite-gold">有未保存的站点配置更改</span>
          <button
            onClick={() => setDraft(config)}
            className="ml-auto font-mono text-xs text-metal-light opacity-50 hover:opacity-80"
          >
            还原
          </button>
        </motion.div>
      )}

      {loading ? (
        <div className="py-16 flex justify-center">
          <motion.div
            className="w-8 h-8 border-2 border-transparent rounded-full"
            style={{ borderTopColor: '#FF4D00' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {FIELDS.map((field, index) => (
            <motion.div
              key={field.key}
              className="rounded-xl p-4"
              style={{
                background: 'linear-gradient(135deg, #0d1525, #070d1a)',
                border: `1px solid ${draft[field.key] !== config[field.key] ? 'rgba(255,215,0,0.25)' : 'rgba(0,212,255,0.1)'}`,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ConfigField
                fieldDef={field}
                value={draft[field.key] ?? ''}
                onChange={(value) => updateField(field.key, value)}
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

      <motion.div
        className="rounded-xl p-5"
        style={{ background: 'rgba(255,77,0,0.04)', border: '1px solid rgba(255,77,0,0.15)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-ignite-orange" />
          <span className="font-mono text-xs text-ignite-orange uppercase tracking-wider">危险区域</span>
        </div>
        <p className="font-mono text-xs text-metal-light opacity-40 mb-3">
          重置起飞状态会让飞船回到未起飞；将 launch_triggered 设为 0，并把 total_likes 清零后保存即可。
        </p>
        <button
          onClick={() => {
            updateField('launch_triggered', '0')
            updateField('total_likes', '0')
          }}
          className="font-mono text-xs px-3 py-2 rounded-lg"
          style={{ border: '1px solid rgba(255,77,0,0.3)', color: '#FF4D00' }}
        >
          重置任务计数（归零）
        </button>
      </motion.div>
    </div>
  )
}
