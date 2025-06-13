import { createClient } from "@supabase/supabase-js"

// Database Types - MINIMAL DATA STORAGE (FREE TIER OPTIMIZED)
export interface Order {
    id: string
    tracking_code: string
    service_type: string
    amount: number
    payment_method: "pix" | "monero" // Removed BTC
    status: "pending" | "confirmed" | "failed" // Simplified statuses
    whatsapp_number?: string
    tx_hash?: string // Generic transaction hash
    created_at: string
    expires_at: string
}

export interface PaymentConfirmation {
    id: string
    order_id: string
    confirmation_method: string
    confirmed_at: string
}

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database operations
export const db = {
    // Orders
    createOrder: async (
        orderData: Omit<Order, "id" | "created_at" | "expires_at">
    ) => {
        const { data, error } = await supabase
            .from("orders")
            .insert({
                ...orderData,
                expires_at: new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000
                ).toISOString(), // 7 days
            })
            .select()
            .single()

        if (error) throw error
        return data as Order
    },

    getOrderByTrackingCode: async (trackingCode: string) => {
        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .eq("tracking_code", trackingCode)
            .single()

        if (error && error.code !== "PGRST116") throw error
        return data as Order | null
    },

    getOrdersByWhatsApp: async (whatsappNumber: string, status?: string) => {
        let query = supabase
            .from("orders")
            .select("*")
            .eq("whatsapp_number", whatsappNumber)

        if (status) {
            query = query.eq("status", status)
        }

        const { data, error } = await query
        if (error) throw error
        return data as Order[]
    },

    updateOrderStatus: async (
        orderId: string,
        status: Order["status"],
        additionalData?: Partial<Order>
    ) => {
        const { data, error } = await supabase
            .from("orders")
            .update({ status, ...additionalData })
            .eq("id", orderId)
            .select()
            .single()

        if (error) throw error
        return data as Order
    },

    // Payment confirmations
    addPaymentConfirmation: async (orderId: string, method: string) => {
        const { data, error } = await supabase
            .from("payment_confirmations")
            .insert({
                order_id: orderId,
                confirmation_method: method,
            })
            .select()
            .single()

        if (error) throw error
        return data as PaymentConfirmation
    },

    // Cleanup expired orders
    cleanupExpiredOrders: async () => {
        const { error } = await supabase
            .from("orders")
            .delete()
            .lt("expires_at", new Date().toISOString())

        if (error) throw error
    },
}
