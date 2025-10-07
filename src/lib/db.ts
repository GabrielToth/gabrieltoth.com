export interface Order {
    id: string
    tracking_code: string
    service_type: string
    amount: number
    payment_method: "pix" | "monero"
    status: "pending" | "confirmed" | "failed"
    whatsapp_number?: string
    tx_hash?: string
    created_at: string
    expires_at: string
}

export interface PaymentConfirmation {
    id: string
    order_id: string
    confirmation_method: string
    confirmed_at: string
}

const orders: Order[] = []
const confirmations: PaymentConfirmation[] = []

/* c8 ignore start */
function generateId(): string {
    try {
        // @ts-ignore Node 18+
        return (
            globalThis.crypto?.randomUUID?.() ||
            Math.random().toString(36).slice(2)
        )
    } catch {
        return Math.random().toString(36).slice(2)
    }
}
/* c8 ignore stop */

export const db = {
    async createOrder(
        orderData: Omit<Order, "id" | "created_at" | "expires_at">
    ): Promise<Order> {
        const now = Date.now()
        const order: Order = {
            id: generateId(),
            created_at: new Date(now).toISOString(),
            expires_at: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
            ...orderData,
        }
        orders.push(order)
        return order
    },

    async getOrderByTrackingCode(trackingCode: string): Promise<Order | null> {
        return orders.find(o => o.tracking_code === trackingCode) || null
    },

    async getOrderByTxHash(txHash: string): Promise<Order | null> {
        return (
            orders.find(
                o => o.tx_hash === txHash && o.payment_method === "monero"
            ) || null
        )
    },

    async getOrdersByWhatsApp(
        whatsappNumber: string,
        status?: string
    ): Promise<Order[]> {
        return orders.filter(o => {
            if (o.whatsapp_number !== whatsappNumber) return false
            if (status && o.status !== status) return false
            return true
        })
    },

    async updateOrderStatus(
        orderId: string,
        status: Order["status"],
        additionalData?: Partial<Order>
    ): Promise<Order> {
        const idx = orders.findIndex(o => o.id === orderId)
        if (idx === -1) throw new Error("Order not found")
        orders[idx] = { ...orders[idx], status, ...(additionalData || {}) }
        return orders[idx]
    },

    async addPaymentConfirmation(
        orderId: string,
        method: string
    ): Promise<PaymentConfirmation> {
        const confirmation: PaymentConfirmation = {
            id: generateId(),
            order_id: orderId,
            confirmation_method: method,
            confirmed_at: new Date().toISOString(),
        }
        confirmations.push(confirmation)
        return confirmation
    },

    async cleanupExpiredOrders(): Promise<void> {
        const cutoff = Date.now()
        for (let i = orders.length - 1; i >= 0; i--) {
            if (Date.parse(orders[i].expires_at) < cutoff) {
                orders.splice(i, 1)
            }
        }
    },
}
