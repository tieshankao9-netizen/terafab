/**
 * DonateModal — Stage 3
 * Full Web3 USDT donation flow with wagmi + Web3Modal.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Trophy, Rocket, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useConnect } from 'wagmi'
import { useGameStore } from '@/hooks/useGameStore'
import { useDonation, DonationStep } from '@/hooks/useDonation'
import { bsc } from '@/utils/web3Config'
import { hasWalletConnectProjectId } from '@/utils/runtimeConfig'

const QUICK_AMOUNTS = [10, 50, 100, 500]

// Step labels for the progress indicator
const STEP_LABELS: Partial<Record<DonationStep, string>> = {
  connecting: '连接钱包中...',
  switching_chain: '切换到 BNB 链...',
  sending: '等待钱包确认...',
  confirming: '链上确认中...',
  submitting: '提交上榜中...',
  success: '上榜成功！',
  error: '出错了',
}

function StepIndicator({ step }: { step: DonationStep }) {
  const isActive = !['idle', 'success', 'error'].includes(step)
  const label = STEP_LABELS[step] ?? ''
  if (!label) return null

  return (
    <div className="flex items-center gap-3 py-2">
      {isActive && (
        <motion.div
          className="w-4 h-4 border-2 border-transparent rounded-full flex-shrink-0"
          style={{ borderTopColor: '#FF8C00', borderRightColor: '#FF4D00' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {step === 'success' && <CheckCircle size={16} className="text-plasma-cyan flex-shrink-0" />}
      {step === 'error' && <AlertTriangle size={16} className="text-ignite-orange flex-shrink-0" />}
      <span
        className="font-mono text-sm"
        style={{ color: step === 'error' ? '#FF4D00' : '#C0C8D8' }}
      >
        {label}
      </span>
    </div>
  )
}

export default function DonateModal() {
  const { showDonateModal, setShowDonateModal, energyPercent } = useGameStore()
  const { open: openWalletModal } = useWeb3Modal()
  const { connectAsync, connectors, isPending: isConnectingWallet } = useConnect()
  const { state, donate, reset, isConnected, address } = useDonation()

  const [view, setView] = useState<'prompt' | 'form'>('prompt')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [connectError, setConnectError] = useState('')

  // Reset form when modal closes
  useEffect(() => {
    if (!showDonateModal) {
      setTimeout(() => {
        setView('prompt')
        setName('')
        setAmount('')
        setConnectError('')
        reset()
      }, 400)
    }
  }, [showDonateModal, reset])

  const handleClose = () => setShowDonateModal(false)

  const connectWallet = async () => {
    setConnectError('')

    if (hasWalletConnectProjectId) {
      openWalletModal()
      return
    }

    const preferredConnector =
      connectors.find((connector) =>
        ['metaMask', 'injected', 'io.metamask', 'coinbaseWalletSDK'].includes(connector.id)
      ) ?? connectors[0]

    if (!preferredConnector) {
      setConnectError('未检测到浏览器钱包，请先安装 MetaMask 或 Coinbase Wallet')
      return
    }

    try {
      await connectAsync({
        connector: preferredConnector,
        chainId: bsc.id,
      })
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : '钱包连接失败，请重试')
    }
  }

  const handleDonate = async () => {
    if (!name.trim() || !amount) return
    if (!isConnected) {
      await connectWallet()
      return
    }
    await donate(name.trim(), parseFloat(amount))
  }

  const isProcessing =
    isConnectingWallet || !['idle', 'error', 'success'].includes(state.step)

  return (
    <AnimatePresence>
      {showDonateModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-space-black/90 backdrop-blur-sm"
            onClick={!isProcessing ? handleClose : undefined}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md metal-surface rounded-2xl overflow-hidden"
            style={{
              boxShadow: '0 0 60px rgba(255, 77, 0, 0.35), 0 0 120px rgba(255, 77, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
              border: '1px solid rgba(255, 140, 0, 0.3)',
            }}
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            {/* Top glow bar */}
            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #FF4D00, #FFD700, #FF4D00)' }} />

            {/* Corner decorations */}
            <div className="absolute top-4 left-4 w-3 h-3 border-t-2 border-l-2 border-ignite-orange opacity-60" />
            <div className="absolute top-4 right-12 w-3 h-3 border-t-2 border-r-2 border-ignite-orange opacity-60" />
            <div className="absolute bottom-4 left-4 w-3 h-3 border-b-2 border-l-2 border-ignite-orange opacity-60" />
            <div className="absolute bottom-4 right-4 w-3 h-3 border-b-2 border-r-2 border-ignite-orange opacity-60" />

            {/* Close */}
            {!isProcessing && (
              <button onClick={handleClose} className="absolute top-4 right-4 text-metal-light opacity-50 hover:opacity-100 z-10">
                <X size={18} />
              </button>
            )}

            <div className="p-6 space-y-4">
              {/* Energy badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,77,0,0.12)', border: '1px solid rgba(255,77,0,0.35)' }}
              >
                <Zap size={13} className="text-ignite-orange" />
                <span className="font-mono text-xs text-ignite-amber tracking-wider">
                  点火能量 +1% → {energyPercent}%
                </span>
              </div>

              {/* Title */}
              <div>
                <h2 className="font-display text-2xl font-bold" style={{ color: '#FFD700', textShadow: '0 0 20px rgba(255,215,0,0.5)' }}>
                  飞船蓄势待发！
                </h2>
                <p className="font-body text-sm text-metal-light opacity-70 mt-1.5 leading-relaxed">
                  感谢你的助力！捐赠 <span className="text-ignite-gold font-semibold">USDT</span> 支持{' '}
                  <span className="text-plasma-cyan font-semibold">Terafab</span> 火星任务，
                  <span className="text-ignite-orange"> 名留星际光荣榜 🏆</span>
                </p>
              </div>

              {/* Wallet status */}
              {isConnected && address && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-plasma-cyan" />
                  <span className="font-mono text-xs text-plasma-cyan">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                  <span className="font-mono text-[10px] text-metal-light opacity-40 ml-auto">BNB Chain</span>
                </div>
              )}

              {!hasWalletConnectProjectId && (
                <div
                  className="px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.14)' }}
                >
                  <span className="font-mono text-[11px] text-metal-light opacity-60">
                    当前为浏览器钱包直连模式；如需 WalletConnect，请配置 `VITE_WALLETCONNECT_PROJECT_ID`
                  </span>
                </div>
              )}

              {connectError && (
                <div
                  className="px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.22)' }}
                >
                  <span className="font-mono text-[11px] text-ignite-orange">{connectError}</span>
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* ── Prompt view ── */}
                {view === 'prompt' && state.step === 'idle' && (
                  <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <button
                      onClick={() => setView('form')}
                      className="w-full py-3.5 rounded-xl font-display font-bold text-white uppercase tracking-widest"
                      style={{
                        background: 'linear-gradient(135deg, #FF4D00, #FF8C00)',
                        boxShadow: '0 0 30px rgba(255,77,0,0.4)',
                        border: '1px solid rgba(255,215,0,0.25)',
                        letterSpacing: '0.12em',
                      }}
                    >
                      <Trophy size={15} className="inline mr-2" />
                      登上光荣榜 →
                    </button>
                    <button onClick={handleClose} className="w-full py-2 font-mono text-xs text-metal-light opacity-40 hover:opacity-70">
                      下次再说
                    </button>
                  </motion.div>
                )}

                {/* ── Form view ── */}
                {view === 'form' && state.step === 'idle' && (
                  <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="font-mono text-[10px] text-metal-light opacity-50 uppercase tracking-wider block mb-1.5">
                        光荣榜显示名称
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value.slice(0, 20))}
                        placeholder="你的名字 / 代号"
                        className="w-full px-4 py-2.5 rounded-lg font-mono text-sm text-metal-light bg-transparent outline-none"
                        style={{ border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(0,212,255,0.04)' }}
                        maxLength={20}
                        autoFocus
                      />
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="font-mono text-[10px] text-metal-light opacity-50 uppercase tracking-wider block mb-1.5">
                        捐赠金额 (USDT · BEP-20)
                      </label>
                      <div className="flex gap-2 mb-2">
                        {QUICK_AMOUNTS.map((a) => (
                          <button
                            key={a}
                            onClick={() => setAmount(String(a))}
                            className="flex-1 py-1.5 rounded font-mono text-xs transition-all"
                            style={{
                              border: `1px solid ${amount === String(a) ? '#FF8C00' : 'rgba(255,140,0,0.18)'}`,
                              background: amount === String(a) ? 'rgba(255,140,0,0.18)' : 'transparent',
                              color: amount === String(a) ? '#FF8C00' : '#506080',
                            }}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="自定义金额"
                        className="w-full px-4 py-2.5 rounded-lg font-mono text-sm text-metal-light bg-transparent outline-none"
                        style={{ border: '1px solid rgba(255,140,0,0.25)', background: 'rgba(255,140,0,0.04)' }}
                        min="1"
                      />
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleDonate}
                      disabled={!name.trim() || !amount}
                      className="w-full py-3.5 rounded-xl font-display font-bold text-white uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: name.trim() && amount ? 'linear-gradient(135deg, #FF4D00, #FF8C00)' : '#1a2a40',
                        boxShadow: name.trim() && amount ? '0 0 25px rgba(255,77,0,0.4)' : 'none',
                        letterSpacing: '0.1em',
                      }}
                    >
                      <Rocket size={15} className="inline mr-2" />
                      {isConnected ? '确认并发送 USDT' : '连接钱包并捐赠'}
                    </button>

                    <button onClick={() => setView('prompt')} className="w-full text-center font-mono text-xs text-metal-light opacity-30 hover:opacity-60">
                      ← 返回
                    </button>
                  </motion.div>
                )}

                {/* ── Processing state ── */}
                {isProcessing && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 py-2">
                    <StepIndicator step={state.step} />
                    {state.txHash && (
                      <a
                        href={`https://bscscan.com/tx/${state.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 font-mono text-xs text-plasma-cyan opacity-70 hover:opacity-100"
                      >
                        <ExternalLink size={11} />
                        在 BscScan 查看交易
                      </a>
                    )}
                  </motion.div>
                )}

                {/* ── Success state ── */}
                {state.step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4 space-y-3"
                  >
                    <motion.div
                      className="text-5xl"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      🎉
                    </motion.div>
                    <div
                      className="font-display text-xl font-bold"
                      style={{ color: '#00FFCC', textShadow: '0 0 20px rgba(0,255,204,0.5)' }}
                    >
                      上榜成功！
                    </div>
                    <p className="font-body text-sm text-metal-light opacity-60">
                      你已名留星际光荣榜，感谢支持 Terafab 火星任务 🚀
                    </p>
                    {state.confirmedTxHash && (
                      <a
                        href={`https://bscscan.com/tx/${state.confirmedTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-plasma-cyan"
                      >
                        <ExternalLink size={11} />
                        查看链上凭证
                      </a>
                    )}
                    <button
                      onClick={handleClose}
                      className="w-full py-2.5 rounded-xl font-mono text-sm mt-2"
                      style={{ border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' }}
                    >
                      关闭
                    </button>
                  </motion.div>
                )}

                {/* ── Error state ── */}
                {state.step === 'error' && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div
                      className="flex items-start gap-3 p-3 rounded-lg"
                      style={{ background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.25)' }}
                    >
                      <AlertTriangle size={16} className="text-ignite-orange mt-0.5 flex-shrink-0" />
                      <p className="font-mono text-xs text-ignite-amber">{state.errorMsg}</p>
                    </div>
                    <button
                      onClick={reset}
                      className="w-full py-2.5 rounded-xl font-mono text-sm"
                      style={{ border: '1px solid rgba(255,77,0,0.3)', color: '#FF8C00' }}
                    >
                      重试
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-px opacity-20" style={{ background: 'linear-gradient(90deg, transparent, #FF4D00, transparent)' }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
