/**
 * Terafab Global State Store (Zustand)
 * Stage 2 update: supports real API, socket sync, live donations
 */

import { create } from 'zustand'

export interface Donation {
  id: number
  name: string
  amount: number
  tx_hash: string
  created_at: string
}

export type LaunchPhase =
  | 'idle'
  | 'charging'
  | 'countdown'
  | 'ignition'
  | 'launched'
  | 'boosting'

interface GameState {
  totalLikes: number
  energyPercent: number
  likesToLaunch: number
  launchPhase: LaunchPhase
  hasLaunched: boolean
  hasVoted: boolean

  showDonateModal: boolean
  showSuccessModal: boolean
  showLeaderboard: boolean
  isLaunching: boolean
  lastLikeTimestamp: number

  boostFlareActive: boolean
  shockwaveActive: boolean

  liveDonations: Donation[]
  serverConnected: boolean
  isLoadingInitial: boolean

  addLike: () => void
  setEnergyPercent: (val: number) => void
  triggerLaunch: () => void
  completeLaunch: () => void
  triggerBoost: () => void
  setShowDonateModal: (val: boolean) => void
  setShowSuccessModal: (val: boolean) => void
  setShowLeaderboard: (val: boolean) => void
  setHasVoted: (val: boolean) => void
  setServerConnected: (val: boolean) => void
  setInitialState: (total: number, energyPercent: number, launched: boolean, likesToLaunch: number) => void
}

const INITIAL_LIKES = 0
const INITIAL_LIKES_TO_LAUNCH = 10000

const calcEnergy = (likes: number, likesToLaunch: number) =>
  Math.min(100, Math.floor((likes / likesToLaunch) * 100))

export const useGameStore = create<GameState>((set, get) => ({
  totalLikes: INITIAL_LIKES,
  energyPercent: calcEnergy(INITIAL_LIKES, INITIAL_LIKES_TO_LAUNCH),
  likesToLaunch: INITIAL_LIKES_TO_LAUNCH,
  launchPhase: 'charging',
  hasLaunched: false,
  hasVoted: false,

  showDonateModal: false,
  showSuccessModal: false,
  showLeaderboard: false,
  isLaunching: false,
  lastLikeTimestamp: 0,

  boostFlareActive: false,
  shockwaveActive: false,

  liveDonations: [],
  serverConnected: false,
  isLoadingInitial: true,

  setInitialState: (total, energyPercent, launched, likesToLaunch) => {
    set({
      totalLikes: total,
      energyPercent,
      likesToLaunch,
      hasLaunched: launched,
      isLoadingInitial: false,
      launchPhase: launched
        ? 'launched'
        : energyPercent >= 90
        ? 'countdown'
        : energyPercent > 0
        ? 'charging'
        : 'idle',
    })
  },

  addLike: () => {
    const { totalLikes, likesToLaunch, hasLaunched, triggerLaunch, triggerBoost } = get()
    const newLikes = totalLikes + 1
    const newEnergy = calcEnergy(newLikes, likesToLaunch)
    const willLaunch = newEnergy >= 100 && !hasLaunched

    set({
      totalLikes: newLikes,
      energyPercent: newEnergy,
      hasVoted: true,
      lastLikeTimestamp: Date.now(),
      showDonateModal: true,
    })

    if (willLaunch) {
      setTimeout(() => triggerLaunch(), 600)
    } else if (hasLaunched) {
      triggerBoost()
    } else if (newEnergy >= 90) {
      set({ launchPhase: 'countdown' })
    }
  },

  setEnergyPercent: (val) => set({ energyPercent: val }),

  triggerLaunch: () => {
    set({ launchPhase: 'ignition', isLaunching: true, shockwaveActive: true })
    setTimeout(() => {
      set({ launchPhase: 'launched', isLaunching: false, hasLaunched: true })
    }, 4000)
    setTimeout(() => set({ shockwaveActive: false }), 2000)
  },

  completeLaunch: () => set({ launchPhase: 'launched', hasLaunched: true }),

  triggerBoost: () => {
    set({ boostFlareActive: true, launchPhase: 'boosting' })
    setTimeout(() => set({ boostFlareActive: false, launchPhase: 'launched' }), 1000)
  },

  setShowDonateModal: (val) => set({ showDonateModal: val }),
  setShowSuccessModal: (val) => set({ showSuccessModal: val }),
  setShowLeaderboard: (val) => set({ showLeaderboard: val }),
  setHasVoted: (val) => set({ hasVoted: val }),
  setServerConnected: (val) => set({ serverConnected: val }),
}))
