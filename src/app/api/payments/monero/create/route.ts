import { db } from "@/lib/db"
import { convertBrlToXmr, generateMoneroPayment } from "@/lib/monero"
import { generateTrackingCode } from "@/lib/pix"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const { serviceType, amount, whatsappNumber } = await req.json()

        // Validate required fields
        if (!serviceType || !amount || amount <= 0) {
            return NextResponse.json(
                { error: "Service type and valid amount are required" },
                { status: 400 }
            )
        }

        // Convert BRL to XMR
        const xmrAmount = await convertBrlToXmr(amount)

        // Generate tracking code
        const trackingCode = generateTrackingCode()

        // Create order in database
        const order = await db.createOrder({
            tracking_code: trackingCode,
            service_type: serviceType,
            amount: amount, // Store BRL amount
            payment_method: "monero",
            status: "pending",
            whatsapp_number: whatsappNumber || undefined,
        })

        // Generate Monero payment request
        const moneroPayment = generateMoneroPayment({
            amount: xmrAmount,
            orderId: trackingCode,
            description: `${serviceType} - ${trackingCode}`,
        })

        // Return payment data
        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                trackingCode: order.tracking_code,
                serviceType: order.service_type,
                amount: order.amount, // BRL amount
                status: order.status,
                expiresAt: order.expires_at,
            },
            monero: {
                address: moneroPayment.address,
                amount: moneroPayment.amount, // XMR amount
                amountBrl: amount, // BRL amount for reference
                paymentUri: moneroPayment.paymentUri,
                qrCode: moneroPayment.qrCode,
                orderId: moneroPayment.orderId,
            },
            instructions: {
                pt: [
                    `Envie exatamente ${xmrAmount.toFixed(6)} XMR para o endereço acima`,
                    "Após enviar, copie o hash da transação (TX ID)",
                    `Envie o hash via WhatsApp: ${whatsappNumber || "seu número"}`,
                    "Ou cole o hash no site para verificação automática",
                    "Aguarde ~20 minutos para confirmação (10 blocos)",
                ],
                en: [
                    `Send exactly ${xmrAmount.toFixed(6)} XMR to the address above`,
                    "After sending, copy the transaction hash (TX ID)",
                    `Send the hash via WhatsApp: ${whatsappNumber || "your number"}`,
                    "Or paste the hash on the website for automatic verification",
                    "Wait ~20 minutes for confirmation (10 blocks)",
                ],
            },
            exchangeRate: {
                brlAmount: amount,
                xmrAmount: xmrAmount,
                note: "Exchange rate calculated at time of order creation",
            },
        })
    } catch (error) {
        console.error("Error creating Monero payment:", error)
        return NextResponse.json(
            { error: "Failed to create Monero payment" },
            { status: 500 }
        )
    }
}

// GET endpoint to retrieve Monero payment info
/* c8 ignore start */
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams
        const trackingCode = searchParams.get("trackingCode")

        if (!trackingCode) {
            return NextResponse.json(
                { error: "Tracking code is required" },
                { status: 400 }
            )
        }

        const order = await db.getOrderByTrackingCode(trackingCode)

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            )
        }

        if (order.payment_method !== "monero") {
            return NextResponse.json(
                { error: "Order is not a Monero payment" },
                { status: 400 }
            )
        }

        // Recalculate XMR amount (exchange rate might have changed)
        const xmrAmount = await convertBrlToXmr(order.amount)

        // Generate Monero payment data
        const moneroPayment = generateMoneroPayment({
            amount: xmrAmount,
            orderId: order.tracking_code,
            description: `${order.service_type} - ${order.tracking_code}`,
        })

        return NextResponse.json({
            success: true,
            order: {
                trackingCode: order.tracking_code,
                serviceType: order.service_type,
                amount: order.amount,
                status: order.status,
                createdAt: order.created_at,
                expiresAt: order.expires_at,
                moneroTxHash: order.tx_hash,
            },
            monero: {
                address: moneroPayment.address,
                amount: xmrAmount,
                amountBrl: order.amount,
                paymentUri: moneroPayment.paymentUri,
                qrCode: moneroPayment.qrCode,
            },
        })
    } catch (error) {
        console.error("Error retrieving Monero payment:", error)
        return NextResponse.json(
            { error: "Failed to retrieve Monero payment" },
            { status: 500 }
        )
    }
}
/* c8 ignore stop */
