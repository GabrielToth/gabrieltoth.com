"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CREDIT_COSTS } from "@/lib/credits/constants"
import { Coins, TrendingDown, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"

interface BalanceData {
    balance: number
}

interface TransactionData {
    id: string
    amount: number
    type: "debit" | "credit"
    reason: string
    balanceAfter: number
    createdAt: string
}

export function CreditWidget() {
    const [balance, setBalance] = useState<number | null>(null)
    const [recent, setRecent] = useState<TransactionData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function load() {
            try {
                const [balRes, txRes] = await Promise.all([
                    fetch("/api/credits/balance"),
                    fetch("/api/credits/transactions?limit=5"),
                ])
                const balData = await balRes.json()
                const txData = await txRes.json()

                if (balData.success) setBalance(balData.data.balance)
                if (txData.success) setRecent(txData.data.transactions)
            } catch {
                setError("Failed to load credits")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Coins className="h-5 w-5" />
                        Credits
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Coins className="h-5 w-5" />
                        Credits
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Coins className="h-5 w-5" />
                    Credits
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-3xl font-bold">
                    {balance?.toLocaleString() ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                    Available balance
                </p>

                {recent.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground">
                            Recent
                        </p>
                        {recent.slice(0, 3).map(tx => (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between text-xs"
                            >
                                <div className="flex items-center gap-1.5">
                                    {tx.type === "credit" ? (
                                        <TrendingUp className="h-3 w-3 text-green-500" />
                                    ) : (
                                        <TrendingDown className="h-3 w-3 text-red-500" />
                                    )}
                                    <span className="truncate max-w-[140px]">
                                        {tx.reason}
                                    </span>
                                </div>
                                <span
                                    className={
                                        tx.type === "credit"
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }
                                >
                                    {tx.type === "credit" ? "+" : "-"}
                                    {tx.amount}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export function CreditCostsTable() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Credit Costs</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="divide-y text-sm">
                    {Object.entries(CREDIT_COSTS).map(([action, cost]) => (
                        <div
                            key={action}
                            className="flex items-center justify-between py-2"
                        >
                            <span className="text-muted-foreground font-mono text-xs">
                                {action}
                            </span>
                            <span className="font-medium">
                                {cost === 0 ? "Free" : `${cost} credits`}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
