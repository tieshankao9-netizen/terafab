/**
 * BscScan Transaction Verifier — Stage 4
 *
 * Verifies that a given txHash is a real USDT transfer
 * to our wallet address with at least the claimed amount.
 *
 * Uses BscScan API v2 (free tier — 5 req/sec, 100k/day).
 */

import { getConfig } from '../db/database'

const BSCSCAN_API = 'https://api.bscscan.com/api'
const USDT_CONTRACT = process.env.USDT_CONTRACT ?? '0x55d398326f99059fF775485246999027B3197955'
const USDT_DECIMALS = 18

export interface VerifyResult {
  success: boolean
  confirmedAmount?: number
  fromAddress?: string
  toAddress?: string
  errorMsg?: string
}

/**
 * Fetch a transaction from BscScan and verify it's a valid USDT transfer
 * to our wallet with at least `claimedAmount` USDT.
 */
export async function verifyUsdtTx(
  txHash: string,
  claimedAmount: number
): Promise<VerifyResult> {
  const apiKey = process.env.BSCSCAN_API_KEY ?? ''
  const walletAddress = getConfig('wallet_address') ?? ''

  if (!walletAddress || walletAddress === '0x' + '0'.repeat(40)) {
    return { success: false, errorMsg: 'Recipient wallet not configured' }
  }

  try {
    // ── Fetch tx receipt ─────────────────────────────────────────────────────
    const receiptUrl = `${BSCSCAN_API}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${apiKey}`
    const receiptRes = await fetch(receiptUrl)
    const receiptData = await receiptRes.json() as {
      result?: {
        status: string
        to: string
        from: string
        logs?: Array<{
          address: string
          topics: string[]
          data: string
        }>
      }
    }

    if (!receiptData.result) {
      return { success: false, errorMsg: 'Transaction not found on BSC' }
    }

    const receipt = receiptData.result

    // Check tx succeeded
    if (receipt.status !== '0x1') {
      return { success: false, errorMsg: 'Transaction failed on chain' }
    }

    // Check tx was sent to the USDT contract
    if (receipt.to?.toLowerCase() !== USDT_CONTRACT.toLowerCase()) {
      return { success: false, errorMsg: 'Transaction was not sent to USDT contract' }
    }

    // ── Parse ERC-20 Transfer event ──────────────────────────────────────────
    // Transfer(address indexed from, address indexed to, uint256 value)
    // topic[0] = keccak256("Transfer(address,address,uint256)")
    const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

    const transferLog = receipt.logs?.find(
      (log) =>
        log.address?.toLowerCase() === USDT_CONTRACT.toLowerCase() &&
        log.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC
    )

    if (!transferLog) {
      return { success: false, errorMsg: 'No USDT Transfer event found in transaction' }
    }

    // Decode recipient address from topic[2] (padded 32 bytes → last 20 bytes)
    const toAddressRaw = transferLog.topics[2]
    const toAddress = '0x' + toAddressRaw.slice(-40)

    if (toAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return {
        success: false,
        errorMsg: `USDT was sent to ${toAddress}, not our wallet ${walletAddress}`,
      }
    }

    // Decode amount from data field
    const amountHex = transferLog.data
    const amountRaw = BigInt(amountHex)
    const confirmedAmount = Number(amountRaw) / Math.pow(10, USDT_DECIMALS)

    // Verify claimed amount matches (allow 1% tolerance for rounding)
    const tolerance = claimedAmount * 0.01
    if (confirmedAmount < claimedAmount - tolerance) {
      return {
        success: false,
        errorMsg: `Amount mismatch: tx shows ${confirmedAmount} USDT, claimed ${claimedAmount} USDT`,
      }
    }

    // Decode sender
    const fromAddressRaw = transferLog.topics[1]
    const fromAddress = '0x' + fromAddressRaw.slice(-40)

    return {
      success: true,
      confirmedAmount,
      fromAddress,
      toAddress,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, errorMsg: `Verification error: ${msg}` }
  }
}

/**
 * Check if a transaction has enough confirmations (≥12 for safety).
 */
export async function hasSufficientConfirmations(
  txHash: string,
  minConfirmations = 12
): Promise<boolean> {
  const apiKey = process.env.BSCSCAN_API_KEY ?? ''

  try {
    // Get latest block number
    const blockUrl = `${BSCSCAN_API}?module=proxy&action=eth_blockNumber&apikey=${apiKey}`
    const blockRes = await fetch(blockUrl)
    const blockData = await blockRes.json() as { result?: string }
    const latestBlock = parseInt(blockData.result ?? '0', 16)

    // Get tx block number
    const txUrl = `${BSCSCAN_API}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${apiKey}`
    const txRes = await fetch(txUrl)
    const txData = await txRes.json() as { result?: { blockNumber?: string } }
    const txBlock = parseInt(txData.result?.blockNumber ?? '0', 16)

    if (!txBlock) return false
    return latestBlock - txBlock >= minConfirmations
  } catch {
    return false
  }
}
