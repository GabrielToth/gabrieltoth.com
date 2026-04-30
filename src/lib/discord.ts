// Discord webhook integration for payment notifications (FREE)

export interface DiscordNotification {
    title: string
    description: string
    color?: number
    fields?: Array<{
        name: string
        value: string
        inline?: boolean
    }>
}

// Discord webhook for payment notifications
export async function sendDiscordNotification(
    notification: DiscordNotification
) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL

    if (!webhookUrl) {
        console.log("Discord webhook not configured, skipping notification")
        return
    }

    const embed = {
        title: notification.title,
        description: notification.description,
        color: notification.color || 0x00ff00, // Green by default
        fields: notification.fields || [],
        timestamp: new Date().toISOString(),
        footer: {
            text: "Gabriel Toth Payment System",
        },
    }

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: "Payment Bot",
                avatar_url:
                    "https://cdn-icons-png.flaticon.com/512/891/891462.png",
                embeds: [embed],
            }),
        })

        if (!response.ok) {
            /* c8 ignore next */
            console.error("Discord webhook failed:", response.status)
        } else {
            console.log("Discord notification sent successfully")
        }
    } catch (error) {
        /* c8 ignore next */
        console.error("Error sending Discord notification:", error)
    }
}

// Specific notification types
export async function notifyNewOrder(orderData: {
    trackingCode: string
    serviceType: string
    amount: number
    paymentMethod: string
    whatsappNumber?: string
}) {
    await sendDiscordNotification({
        title: "💰 New Order Created",
        description: `Order **${orderData.trackingCode}** created successfully!`,
        color: 0x0099ff, // Blue
        fields: [
            {
                name: "🔧 Service",
                value: orderData.serviceType,
                inline: true,
            },
            {
                name: "💰 Amount",
                value: `$${orderData.amount}`,
                inline: true,
            },
            {
                name: "💳 Method",
                value: orderData.paymentMethod.toUpperCase(),
                inline: true,
            },
            {
                name: "📱 WhatsApp",
                value: orderData.whatsappNumber || "Not provided",
                inline: true,
            },
        ],
    })
}

export async function notifyPaymentConfirmed(orderData: {
    trackingCode: string
    serviceType: string
    amount: number
    paymentMethod: string
    txHash?: string
}) {
    await sendDiscordNotification({
        title: "✅ Payment Confirmed!",
        description: `Order **${orderData.trackingCode}** was paid successfully!`,
        color: 0x00ff00, // Green
        fields: [
            {
                name: "🔧 Service",
                value: orderData.serviceType,
                inline: true,
            },
            {
                name: "💰 Amount",
                value: `$${orderData.amount}`,
                inline: true,
            },
            {
                name: "💳 Method",
                value: orderData.paymentMethod.toUpperCase(),
                inline: true,
            },
            ...(orderData.txHash
                ? [
                      {
                          name: "🔗 Hash",
                          value: `\`${orderData.txHash.substring(0, 16)}...\``,
                          inline: false,
                      },
                  ]
                : []),
        ],
    })
}

export async function notifyWhatsAppMessage(data: {
    from: string
    message: string
    action: string
}) {
    await sendDiscordNotification({
        title: "💬 WhatsApp Message",
        description: "New message from WhatsApp",
        color: 0x25d366, // WhatsApp green
        fields: [
            {
                name: "📱 Number",
                value: data.from,
                inline: true,
            },
            {
                name: "💬 Message",
                value:
                    data.message.substring(0, 100) +
                    (data.message.length > 100 ? "..." : ""),
                inline: false,
            },
            {
                name: "⚡ Action",
                value: data.action,
                inline: true,
            },
        ],
    })
}

export async function notifyError(error: {
    type: string
    message: string
    details?: string
}) {
    await sendDiscordNotification({
        title: "❌ System Error",
        description: `Error detected: **${error.type}**`,
        color: 0xff0000, // Red
        fields: [
            {
                name: "🚨 Error",
                value: error.message,
                inline: false,
            },
            ...(error.details
                ? [
                      {
                          name: "📋 Details",
                          value: error.details.substring(0, 500),
                          inline: false,
                      },
                  ]
                : []),
        ],
    })
}

export async function notifyContactMessage(data: {
    name: string
    email: string
    subject: string
    message: string
    locale: string
    ip?: string
}) {
    await sendDiscordNotification({
        title: "📨 New Contact Message",
        description: "A new contact form submission was received.",
        color: 0x7289da,
        fields: [
            { name: "👤 Name", value: data.name, inline: true },
            { name: "✉️ Email", value: data.email, inline: true },
            { name: "🌐 Locale", value: data.locale, inline: true },
            ...(data.ip
                ? [{ name: "🖥️ IP", value: data.ip, inline: true }]
                : []),
            { name: "📝 Subject", value: data.subject, inline: false },
            {
                name: "💬 Message",
                value:
                    (data.message || "").substring(0, 500) +
                    ((data.message || "").length > 500 ? "..." : ""),
                inline: false,
            },
        ],
    })
}
