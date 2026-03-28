/**
 * AdminLogin — Username + password gate for /admin
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Rocket, UserRound } from 'lucide-react'
import { adminGetConfig, clearAdminToken, setAdminCredentials } from '@/utils/adminApi'

interface Props {
  onSuccess: () => void
}

export default function AdminLogin({ onSuccess }: Props) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedUsername = username.trim()
    const normalizedPassword = password.trim()
    if (!normalizedUsername || !normalizedPassword) return

    setLoading(true)
    setError('')
    setAdminCredentials(normalizedUsername, normalizedPassword)

    try {
      await adminGetConfig()
      onSuccess()
    } catch {
      setError('用户名或密码错误，请重试')
      clearAdminToken()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at center, #070d1a 0%, #030508 100%)' }}
    >
      <div
        className="fixed inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, #FF4D00, #FF8C00)',
              boxShadow: '0 0 40px rgba(255,77,0,0.5)',
            }}
            animate={{
              boxShadow: [
                '0 0 40px rgba(255,77,0,0.5)',
                '0 0 70px rgba(255,77,0,0.8)',
                '0 0 40px rgba(255,77,0,0.5)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Rocket size={28} className="text-white" />
          </motion.div>
          <h1
            className="font-display text-3xl font-black tracking-widest"
            style={{ color: '#FF8C00', textShadow: '0 0 20px rgba(255,140,0,0.5)' }}
          >
            TERAFAB
          </h1>
          <p className="font-mono text-xs text-metal-light opacity-40 tracking-widest mt-1">
            MISSION CONTROL · ADMIN
          </p>
        </div>

        <motion.div
          className="rounded-2xl p-6 space-y-5"
          style={{
            background: 'linear-gradient(135deg, #0d1525, #070d1a)',
            border: '1px solid rgba(0,212,255,0.15)',
            boxShadow: '0 0 60px rgba(0,212,255,0.05)',
          }}
        >
          <div
            className="h-[1px] -mx-6 -mt-6 mb-5"
            style={{ background: 'linear-gradient(90deg, transparent, #00D4FF, transparent)' }}
          />

          <div className="flex items-center gap-2 mb-2">
            <Lock size={14} className="text-plasma-cyan" />
            <span className="font-mono text-xs text-metal-light opacity-60 tracking-wider uppercase">
              用户名 + 密码登录
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-metal-light opacity-35">
                <UserRound size={15} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="默认用户名：admin"
                className="w-full px-10 py-3 rounded-lg font-mono text-sm text-metal-light bg-transparent outline-none"
                style={{
                  border: '1px solid rgba(0,212,255,0.2)',
                  background: 'rgba(0,212,255,0.03)',
                }}
                autoFocus
              />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-metal-light opacity-35">
                <Lock size={15} />
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入管理员密码"
                className="w-full px-10 py-3 pr-10 rounded-lg font-mono text-sm text-metal-light bg-transparent outline-none"
                style={{
                  border: `1px solid ${error ? 'rgba(255,77,0,0.5)' : 'rgba(0,212,255,0.2)'}`,
                  background: 'rgba(0,212,255,0.03)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-metal-light opacity-40 hover:opacity-70"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-xs text-ignite-orange"
              >
                ⚠ {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full py-3 rounded-xl font-display font-bold text-white uppercase tracking-widest disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #FF4D00, #FF8C00)',
                boxShadow:
                  username.trim() && password.trim() ? '0 0 25px rgba(255,77,0,0.4)' : 'none',
                letterSpacing: '0.15em',
              }}
            >
              {loading ? (
                <motion.div
                  className="w-4 h-4 border-2 border-transparent rounded-full mx-auto"
                  style={{ borderTopColor: '#fff' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                '进入任务控制'
              )}
            </button>
          </form>

          <p className="font-mono text-[10px] text-metal-light opacity-25 text-center tracking-wider leading-5">
            默认用户名为 admin。登录后可在后台自定义用户名和密码。
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
