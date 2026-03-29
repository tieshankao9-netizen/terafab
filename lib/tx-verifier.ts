import { createPublicClient, decodeEventLog, http } from 'viem'
import { bsc } from 'viem/chains'
import { getConfig } from './repository.js'

const BSCSCAN_API = 'https://api.bscscan.com/api'
const USDT_CONTRACT =
  process.env.USDT_CONTRACT ?? '0x55d398326f99059fF775485246999027B3197955'
const USDT_DECIMALS = 18
const DEFAULT_BSC_RPC_URL =
  process.env.BSC_RPC_URL ??
  bsc.rpcUrls.default.http[0] ??
  'https://bsc-dataseed.binance.org'
const TRANSFER_EVENT_ABI = [
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
  },
] as const

export interface VerifyResult {
  success: boolean
  confirmedAmount?: number
  fromAddress?: string
  toAddress?: string
  errorMsg?: string
}

function toDisplayAmount(rawAmount: bigint) {
  return Number(rawAmount) / Math.pow(10, USDT_DECIMALS)
}

async function verifyViaRpc(
  txHash: string,
  claimedAmount: number,
  walletAddress: string,
): Promise<VerifyResult> {
  const client = createPublicClient({
    chain: bsc,
    transport: http(DEFAULT_BSC_RPC_URL, {
      timeout: 12_000,
    }),
  })

  const receipt = await client.getTransactionReceipt({
    hash: txHash as `0x${string}`,
  })

  if (receipt.status !== 'success') {
    return { success: false, errorMsg: 'Transaction failed on chain' }
  }

  if (receipt.to?.toLowerCase() !== USDT_CONTRACT.toLowerCase()) {
    return { success: false, errorMsg: 'Transaction was not sent to USDT contract' }
  }

  const matchingLog = receipt.logs.find((log) => {
    if (log.address.toLowerCase() !== USDT_CONTRACT.toLowerCase()) {
      return false
    }

    try {
      const decoded = decodeEventLog({
        abi: TRANSFER_EVENT_ABI,
        data: log.data,
        topics: log.topics,
      })

      return decoded.eventName === 'Transfer'
    } catch {
      return false
    }
  })

  if (!matchingLog) {
    return { success: false, errorMsg: 'No USDT Transfer event found in transaction' }
  }

  const decodedLog = decodeEventLog({
    abi: TRANSFER_EVENT_ABI,
    data: matchingLog.data,
    topics: matchingLog.topics,
  })

  if (decodedLog.eventName !== 'Transfer') {
    return { success: false, errorMsg: 'No USDT Transfer event found in transaction' }
  }

  const fromAddress = String(decodedLog.args.from)
  const toAddress = String(decodedLog.args.to)
  const amountRaw = decodedLog.args.value as bigint
  const confirmedAmount = toDisplayAmount(amountRaw)
  const tolerance = claimedAmount * 0.01

  if (toAddress.toLowerCase() !== walletAddress.toLowerCase()) {
    return {
      success: false,
      errorMsg: `USDT was sent to ${toAddress}, not our wallet ${walletAddress}`,
    }
  }

  if (confirmedAmount < claimedAmount - tolerance) {
    return {
      success: false,
      errorMsg: `Amount mismatch: tx shows ${confirmedAmount} USDT, claimed ${claimedAmount} USDT`,
    }
  }

  return {
    success: true,
    confirmedAmount,
    fromAddress,
    toAddress,
  }
}

async function verifyViaBscScan(
  txHash: string,
  claimedAmount: number,
  walletAddress: string,
): Promise<VerifyResult> {
  const apiKey = process.env.BSCSCAN_API_KEY ?? ''
  const receiptUrl = `${BSCSCAN_API}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${apiKey}`
  const receiptRes = await fetch(receiptUrl)
  const receiptData = await receiptRes.json() as {
    result?: {
      status: string
      to: string
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
  if (receipt.status !== '0x1') {
    return { success: false, errorMsg: 'Transaction failed on chain' }
  }

  if (receipt.to?.toLowerCase() !== USDT_CONTRACT.toLowerCase()) {
    return { success: false, errorMsg: 'Transaction was not sent to USDT contract' }
  }

  const transferTopic =
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

  const transferLog = receipt.logs?.find(
    (log) =>
      log.address?.toLowerCase() === USDT_CONTRACT.toLowerCase() &&
      log.topics?.[0]?.toLowerCase() === transferTopic,
  )

  if (!transferLog) {
    return { success: false, errorMsg: 'No USDT Transfer event found in transaction' }
  }

  const toAddress = `0x${transferLog.topics[2].slice(-40)}`
  if (toAddress.toLowerCase() !== walletAddress.toLowerCase()) {
    return {
      success: false,
      errorMsg: `USDT was sent to ${toAddress}, not our wallet ${walletAddress}`,
    }
  }

  const amountRaw = BigInt(transferLog.data)
  const confirmedAmount = toDisplayAmount(amountRaw)
  const tolerance = claimedAmount * 0.01

  if (confirmedAmount < claimedAmount - tolerance) {
    return {
      success: false,
      errorMsg: `Amount mismatch: tx shows ${confirmedAmount} USDT, claimed ${claimedAmount} USDT`,
    }
  }

  const fromAddress = `0x${transferLog.topics[1].slice(-40)}`

  return {
    success: true,
    confirmedAmount,
    fromAddress,
    toAddress,
  }
}

export async function verifyUsdtTx(
  txHash: string,
  claimedAmount: number,
): Promise<VerifyResult> {
  const walletAddress = (await getConfig('wallet_address')) ?? ''

  if (!walletAddress || walletAddress === '0x' + '0'.repeat(40)) {
    return { success: false, errorMsg: 'Recipient wallet not configured' }
  }

  try {
    return await verifyViaRpc(txHash, claimedAmount, walletAddress)
  } catch (error) {
    try {
      return await verifyViaBscScan(txHash, claimedAmount, walletAddress)
    } catch (fallbackError) {
      return {
        success: false,
        errorMsg:
          fallbackError instanceof Error
            ? fallbackError.message
            : error instanceof Error
              ? error.message
              : 'Unknown verification error',
      }
    }
  }
}
