import { getConfig } from './repository'

const BSCSCAN_API = 'https://api.bscscan.com/api'
const USDT_CONTRACT =
  process.env.USDT_CONTRACT ?? '0x55d398326f99059fF775485246999027B3197955'
const USDT_DECIMALS = 18

export interface VerifyResult {
  success: boolean
  confirmedAmount?: number
  fromAddress?: string
  toAddress?: string
  errorMsg?: string
}

export async function verifyUsdtTx(
  txHash: string,
  claimedAmount: number,
): Promise<VerifyResult> {
  const apiKey = process.env.BSCSCAN_API_KEY ?? ''
  const walletAddress = (await getConfig('wallet_address')) ?? ''

  if (!walletAddress || walletAddress === '0x' + '0'.repeat(40)) {
    return { success: false, errorMsg: 'Recipient wallet not configured' }
  }

  try {
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
    const confirmedAmount = Number(amountRaw) / Math.pow(10, USDT_DECIMALS)
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
  } catch (error) {
    return {
      success: false,
      errorMsg: error instanceof Error ? error.message : 'Unknown verification error',
    }
  }
}
