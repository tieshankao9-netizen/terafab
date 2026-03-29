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
import { useSiteLanguage } from '@/i18n/siteLanguage'
import { useDonation, DonationStep } from '@/hooks/useDonation'
import { bsc } from '@/utils/web3Config'
import { hasWalletConnectProjectId } from '@/utils/runtimeConfig'

const QUICK_AMOUNTS = [10, 50, 100, 500]
const DONATION_DRAFT_KEY = 'terafab_donation_draft'

interface DonationDraft {
  name: string
  amount: string
  view: 'prompt' | 'form'
  resumeOnReload: boolean
}

function readDonationDraft(): DonationDraft | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(DONATION_DRAFT_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<DonationDraft>
    return {
      name: String(parsed.name ?? ''),
      amount: String(parsed.amount ?? ''),
      view: parsed.view === 'prompt' ? 'prompt' : 'form',
      resumeOnReload: Boolean(parsed.resumeOnReload),
    }
  } catch {
    return null
  }
}

function writeDonationDraft(draft: DonationDraft) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(DONATION_DRAFT_KEY, JSON.stringify(draft))
}

function clearDonationDraft() {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(DONATION_DRAFT_KEY)
}

function StepIndicator({
  step,
  labels,
}: {
  step: DonationStep
  labels: Partial<Record<DonationStep, string>>
}) {
  const isActive = !['idle', 'pending_review', 'success', 'error'].includes(step)
  const label = labels[step] ?? ''
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
  const { copy } = useSiteLanguage()
  const { state, donate, reset, isConnected, address } = useDonation()

  const [view, setView] = useState<'prompt' | 'form'>('prompt')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [connectError, setConnectError] = useState('')
  const [formError, setFormError] = useState('')
  const [draftRestored, setDraftRestored] = useState(false)

  useEffect(() => {
    const draft = readDonationDraft()
    if (!draft) return

    setName(draft.name)
    setAmount(draft.amount)
    setView(draft.view)

    if (draft.resumeOnReload) {
      setDraftRestored(true)
      setShowDonateModal(true)
    }
  }, [setShowDonateModal])

  // Reset transient request state when modal closes, but keep the draft.
  useEffect(() => {
    if (!showDonateModal) {
      const timer = window.setTimeout(() => {
        setConnectError('')
        setFormError('')
        reset()
      }, 400)

      return () => window.clearTimeout(timer)
    }
  }, [showDonateModal, reset])

  useEffect(() => {
    if (state.step === 'success' || state.step === 'pending_review') {
      clearDonationDraft()
    }
  }, [state.step])

  useEffect(() => {
    const hasDraftContent = Boolean(name.trim() || amount || view === 'form' || showDonateModal)
    if (!hasDraftContent) return

    writeDonationDraft({
      name,
      amount,
      view,
      resumeOnReload:
        showDonateModal && !['success', 'pending_review'].includes(state.step),
    })
  }, [amount, name, showDonateModal, state.step, view])

  const resetDraftState = () => {
    setView('prompt')
    setName('')
    setAmount('')
    setConnectError('')
    setFormError('')
    setDraftRestored(false)
    clearDonationDraft()
    reset()
  }

  const handleClose = (options?: { clearDraft?: boolean }) => {
    if (options?.clearDraft) {
      resetDraftState()
    } else {
      writeDonationDraft({
        name,
        amount,
        view,
        resumeOnReload: false,
      })
    }

    setShowDonateModal(false)
  }

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
      setConnectError(copy.donate.errors.noWallet)
      return
    }

    try {
      await connectAsync({
        connector: preferredConnector,
        chainId: bsc.id,
      })
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : copy.donate.errors.connectFailed)
    }
  }

  const handleDonate = async () => {
    const parsedAmount = Number(amount)

    setFormError('')
    if (!name.trim()) return
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError(copy.donate.invalidAmount)
      return
    }

    if (!isConnected) {
      await connectWallet()
      return
    }

    await donate(name.trim(), parsedAmount)
  }

  const isProcessing =
    isConnectingWallet || !['idle', 'pending_review', 'error', 'success'].includes(state.step)
  const parsedAmount = Number(amount)
  const canSubmit = Boolean(name.trim()) && Number.isFinite(parsedAmount) && parsedAmount > 0 && !isProcessing
  const handleDismiss = () =>
    handleClose({ clearDraft: state.step === 'success' || state.step === 'pending_review' })

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
            onClick={!isProcessing ? handleDismiss : undefined}
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
              <button onClick={handleDismiss} className="absolute top-4 right-4 text-metal-light opacity-50 hover:opacity-100 z-10">
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
                  {copy.donate.energyBoost(energyPercent)}
                </span>
              </div>

              {/* Title */}
              <div>
                <h2 className="font-display text-2xl font-bold" style={{ color: '#FFD700', textShadow: '0 0 20px rgba(255,215,0,0.5)' }}>
                  {copy.donate.title}
                </h2>
                <p className="font-body text-sm text-metal-light opacity-70 mt-1.5 leading-relaxed">
                  {copy.donate.body}
                </p>
              </div>

              <div
                className="rounded-xl px-3 py-3"
                style={{
                  background: 'rgba(255, 215, 0, 0.05)',
                  border: '1px solid rgba(255, 215, 0, 0.14)',
                }}
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-ignite-gold opacity-75">
                  {copy.home.entertainmentBadge}
                </div>
                <p className="mt-2 font-body text-xs leading-relaxed text-metal-light opacity-65">
                  {copy.donate.entertainmentNote}
                </p>
              </div>

              <div
                className="rounded-xl px-3 py-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.08), rgba(255, 215, 0, 0.05))',
                  border: '1px solid rgba(255, 140, 0, 0.2)',
                }}
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-ignite-orange opacity-80">
                  {copy.donate.airdropHintTitle}
                </div>
                <p className="mt-2 font-body text-xs leading-relaxed text-metal-light opacity-72">
                  {copy.donate.airdropHintBody}
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
                  <span className="font-mono text-[10px] text-metal-light opacity-40 ml-auto">
                    {copy.donate.walletChain}
                  </span>
                </div>
              )}

              {!hasWalletConnectProjectId && (
                <div
                  className="px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.14)' }}
                >
                  <span className="font-mono text-[11px] text-metal-light opacity-60">
                    {copy.donate.walletConnectHint}
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

              {draftRestored && state.step === 'idle' && (
                <div
                  className="px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.18)' }}
                >
                  <span className="font-mono text-[11px] text-plasma-cyan">{copy.donate.draftRestored}</span>
                </div>
              )}

              {formError && state.step === 'idle' && (
                <div
                  className="px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.22)' }}
                >
                  <span className="font-mono text-[11px] text-ignite-orange">{formError}</span>
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* ── Prompt view ── */}
                {view === 'prompt' && state.step === 'idle' && (
                  <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <button
                      onClick={() => {
                        setFormError('')
                        setView('form')
                      }}
                      className="w-full py-3.5 rounded-xl font-display font-bold text-white uppercase tracking-widest"
                      style={{
                        background: 'linear-gradient(135deg, #FF4D00, #FF8C00)',
                        boxShadow: '0 0 30px rgba(255,77,0,0.4)',
                        border: '1px solid rgba(255,215,0,0.25)',
                        letterSpacing: '0.12em',
                      }}
                    >
                      <Trophy size={15} className="inline mr-2" />
                      {copy.donate.joinBoard} →
                    </button>
                    <button onClick={handleDismiss} className="w-full py-2 font-mono text-xs text-metal-light opacity-40 hover:opacity-70">
                      {copy.donate.maybeLater}
                    </button>
                  </motion.div>
                )}

                {/* ── Form view ── */}
                {view === 'form' && state.step === 'idle' && (
                  <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="font-mono text-[10px] text-metal-light opacity-50 uppercase tracking-wider block mb-1.5">
                        {copy.donate.nameLabel}
                      </label>
                      <input
                        value={name}
                        onChange={(e) => {
                          setFormError('')
                          setDraftRestored(false)
                          setName(e.target.value.slice(0, 20))
                        }}
                        placeholder={copy.donate.namePlaceholder}
                        className="w-full px-4 py-2.5 rounded-lg font-mono text-sm text-metal-light bg-transparent outline-none"
                        style={{ border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(0,212,255,0.04)' }}
                        maxLength={20}
                        autoFocus
                      />
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="font-mono text-[10px] text-metal-light opacity-50 uppercase tracking-wider block mb-1.5">
                        {copy.donate.amountLabel}
                      </label>
                      <div className="flex gap-2 mb-2">
                        {QUICK_AMOUNTS.map((a) => (
                          <button
                            key={a}
                            onClick={() => {
                              setFormError('')
                              setDraftRestored(false)
                              setAmount(String(a))
                            }}
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
                        onChange={(e) => {
                          setFormError('')
                          setDraftRestored(false)
                          setAmount(e.target.value)
                        }}
                        placeholder={copy.donate.customAmount}
                        className="w-full px-4 py-2.5 rounded-lg font-mono text-sm text-metal-light bg-transparent outline-none"
                        style={{ border: '1px solid rgba(255,140,0,0.25)', background: 'rgba(255,140,0,0.04)' }}
                        min="1"
                      />
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleDonate}
                      disabled={!canSubmit}
                      className="w-full py-3.5 rounded-xl font-display font-bold text-white uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: canSubmit ? 'linear-gradient(135deg, #FF4D00, #FF8C00)' : '#1a2a40',
                        boxShadow: canSubmit ? '0 0 25px rgba(255,77,0,0.4)' : 'none',
                        letterSpacing: '0.1em',
                      }}
                    >
                      <Rocket size={15} className="inline mr-2" />
                      {isConnected ? copy.donate.submitConnected : copy.donate.submitDisconnected}
                    </button>

                    <button onClick={() => setView('prompt')} className="w-full text-center font-mono text-xs text-metal-light opacity-30 hover:opacity-60">
                      ← {copy.donate.back}
                    </button>
                  </motion.div>
                )}

                {/* ── Processing state ── */}
                {isProcessing && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 py-2">
                    <StepIndicator step={state.step} labels={copy.donate.steps} />
                    {state.txHash && (
                      <a
                        href={`https://bscscan.com/tx/${state.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 font-mono text-xs text-plasma-cyan opacity-70 hover:opacity-100"
                      >
                        <ExternalLink size={11} />
                        {copy.donate.viewTx}
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
                      {copy.donate.successTitle}
                    </div>
                    <p className="font-body text-sm text-metal-light opacity-60">
                      {copy.donate.successBody}
                    </p>
                    {state.confirmedTxHash && (
                      <a
                        href={`https://bscscan.com/tx/${state.confirmedTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-plasma-cyan"
                      >
                        <ExternalLink size={11} />
                        {copy.donate.viewProof}
                      </a>
                    )}
                    <button
                      onClick={() => handleClose({ clearDraft: true })}
                      className="w-full py-2.5 rounded-xl font-mono text-sm mt-2"
                      style={{ border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' }}
                    >
                      {copy.donate.close}
                    </button>
                  </motion.div>
                )}

                {/* ── Pending review state ── */}
                {state.step === 'pending_review' && (
                  <motion.div
                    key="pending-review"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4 space-y-3"
                  >
                    <div
                      className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
                      style={{ background: 'rgba(255, 140, 0, 0.12)', border: '1px solid rgba(255, 140, 0, 0.25)' }}
                    >
                      <AlertTriangle size={24} className="text-ignite-amber" />
                    </div>
                    <div
                      className="font-display text-xl font-bold"
                      style={{ color: '#FFD700', textShadow: '0 0 20px rgba(255,215,0,0.35)' }}
                    >
                      {copy.donate.pendingTitle}
                    </div>
                    <p className="font-body text-sm text-metal-light opacity-70">
                      {state.infoMsg ?? copy.donate.pendingBody}
                    </p>
                    {state.confirmedTxHash && (
                      <a
                        href={`https://bscscan.com/tx/${state.confirmedTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-plasma-cyan"
                      >
                        <ExternalLink size={11} />
                        {copy.donate.viewProof}
                      </a>
                    )}
                    <button
                      onClick={() => handleClose({ clearDraft: true })}
                      className="w-full py-2.5 rounded-xl font-mono text-sm mt-2"
                      style={{ border: '1px solid rgba(255,140,0,0.3)', color: '#FFB347' }}
                    >
                      {copy.donate.pendingClose}
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
                      {copy.donate.retry}
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
