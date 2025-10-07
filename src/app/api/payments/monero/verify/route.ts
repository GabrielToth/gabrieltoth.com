import { db } from "@/lib/db"
import {
    convertBrlToXmr,
    isValidMoneroTxHash,
    verifyMoneroTransaction,
} from "@/lib/monero"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const { txHash, trackingCode, whatsappNumber } = await req.json()

        // Validate transaction hash format
        if (!txHash || !isValidMoneroTxHash(txHash)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid Monero transaction hash format",
                    details: "Hash must be 64 hexadecimal characters",
                },
                { status: 400 }
            )
        }

        // Find order by tracking code or WhatsApp number
        let order = null

        if (trackingCode) {
            order = await db.getOrderByTrackingCode(trackingCode)
        } else if (whatsappNumber) {
            const orders = await db.getOrdersByWhatsApp(
                whatsappNumber,
                "pending"
            )
            const moneroOrders = orders.filter(
                o => o.payment_method === "monero"
            )
            order = moneroOrders[0] // Get the most recent pending Monero order
        }

        if (!order) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Order not found",
                    details:
                        "No pending Monero order found for provided information",
                },
                { status: 404 }
            )
        }

        if (order.payment_method !== "monero") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid payment method",
                    details: "Order is not a Monero payment",
                },
                { status: 400 }
            )
        }

        if (order.status !== "pending") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Order already processed",
                    details: `Order status is: ${order.status}`,
                    currentStatus: order.status,
                },
                { status: 400 }
            )
        }

        // Update order status to pending (will change to confirmed if valid)
        await db.updateOrderStatus(order.id, "pending", {
            tx_hash: txHash,
        })

        // Convert BRL amount to expected XMR amount
        const expectedXmrAmount = await convertBrlToXmr(order.amount)

        // Verify Monero transaction
        const verification = await verifyMoneroTransaction({
            txHash,
            expectedAmount: expectedXmrAmount,
            orderId: order.tracking_code,
        })

        if (verification.isValid) {
            // Payment confirmed
            await db.updateOrderStatus(order.id, "confirmed", {
                tx_hash: txHash,
            })

            // Add payment confirmation record
            await db.addPaymentConfirmation(order.id, "monero_verification")

            return NextResponse.json({
                success: true,
                verified: true,
                order: {
                    trackingCode: order.tracking_code,
                    serviceType: order.service_type,
                    amount: order.amount,
                    status: "confirmed",
                },
                transaction: {
                    hash: txHash,
                    amount: verification.amount,
                    confirmations: verification.confirmations,
                },
                message:
                    "Payment verified successfully! Your service will be processed shortly.",
            })
        } else {
            // Verification failed - reset to pending
            await db.updateOrderStatus(order.id, "pending")

            return NextResponse.json({
                success: false,
                verified: false,
                error: verification.error || "Transaction verification failed",
                order: {
                    trackingCode: order.tracking_code,
                    status: "pending",
                },
                transaction: {
                    hash: txHash,
                    confirmations: verification.confirmations || 0,
                },
                retryInfo: {
                    canRetry: true,
                    waitTime:
                        verification.confirmations !== undefined
                            ? Math.max(0, (10 - verification.confirmations) * 2)
                            : 20,
                    message:
                        verification.confirmations !== undefined
                            ? `Transaction has ${verification.confirmations}/10 confirmations. Please wait.`
                            : "Transaction not found or invalid. Please check and try again.",
                },
            })
        }
    } catch (error) {
        console.error("Error verifying Monero transaction:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Verification service temporarily unavailable",
                details: "Please try again in a few minutes",
            },
            { status: 500 }
        )
    }
}

// GET endpoint to check transaction status
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams
        const txHash = searchParams.get("txHash")
        const trackingCode = searchParams.get("trackingCode")

        if (!txHash && !trackingCode) {
            return NextResponse.json(
                { error: "Transaction hash or tracking code is required" },
                { status: 400 }
            )
        }

        let order = null

        if (trackingCode) {
            order = await db.getOrderByTrackingCode(trackingCode)
        } else if (txHash) {
            // Find order by transaction hash (in-memory)
            order = await db.getOrderByTxHash(txHash)
        }

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            )
        }

        // Get current transaction status if hash is available
        let transactionStatus = null
        if (order.tx_hash) {
            const { getMoneroTransactionStatus } = await import("@/lib/monero")
            transactionStatus = await getMoneroTransactionStatus(order.tx_hash)
        }

        return NextResponse.json({
            success: true,
            order: {
                trackingCode: order.tracking_code,
                serviceType: order.service_type,
                amount: order.amount,
                status: order.status,
                createdAt: order.created_at,
                moneroTxHash: order.tx_hash,
            },
            transaction: transactionStatus
                ? {
                      hash: order.tx_hash,
                      status: transactionStatus.status,
                      confirmations: transactionStatus.confirmations,
                      requiredConfirmations:
                          transactionStatus.requiredConfirmations,
                  }
                : null,
        })
    } catch (error) {
        console.error("Error checking transaction status:", error)
        return NextResponse.json(
            { error: "Failed to check transaction status" },
            { status: 500 }
        )
    }
}
