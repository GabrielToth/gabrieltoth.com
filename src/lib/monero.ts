// Monero transaction verification using blockchain APIs and view keys

export interface MoneroTransactionVerification {
    txHash: string
    expectedAmount: number
    orderId: string
    viewKey?: string
    address?: string
}

export interface MoneroVerificationResult {
    isValid: boolean
    amount?: number
    confirmations?: number
    error?: string
}

// Default Monero configuration
const MONERO_VIEW_KEY = process.env.MONERO_VIEW_KEY || "your_view_key_here"
const MONERO_ADDRESS = process.env.MONERO_ADDRESS || "your_monero_address_here"
const MIN_CONFIRMATIONS = 10

// Verify Monero transaction using blockchain explorer APIs
export async function verifyMoneroTransaction(
    verification: MoneroTransactionVerification
): Promise<MoneroVerificationResult> {
    try {
        // First, check if transaction exists
        const txExists = await checkTransactionExists(verification.txHash)
        if (!txExists.exists) {
            return {
                isValid: false,
                error: "Transaction not found on blockchain",
            }
        }

        // Get transaction details
        const txDetails = await getTransactionDetails(verification.txHash)
        if (!txDetails) {
            return {
                isValid: false,
                error: "Could not retrieve transaction details",
            }
        }

        // Check confirmations
        if (txDetails.confirmations < MIN_CONFIRMATIONS) {
            return {
                isValid: false,
                confirmations: txDetails.confirmations,
                error: `Insufficient confirmations (${txDetails.confirmations}/${MIN_CONFIRMATIONS})`,
            }
        }

        // Verify amount (allow for small differences due to exchange rates)
        const amountDifference = Math.abs(
            txDetails.amount - verification.expectedAmount
        )
        const allowedDifference = verification.expectedAmount * 0.05 // 5% tolerance

        if (amountDifference > allowedDifference) {
            return {
                isValid: false,
                amount: txDetails.amount,
                error: `Amount mismatch. Expected: ${verification.expectedAmount}, Got: ${txDetails.amount}`,
            }
        }

        // If we have view key and address, verify outputs
        if (verification.viewKey && verification.address) {
            const outputVerification = await verifyTransactionOutputs(
                verification.txHash,
                verification.viewKey,
                verification.address
            )

            if (!outputVerification.isValid) {
                return {
                    isValid: false,
                    error: "Transaction outputs do not match provided address",
                }
            }
        }

        return {
            isValid: true,
            amount: txDetails.amount,
            confirmations: txDetails.confirmations,
        }
    } catch (error) {
        console.error("Monero verification error:", error)
        return {
            isValid: false,
            error: "Verification service temporarily unavailable",
        }
    }
}

// Check if transaction exists on blockchain
/* c8 ignore start */
async function checkTransactionExists(
    txHash: string
): Promise<{ exists: boolean; height?: number }> {
    try {
        // Using xmrchain.net API (free blockchain explorer)
        const response = await fetch(
            `https://xmrchain.net/api/transaction/${txHash}`,
            {
                headers: {
                    Accept: "application/json",
                },
            }
        )

        if (response.status === 404) {
            return { exists: false }
        }

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()
        return {
            exists: data.status === "success",
            height: data.data?.block_height,
        }
    } catch (error) {
        console.error("Error checking transaction existence:", error)
        // Fallback to alternative explorer
        return checkTransactionExistsAlternative(txHash)
    }
}

// Alternative blockchain explorer check
async function checkTransactionExistsAlternative(
    txHash: string
): Promise<{ exists: boolean; height?: number }> {
    try {
        // Using monero.observer API as fallback
        const response = await fetch(`https://monero.observer/api/tx/${txHash}`)

        if (response.status === 404) {
            return { exists: false }
        }

        const data = await response.json()
        return {
            exists: !!data.tx_hash,
            height: data.block_height,
        }
    } catch (error) {
        console.error("Alternative API also failed:", error)
        return { exists: false }
    }
}

// Get detailed transaction information
async function getTransactionDetails(txHash: string): Promise<{
    amount: number
    confirmations: number
    timestamp: number
} | null> {
    try {
        const response = await fetch(
            `https://xmrchain.net/api/transaction/${txHash}`
        )

        if (!response.ok) {
            return null
        }

        const data = await response.json()

        if (data.status !== "success") {
            return null
        }

        const tx = data.data

        // Calculate confirmations
        const currentHeight = await getCurrentBlockHeight()
        const confirmations = currentHeight
            ? Math.max(0, currentHeight - tx.block_height + 1)
            : 0

        // Extract total output amount (simplified)
        const totalAmount =
            tx.outputs?.reduce((sum: number, output: { amount?: number }) => {
                return sum + (output.amount || 0)
            }, 0) || 0

        return {
            amount: totalAmount / 1e12, // Convert from atomic units to XMR
            confirmations,
            timestamp: tx.timestamp || 0,
        }
    } catch (error) {
        console.error("Error getting transaction details:", error)
        return null
    }
}

