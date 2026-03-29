/**
 * useDonation — Web3 USDT donation hook
 *
 * Handles the full donation flow:
 * 1. Connect wallet via Web3Modal
 * 2. Switch to BNB Smart Chain if needed
 * 3. Call USDT.transfer(recipient, amount)
 * 4. Wait for tx confirmation
 * 5. Submit txHash to backend for leaderboard
 */

import { useState, useCallback } from 'react'
import { useAccount, useWriteContract, useSwitchChain, usePublicClient } from 'wagmi'
import { parseUnits } from 'viem'
import {
  USDT_BSC_ADDRESS,
  USDT_ABI,
  bsc,
} from '@/utils/web3Config'
import { useSiteLanguage } from '@/i18n/siteLanguage'
import { submitDonationPending, fetchPublicConfig } from '@/utils/api'

export type DonationStep =
  | 'idle'
  | 'connecting'
  | 'switching_chain'
  | 'approving'        // not needed for USDT BEP-20, but kept for clarity
  | 'sending'
  | 'confirming'
  | 'submitting'
  | 'pending_review'
  | 'success'
  | 'error'

export interface DonationState {
  step: DonationStep
  txHash?: string
  errorMsg?: string
  confirmedTxHash?: string
  infoMsg?: string
}

export function useDonation() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()
  const { copy } = useSiteLanguage()

  const [state, setState] = useState<DonationState>({ step: 'idle' })

  const reset = useCallback(() => setState({ step: 'idle' }), [])

  const donate = useCallback(
    async (name: string, amountUSDT: number) => {
      if (!name || amountUSDT <= 0) return

      try {
        // ── Step 1: Ensure wallet is connected ────────────────────────────
        if (!isConnected || !address) {
          setState({ step: 'connecting' })
          // Web3Modal will handle the connection UI
          // We throw to let the component handle showing the modal
          throw new Error('WALLET_NOT_CONNECTED')
        }

        // ── Step 2: Switch to BSC if needed ───────────────────────────────
        if (chainId !== bsc.id) {
          setState({ step: 'switching_chain' })
          await switchChainAsync({ chainId: bsc.id })
        }

        // ── Step 3: Fetch recipient wallet from backend config ─────────────
        setState({ step: 'sending' })
        let recipientAddress: string
        try {
          const config = await fetchPublicConfig()
          recipientAddress = config.walletAddress
          if (!recipientAddress || recipientAddress === '0x' + '0'.repeat(40)) {
            throw new Error('Wallet address not configured')
          }
        } catch {
          throw new Error(copy.donate.errors.walletAddressMissing)
        }

        // ── Step 4: Send USDT transfer ────────────────────────────────────
        // USDT BEP-20 has 18 decimals on BSC
        const amountWei = parseUnits(amountUSDT.toString(), 18)

        const txHash = await writeContractAsync({
          address: USDT_BSC_ADDRESS,
          abi: USDT_ABI,
          functionName: 'transfer',
          args: [recipientAddress as `0x${string}`, amountWei],
          chainId: bsc.id,
        })

        setState({ step: 'confirming', txHash })

        // ── Step 5: Wait for 1 confirmation ───────────────────────────────
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({
            hash: txHash as `0x${string}`,
            confirmations: 1,
            timeout: 60_000,
          })
        }

        // ── Step 6: Submit to backend for leaderboard ─────────────────────
        setState({ step: 'submitting', txHash })

        const submission = await submitDonationPending({
          name,
          amount: amountUSDT,
          tx_hash: txHash,
        })

        if (submission.confirmed) {
          setState({
            step: 'success',
            confirmedTxHash: txHash,
            txHash,
            infoMsg: submission.message,
          })
        } else {
          setState({
            step: 'pending_review',
            confirmedTxHash: txHash,
            txHash,
            infoMsg: submission.message,
          })
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)

        // User rejected in wallet — friendly message
        if (msg.includes('rejected') || msg.includes('denied') || msg.includes('cancel')) {
          setState({ step: 'error', errorMsg: copy.donate.errors.userRejected })
        } else if (msg === 'WALLET_NOT_CONNECTED') {
          setState({ step: 'idle' }) // Let component show wallet connect modal
        } else {
          setState({ step: 'error', errorMsg: msg })
        }
      }
    },
    [address, chainId, copy.donate.errors.userRejected, copy.donate.errors.walletAddressMissing, isConnected, publicClient, switchChainAsync, writeContractAsync]
  )

  return { state, donate, reset, isConnected, address }
}
