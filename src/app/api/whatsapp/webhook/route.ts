import { verifyMoneroTransaction } from "@/lib/monero"
import { db } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

// WhatsApp Webhook verification (GET)
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const mode = searchParams.get("hub.mode")
    const token = searchParams.get("hub.verify_token")
    const challenge = searchParams.get("hub.challenge")

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log("WhatsApp webhook verified")
        return new NextResponse(challenge)
    }

    return new NextResponse("Forbidden", { status: 403 })
}

// WhatsApp Message processing (POST)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        // Process incoming WhatsApp messages
        if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
            const message = body.entry[0].changes[0].value.messages[0]
            const from = message.from
            const text = message.text?.body || ""

            console.log(`WhatsApp message from ${from}: ${text}`)

            await processWhatsAppMessage(from, text)
        }

        return new NextResponse("OK")
    } catch (error) {
        console.error("WhatsApp webhook error:", error)
        return new NextResponse("Error processing webhook", { status: 500 })
    }
}

async function processWhatsAppMessage(from: string, text: string) {
    try {
        // Clean phone number (remove country code prefix if present)
        const cleanNumber = from.replace(/^\+?55/, "").replace(/\D/g, "")

        // Check if it's a Monero transaction hash (64 hex characters)
        if (text.length === 64 && /^[a-fA-F0-9]+$/.test(text)) {
            await processMoneroTxHash(cleanNumber, text)
            return
        }

        // Check if it's a tracking code query
        if (text.toUpperCase().startsWith("TRACK-")) {
            await sendOrderStatus(cleanNumber, text.toUpperCase())
            return
        }

        // Check for help commands
        if (
            text.toLowerCase().includes("help") ||
            text.toLowerCase().includes("ajuda")
        ) {
            await sendHelpMessage(cleanNumber)
            return
        }

        // Check for status commands
        if (
            text.toLowerCase().includes("status") ||
            text.toLowerCase().includes("pedido")
        ) {
            await sendUserOrders(cleanNumber)
            return
        }

        // Default response for unrecognized messages
        await sendHelpMessage(cleanNumber)
    } catch (error) {
        console.error("Error processing WhatsApp message:", error)
        await sendWhatsAppMessage(
            from,
            "❌ Erro interno. Tente novamente em alguns minutos."
        )
    }
}

async function processMoneroTxHash(whatsappNumber: string, txHash: string) {
    try {
        // Find pending Monero orders for this WhatsApp number
        const orders = await db.getOrdersByWhatsApp(whatsappNumber, "pending")
        const moneroOrders = orders.filter(
            order => order.payment_method === "monero"
        )

        if (moneroOrders.length === 0) {
            await sendWhatsAppMessage(
                whatsappNumber,
                `
❌ *Nenhum pedido Monero pendente encontrado*

Para criar um novo pedido, acesse:
https://gabrieltoth.com

Precisa de ajuda? Digite "ajuda"
            `
            )
            return
        }

        // Process the most recent order
        const order = moneroOrders[0]

        // Verify Monero transaction
        const verification = await verifyMoneroTransaction({
            txHash,
            expectedAmount: order.amount * 0.01, // Convert BRL to approximate XMR
            orderId: order.tracking_code,
        })

        if (verification.isValid) {
            // Update order status
            await db.updateOrderStatus(order.id, "confirmed", {
                tx_hash: txHash,
            })

            // Add payment confirmation
            await db.addPaymentConfirmation(order.id, "monero_hash")

            // Discord notification (FREE)
            try {
                const { notifyPaymentConfirmed, notifyWhatsAppMessage } =
                    await import("@/lib/discord")
                await Promise.all([
                    notifyPaymentConfirmed({
                        trackingCode: order.tracking_code,
                        serviceType: order.service_type,
                        amount: order.amount,
                        paymentMethod: "monero",
                        txHash: txHash,
                    }),
                    notifyWhatsAppMessage({
                        from: whatsappNumber,
                        message: txHash,
                        action: "Monero payment confirmed",
                    }),
                ])
            } catch (error) {
                console.error("Discord notification failed:", error)
            }

            // Send confirmation message
            await sendWhatsAppMessage(
                whatsappNumber,
                `
✅ *Pagamento Monero Confirmado!*

📋 Código: \`${order.tracking_code}\`
🔧 Serviço: ${order.service_type}
💰 Valor: R$ ${order.amount}
🔗 Hash: \`${txHash.substring(0, 8)}...${txHash.substring(-8)}\`

🚀 Seu serviço será processado e você receberá mais informações em breve!

Para acompanhar: envie o código ${order.tracking_code}
            `
            )
        } else {
            await sendWhatsAppMessage(
                whatsappNumber,
                `
❌ *Transação Monero não confirmada*

Hash recebido: \`${txHash.substring(0, 8)}...${txHash.substring(-8)}\`

Possíveis causas:
• Transação ainda não confirmada (aguarde ~20 min)
• Valor incorreto
• Hash inválido

Tente novamente em alguns minutos ou entre em contato conosco.
            `
            )
        }
    } catch (error) {
        console.error("Error processing Monero hash:", error)
        await sendWhatsAppMessage(
            whatsappNumber,
            `
❌ *Erro ao verificar transação Monero*

Tente novamente em alguns minutos ou entre em contato conosco.
        `
        )
    }
}

