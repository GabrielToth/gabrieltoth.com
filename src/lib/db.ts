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

export interface User {
    id: string
    google_id: string
    google_email: string
    google_name: string
    google_picture?: string
    created_at: string
    updated_at: string
}

export interface Session {
    id: string
    user_id: string
    session_id: string
    created_at: string
    expires_at: string
}

const orders: Order[] = []
const confirmations: PaymentConfirmation[] = []
const users: User[] = []
const sessions: Session[] = []

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
    // User methods
    async queryOne<T>(
        query: string,
        params?: (string | number | null)[]
    ): Promise<T | null> {
        // Parse simple SQL queries for in-memory storage
        if (query.includes("SELECT") && query.includes("FROM users")) {
            if (query.includes("WHERE google_id")) {
                const user = users.find(u => u.google_id === params?.[0])
                return (user as T) || null
            }
            if (query.includes("WHERE id")) {
                const user = users.find(u => u.id === params?.[0])
                return (user as T) || null
            }
        }

        if (query.includes("INSERT INTO users")) {
            const newUser: User = {
                id: generateId(),
                google_id: params?.[0] as string,
                google_email: params?.[1] as string,
                google_name: params?.[2] as string,
                google_picture: (params?.[3] as string) || undefined,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
            users.push(newUser)
            return (newUser as T) || null
        }

        if (query.includes("UPDATE users")) {
            const userIndex = users.findIndex(u => u.google_id === params?.[2])
            if (userIndex !== -1) {
                users[userIndex] = {
                    ...users[userIndex],
                    google_name:
                        (params?.[0] as string) || users[userIndex].google_name,
                    google_picture:
                        (params?.[1] as string) ||
                        users[userIndex].google_picture,
                    updated_at: new Date().toISOString(),
                }
                return (users[userIndex] as T) || null
            }
        }

        // Handle session queries
        if (query.includes("SELECT") && query.includes("FROM sessions")) {
            if (query.includes("WHERE session_id")) {
                const session = sessions.find(s => s.session_id === params?.[0])
                return (session as T) || null
            }
        }

        if (query.includes("INSERT INTO sessions")) {
            const newSession: Session = {
                id: generateId(),
                user_id: params?.[0] as string,
                session_id: params?.[1] as string,
                created_at: new Date().toISOString(),
                expires_at:
                    (params?.[2] as string) ||
                    new Date(
                        Date.now() + 30 * 24 * 60 * 60 * 1000
                    ).toISOString(),
            }
            sessions.push(newSession)
            return (newSession as T) || null
        }

        return null
    },

    async query<T>(
        query: string,
        params?: (string | number | null)[]
    ): Promise<T[]> {
        // Parse simple SQL queries for in-memory storage
        if (query.includes("SELECT") && query.includes("FROM users")) {
            return (users as T[]) || []
        }

        // Handle session deletion
        if (query.includes("DELETE FROM sessions")) {
            if (query.includes("WHERE session_id")) {
                const sessionIndex = sessions.findIndex(
                    s => s.session_id === params?.[0]
                )
                if (sessionIndex !== -1) {
                    sessions.splice(sessionIndex, 1)
                    return [{ rowCount: 1 } as T]
                }
                return [{ rowCount: 0 } as T]
            }
        }

        return []
    },
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
