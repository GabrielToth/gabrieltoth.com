import { db } from "@/lib/db"
import { generatePixQR, generateTrackingCode } from "@/lib/pix"
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

        // Generate tracking code
        const trackingCode = generateTrackingCode()

        // Create order in database
        const order = await db.createOrder({
            tracking_code: trackingCode,
            service_type: serviceType,
            amount: amount,
            payment_method: "pix",
            status: "pending",
            whatsapp_number: whatsappNumber || undefined,
        })

        // Generate PIX QR Code
        const pixData = await generatePixQR({
            amount: amount,
            description: `${serviceType} - ${trackingCode}`,
            orderId: trackingCode,
        })

        // Send Discord notification (FREE)
        try {
            const { notifyNewOrder } = await import("@/lib/discord")
            await notifyNewOrder({
                trackingCode: order.tracking_code,
                serviceType: order.service_type,
                amount: order.amount,
                paymentMethod: "pix",
                whatsappNumber: order.whatsapp_number,
            })
        } catch (error) {
            /* c8 ignore next */
            console.error("Discord notification failed:", error)
            // Continue execution even if Discord fails
        }

        // Return payment data
        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                trackingCode: order.tracking_code,
                serviceType: order.service_type,
                amount: order.amount,
                status: order.status,
                expiresAt: order.expires_at,
            },
            pix: {
                qrCode: pixData.qrCode,
                copyPasteCode: pixData.copyPasteCode,
                pixKey: pixData.pixKey,
                amount: pixData.amount,
            },
            instructions: {
                pt: [
                    "Escaneie o QR Code PIX com seu banco",
                    "Ou copie e cole o código PIX",
                    "Confirme o pagamento no seu app",
                    "O pagamento será verificado automaticamente",
                ],
                en: [
                    "Scan the PIX QR Code with your bank app",
                    "Or copy and paste the PIX code",
                    "Confirm payment in your app",
                    "Payment will be verified automatically",
                ],
            },
        })
    } catch (error) {
        console.error("Error creating PIX payment:", error)
        return NextResponse.json(
            { error: "Failed to create PIX payment" },
            { status: 500 }
        )
    }
}

// GET endpoint to retrieve PIX payment info
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

        if (order.payment_method !== "pix") {
            return NextResponse.json(
                { error: "Order is not a PIX payment" },
                { status: 400 }
            )
        }

        // Regenerate PIX data if still pending
        let pixData = null
        if (order.status === "pending") {
            pixData = await generatePixQR({
                amount: order.amount,
                description: `${order.service_type} - ${order.tracking_code}`,
                orderId: order.tracking_code,
            })
        }

        return NextResponse.json({
            success: true,
            order: {
                trackingCode: order.tracking_code,
                serviceType: order.service_type,
                amount: order.amount,
                status: order.status,
                createdAt: order.created_at,
                expiresAt: order.expires_at,
            },
            pix: pixData,
        })
    } catch (error) {
        console.error("Error retrieving PIX payment:", error)
        return NextResponse.json(
            { error: "Failed to retrieve PIX payment" },
            { status: 500 }
        )
    }
}
/* c8 ignore stop */