async function sendOrderStatus(whatsappNumber: string, trackingCode: string) {
    try {
        const order = await db.getOrderByTrackingCode(trackingCode)

        if (!order) {
            await sendWhatsAppMessage(
                whatsappNumber,
                `
❌ *Pedido não encontrado*

Código: \`${trackingCode}\`

Verifique se:
• O código foi digitado corretamente
• O pedido não expirou (válido por 7 dias)

Precisa de ajuda? Digite "ajuda"
            `
            )
            return
        }

        const statusEmoji = {
            pending: "⏳",
            confirmed: "✅",
            failed: "❌",
        }

        const statusText = {
            pending: "Aguardando pagamento",
            confirmed: "Pagamento confirmado",
            failed: "Pagamento falhou",
        }

        await sendWhatsAppMessage(
            whatsappNumber,
            `
${statusEmoji[order.status]} *Status do Pedido*

📋 Código: \`${order.tracking_code}\`
🔧 Serviço: ${order.service_type}
💰 Valor: R$ ${order.amount}
💳 Método: ${order.payment_method.toUpperCase()}
📅 Criado: ${new Date(order.created_at).toLocaleDateString("pt-BR")}

Status: *${statusText[order.status]}*

${order.status === "pending" ? "💡 Finalize o pagamento para prosseguir." : ""}
${order.status === "confirmed" ? "🚀 Processaremos seu serviço em breve!" : ""}
${order.status === "failed" ? "❌ Problema com o pagamento." : ""}
        `
        )
    } catch (error) {
        console.error("Error getting order status:", error)
        await sendWhatsAppMessage(
            whatsappNumber,
            "❌ Erro ao consultar pedido. Tente novamente."
        )
    }
}

async function sendUserOrders(whatsappNumber: string) {
    try {
        const orders = await db.getOrdersByWhatsApp(whatsappNumber)

        if (orders.length === 0) {
            await sendWhatsAppMessage(
                whatsappNumber,
                `
📋 *Nenhum pedido encontrado*

Para criar um novo pedido, acesse:
https://gabrieltoth.com

Nossos serviços:
                • SpeedPC
• Gerenciamento de Canais
• Consultoria em Analytics
            `
            )
            return
        }

        let message = "📋 *Seus Pedidos*\n\n"

        orders.slice(0, 5).forEach(order => {
            // Show last 5 orders
            const statusEmoji = {
                pending: "⏳",
                confirmed: "✅",
                failed: "❌",
            }

            message += `${statusEmoji[order.status]} \`${order.tracking_code}\`\n`
            message += `${order.service_type} - R$ ${order.amount}\n`
            message += `${new Date(order.created_at).toLocaleDateString("pt-BR")}\n\n`
        })

        message += "💡 Para detalhes, envie o código do pedido"

        await sendWhatsAppMessage(whatsappNumber, message)
    } catch (error) {
        console.error("Error getting user orders:", error)
        await sendWhatsAppMessage(
            whatsappNumber,
            "❌ Erro ao consultar pedidos. Tente novamente."
        )
    }
}

async function sendHelpMessage(whatsappNumber: string) {
    await sendWhatsAppMessage(
        whatsappNumber,
        `
🤖 *Gabriel Toth Payment Bot*

*Comandos disponíveis:*

🔸 Envie um *hash Monero* (64 caracteres)
   Para confirmar pagamento XMR

🔸 Envie um *código de pedido* (TRACK-XXXX-XXXX-XXXX)
   Para consultar status

🔸 Digite *"status"* ou *"pedido"*
   Para ver seus pedidos

🔸 Digite *"ajuda"* ou *"help"*
   Para ver este menu

*Serviços disponíveis:*
                • 🖥️ SpeedPC Gaming
• 📺 Gerenciamento de Canais
• 📊 Consultoria em Analytics
• 🎮 Suporte WaveIGL

🌐 Site: https://gabrieltoth.com
📧 Email: gabriel@gabrieltoth.com
    `
    )
}

async function sendWhatsAppMessage(to: string, message: string) {
    try {
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

        if (!phoneNumberId || !accessToken) {
            console.error("Missing WhatsApp configuration")
            return
        }

        // Ensure phone number has country code
        const formattedNumber = to.startsWith("55") ? to : `55${to}`

        const response = await fetch(
            `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: formattedNumber,
                    type: "text",
                    text: { body: message },
                }),
            }
        )

        if (!response.ok) {
            const errorData = await response.text()
            console.error("WhatsApp API error:", errorData)
        } else {
            console.log(`Message sent to ${formattedNumber}`)
        }
    } catch (error) {
        console.error("Error sending WhatsApp message:", error)
    }
}
