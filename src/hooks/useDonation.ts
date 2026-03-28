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
import { submitDonationPending, fetchPublicConfig } from '@/utils/api'

export type DonationStep =
  | 'idle'
  | 'connecting'
  | 'switching_chain'
  | 'approving'        // not needed for USDT BEP-20, but kept for clarity
  | 'sending'
  | 'confirming'
  | 'submitting'
  | 'success'
  | 'error'

export interface DonationState {
  step: DonationStep
  txHash?: string
  errorMsg?: string
  confirmedTxHash?: string
}

export function useDonation() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()

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
          throw new Error('无法获取收款地址，请联系管理员')
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

        await submitDonationPending({
          name,
          amount: amountUSDT,
          tx_hash: txHash,
        })

        setState({ step: 'success', confirmedTxHash: txHash, txHash })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)

        // User rejected in wallet — friendly message
        if (msg.includes('rejected') || msg.includes('denied') || msg.includes('cancel')) {
          setState({ step: 'error', errorMsg: '你取消了交易 💫 下次再来！' })
        } else if (msg === 'WALLET_NOT_CONNECTED') {
          setState({ step: 'idle' }) // Let component show wallet connect modal
        } else {
          setState({ step: 'error', errorMsg: msg })
        }
      }
    },
    [isConnected, address, chainId, switchChainAsync, writeContractAsync, publicClient]
  )

  return { state, donate, reset, isConnected, address }
}