// Get current blockchain height
async function getCurrentBlockHeight(): Promise<number | null> {
    try {
        const response = await fetch("https://xmrchain.net/api/networkinfo")

        if (!response.ok) {
            return null
        }

        const data = await response.json()
        return data.data?.height || null
    } catch (error) {
        console.error("Error getting block height:", error)
        return null
    }
}

// Verify transaction outputs using view key (simplified)
async function verifyTransactionOutputs(
    txHash: string,
    viewKey: string,
    address: string
): Promise<{ isValid: boolean; amount?: number }> {
    try {
        // This is a simplified implementation
        // In production, you would use proper Monero libraries
        // or a dedicated service that can properly verify outputs

        // For now, we'll do a basic check using the view key
        const response = await fetch(
            `https://xmrchain.net/api/outputs/${txHash}/${viewKey}/${address}`
        )

        if (!response.ok) {
            return { isValid: false }
        }

        const data = await response.json()

        if (data.status !== "success") {
            return { isValid: false }
        }

        const outputs = data.data?.outputs || []
        const totalAmount = outputs.reduce(
            (sum: number, output: { amount?: number }) =>
                sum + (output.amount || 0),
            0
        )

        return {
            isValid: outputs.length > 0,
            amount: totalAmount / 1e12, // Convert to XMR
        }
    } catch (error) {
        console.error("Error verifying outputs:", error)
        return { isValid: false }
    }
}
/* c8 ignore stop */

// Generate Monero payment request
export interface MoneroPaymentRequest {
    amount: number // in XMR
    orderId: string
    description?: string
}

export function generateMoneroPayment(request: MoneroPaymentRequest) {
    const address = MONERO_ADDRESS
    const viewKey = MONERO_VIEW_KEY

    // Generate payment URI
    const paymentUri = `monero:${address}?amount=${request.amount}&recipient_name=Gabriel Toth&tx_description=${encodeURIComponent(request.description || request.orderId)}`

    return {
        address,
        amount: request.amount,
        paymentUri,
        qrCode: paymentUri, // Can be used to generate QR code
        orderId: request.orderId,
        viewKey: viewKey.substring(0, 16) + "...", // Partial view key for display
    }
}

// Convert BRL to XMR (simplified - use real exchange rate API)
export async function convertBrlToXmr(brlAmount: number): Promise<number> {
    try {
        // Using CoinGecko API for exchange rates
        const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=monero&vs_currencies=brl"
        )

        if (!response.ok) {
            throw new Error("Failed to fetch exchange rate")
        }

        const data = await response.json()
        const xmrPriceBrl = data.monero?.brl

        if (!xmrPriceBrl) {
            throw new Error("XMR price not available")
        }

        return brlAmount / xmrPriceBrl
    } catch (error) {
        /* c8 ignore next */
        console.error("Error converting BRL to XMR:", error)
        // Fallback rate (update regularly)
        const fallbackRate = 800 // 1 XMR = ~800 BRL (approximate)
        return brlAmount / fallbackRate
    }
}

// Validate Monero transaction hash format
export function isValidMoneroTxHash(hash: string): boolean {
    return /^[a-fA-F0-9]{64}$/.test(hash)
}

// Validate Monero address format
export function isValidMoneroAddress(address: string): boolean {
    // Basic validation for Monero address format
    return /^[48][0-9A-Ba-b]{94}$/.test(address)
}

// Get transaction status for user display
export async function getMoneroTransactionStatus(txHash: string): Promise<{
    status: "pending" | "confirming" | "confirmed" | "failed"
    confirmations: number
    requiredConfirmations: number
}> {
    /* c8 ignore start */
    try {
        const details = await getTransactionDetails(txHash)

        if (!details) {
            return {
                status: "failed",
                confirmations: 0,
                requiredConfirmations: MIN_CONFIRMATIONS,
            }
        }

        let status: "pending" | "confirming" | "confirmed" | "failed"

        if (details.confirmations === 0) {
            status = "pending"
        } else if (details.confirmations < MIN_CONFIRMATIONS) {
            status = "confirming"
        } else {
            status = "confirmed"
        }

        return {
            status,
            confirmations: details.confirmations,
            requiredConfirmations: MIN_CONFIRMATIONS,
        }
    } catch (error) {
        console.error("Error getting transaction status:", error)
        return {
            status: "failed",
            confirmations: 0,
            requiredConfirmations: MIN_CONFIRMATIONS,
        }
    }
    /* c8 ignore stop */
}
