import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Globe2, ShieldCheck, Sparkles } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const NOTICE_SECTIONS = [
  {
    title: 'Official Presence',
    body:
      'terafab.top is currently the only official Terafab website and public channel. There are no official X, Telegram, Discord, Instagram, YouTube, or other media accounts at this time. Any other page, handle, group, or direct message claiming to represent Terafab should be treated as unofficial unless it is published on terafab.top itself.',
    color: '#00D4FF',
  },
  {
    title: 'Entertainment-Led Social Experiment',
    body:
      'Support and donation activity on terafab.top is presented as an entertainment-focused public social experiment. Participation is voluntary and is intended for community engagement, on-site interaction, and cultural experimentation. It should not be interpreted as an investment product, financial solicitation, or promise of return.',
    color: '#FF8C00',
  },
  {
    title: 'Possible Retroactive NFT Review',
    body:
      'If verified participation reaches meaningful scale, Terafab may review on-chain supporters for a retroactive commemorative NFT airdrop experiment in the future. Any snapshot, eligibility review, or distribution would remain entirely discretionary and cannot be guaranteed.',
    color: '#FFD700',
  },
]

export default function OfficialNoticeModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-space-black/92 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="official-notice-title"
            className="relative w-full max-w-3xl overflow-hidden rounded-[28px]"
            style={{
              background:
                'linear-gradient(180deg, rgba(11,19,34,0.98) 0%, rgba(5,9,16,0.98) 100%)',
              border: '1px solid rgba(0,212,255,0.18)',
              boxShadow:
                '0 0 80px rgba(0,212,255,0.08), 0 0 120px rgba(255,140,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
            initial={{ scale: 0.94, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 18 }}
            transition={{ type: 'spring', damping: 22, stiffness: 220 }}
          >
            <div
              className="h-[2px]"
              style={{
                background: 'linear-gradient(90deg, #00D4FF 0%, #FF8C00 50%, #FFD700 100%)',
              }}
            />

            <div className="relative max-h-[calc(100vh-3rem)] overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
              <div
                className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full blur-3xl"
                style={{ background: 'rgba(0,212,255,0.12)' }}
              />
              <div
                className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full blur-3xl"
                style={{ background: 'rgba(255,140,0,0.1)' }}
              />

              <div className="relative">
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                    style={{
                      background: 'rgba(0,212,255,0.09)',
                      border: '1px solid rgba(0,212,255,0.22)',
                    }}
                  >
                    <ShieldCheck size={14} className="text-plasma-cyan" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-plasma-cyan">
                      Official Notice
                    </span>
                  </div>

                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                    style={{
                      background: 'rgba(255,140,0,0.08)',
                      border: '1px solid rgba(255,140,0,0.2)',
                    }}
                  >
                    <Globe2 size={14} className="text-ignite-amber" />
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ignite-amber">
                      terafab.top only
                    </span>
                  </div>
                </div>

                <h2
                  id="official-notice-title"
                  className="mt-5 max-w-2xl font-display text-3xl font-black leading-tight sm:text-4xl"
                  style={{
                    color: '#F5F7FB',
                    textShadow: '0 0 24px rgba(255,255,255,0.08)',
                  }}
                >
                  Please verify the domain before you participate.
                </h2>

                <p className="mt-4 max-w-2xl font-body text-sm leading-7 text-metal-light opacity-78 sm:text-[15px]">
                  This notice appears to every visitor because domain verification and expectation
                  setting matter. Please review the following before connecting a wallet, sending
                  funds, or relying on any third-party message about Terafab.
                </p>

                <div className="mt-6 rounded-2xl px-4 py-4 sm:px-5">
                  <div
                    className="rounded-2xl px-4 py-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,212,255,0.03))',
                      border: '1px solid rgba(0,212,255,0.15)',
                    }}
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-plasma-cyan opacity-75">
                      Official domain
                    </div>
                    <div className="mt-2 font-display text-2xl font-bold text-white">
                      terafab.top
                    </div>
                    <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-metal-light opacity-38">
                      Always verify the domain before interacting
                    </div>
                  </div>
                </div>

                <div className="mt-2 grid gap-4">
                  {NOTICE_SECTIONS.map((section, index) => (
                    <motion.div
                      key={section.title}
                      className="rounded-2xl px-4 py-4 sm:px-5 sm:py-5"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${section.color}1f`,
                      }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * index }}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} style={{ color: section.color }} />
                        <div
                          className="font-mono text-[11px] uppercase tracking-[0.24em]"
                          style={{ color: section.color }}
                        >
                          {section.title}
                        </div>
                      </div>
                      <p className="mt-3 font-body text-sm leading-7 text-metal-light opacity-76 sm:text-[15px]">
                        {section.body}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-4 border-t border-white/6 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-xl font-mono text-[11px] leading-6 text-metal-light opacity-38">
                    By continuing, you acknowledge that Terafab is presented as an interactive
                    entertainment experience and that any future NFT review would be discretionary,
                    conditional, and not guaranteed.
                  </p>

                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-space-black transition-transform hover:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
                      boxShadow: '0 0 28px rgba(255,140,0,0.24)',
                    }}
                  >
                    Enter terafab.top
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
