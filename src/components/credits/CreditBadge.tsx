/**
 * CreditBadge Component
 * Displays user's current credit balance in the header
 */

"use client"

import { Coins } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useLocale } from "next-intl"

export function CreditBadge() {
    const locale = useLocale()
    const [balance, setBalance] = useState<number | null>(null)

    useEffect(() => {
        let mounted = true
        async function fetchBalance() {
            try {
                const res = await fetch("/api/credits/balance")
                if (!res.ok) return
                const data = await res.json()
                if (data.success && mounted) {
                    setBalance(data.data.balance)
                }
            } catch {
                // Silently ignore Network errors for auxiliary badge
            }
        }
        fetchBalance()
        return () => {
            mounted = false
        }
    }, [])

    const displayBalance = balance !== null ? balance.toLocaleString() : "..."

    return (
        <Link
            href={`/${locale}/dashboard/credits`}
            className="flex items-center space-x-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500 hover:bg-amber-500/20 transition-colors"
            title="Seu saldo de créditos"
        >
            <Coins className="h-3.5 w-3.5" />
            <span>{displayBalance} Cr</span>
        </Link>
    )
}
