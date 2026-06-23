"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    CreditCostsTable,
    CreditWidget,
} from "@/components/credits/CreditWidget"
import { Input } from "@/components/ui/input"
import {
    ArrowLeft,
    Coins,
    Copy,
    Gift,
    Loader2,
    Terminal,
    TrendingDown,
    TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface TransactionData {
    id: string
    amount: number
    type: "debit" | "credit"
    reason: string
    balanceBefore: number
    balanceAfter: number
    createdAt: string
}

const API_ROUTES = [
    {
        method: "GET",
        path: "/api/credits/balance",
        auth: true,
        desc: "Current balance",
    },
    {
        method: "GET",
        path: "/api/credits/transactions?limit=5",
        auth: true,
        desc: "Recent transactions",
    },
    {
        method: "GET",
        path: "/api/credits/costs",
        auth: false,
        desc: "Credit cost table",
    },
    {
        method: "GET",
        path: "/api/credits/whoami",
        auth: true,
        desc: "User info + admin status",
    },
    {
        method: "POST",
        path: "/api/credits/grant",
        auth: true,
        desc: "Admin: grant credits",
    },
] as const

export default function CreditsPage() {
    const [balance, setBalance] = useState<number | null>(null)
    const [transactions, setTransactions] = useState<TransactionData[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [grantAmount, setGrantAmount] = useState("")
    const [granting, setGranting] = useState(false)
    const [grantMsg, setGrantMsg] = useState<string | null>(null)

    async function loadData() {
        try {
            const [balRes, txRes] = await Promise.all([
                fetch("/api/credits/balance"),
                fetch("/api/credits/transactions?limit=50"),
            ])
            const balData = await balRes.json()
            const txData = await txRes.json()

            if (balData.success) {
                setBalance(balData.data.balance)
                setUserId(balData.data.userId ?? null)
                setIsAdmin(balData.data.isAdmin ?? false)
            }
            if (txData.success) setTransactions(txData.data.transactions)
        } catch {
            /* ignore */
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    async function handleGrant() {
        const amount = parseInt(grantAmount, 10)
        if (!amount || amount <= 0) return

        setGranting(true)
        setGrantMsg(null)
        try {
            const res = await fetch("/api/credits/grant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, reason: "Admin grant (test)" }),
            })
            const data = await res.json()
            if (data.success) {
                setGrantMsg(`+${amount} credits granted!`)
                setGrantAmount("")
                loadData()
            } else {
                setGrantMsg(`Error: ${data.error}`)
            }
        } catch {
            setGrantMsg("Request failed")
        } finally {
            setGranting(false)
        }
    }

    async function copyUserId() {
        if (!userId) return
        await navigator.clipboard.writeText(userId)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard"
                    className="text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Coins className="h-6 w-6" />
                        Credits
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your credit balance and view costs
                    </p>
                </div>
            </div>

            {userId ? (
                <Card className="border-dashed border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20">
                    <CardContent className="py-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground shrink-0">
                                Your User ID:
                            </span>
                            <code className="text-xs font-mono bg-background px-2 py-0.5 rounded border truncate min-w-0">
                                {userId}
                            </code>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 shrink-0"
                                onClick={copyUserId}
                            >
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Add this ID to{" "}
                            <code className="text-[10px] font-mono bg-background px-1 rounded">
                                CREDIT_ADMIN_IDS
                            </code>{" "}
                            in your .env.local to enable the admin grant form.
                        </p>
                    </CardContent>
                </Card>
            ) : null}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-6">
                        <CreditWidget />

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Gift className="h-5 w-5" />
                                    Admin Grant
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-xs text-muted-foreground">
                                    Add free credits to your account for
                                    testing.
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Amount"
                                        value={grantAmount}
                                        onChange={e =>
                                            setGrantAmount(e.target.value)
                                        }
                                        min={1}
                                        className="w-32"
                                    />
                                    <Button
                                        onClick={handleGrant}
                                        disabled={
                                            granting ||
                                            !grantAmount ||
                                            parseInt(grantAmount) <= 0
                                        }
                                        size="sm"
                                    >
                                        {granting ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                        ) : null}
                                        Grant
                                    </Button>
                                </div>
                                {grantMsg && (
                                    <p
                                        className={`text-xs ${
                                            grantMsg.startsWith("+")
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {grantMsg}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <CreditCostsTable />

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Transaction History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {transactions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No transactions yet.
                                    </p>
                                ) : (
                                    <div className="divide-y text-sm max-h-80 overflow-y-auto">
                                        {transactions.map(tx => (
                                            <div
                                                key={tx.id}
                                                className="flex items-center justify-between py-2"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {tx.type === "credit" ? (
                                                        <TrendingUp className="h-4 w-4 shrink-0 text-green-500" />
                                                    ) : (
                                                        <TrendingDown className="h-4 w-4 shrink-0 text-red-500" />
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs">
                                                            {tx.reason}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {new Date(
                                                                tx.createdAt
                                                            ).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 ml-2">
                                                    <p
                                                        className={
                                                            tx.type === "credit"
                                                                ? "text-green-600 text-xs"
                                                                : "text-red-600 text-xs"
                                                        }
                                                    >
                                                        {tx.type === "credit"
                                                            ? "+"
                                                            : "-"}
                                                        {tx.amount}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        bal:{" "}
                                                        {tx.balanceAfter.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground py-2">
                    <Terminal className="h-4 w-4" />
                    <span>API Reference</span>
                    <span className="text-xs opacity-50 group-open:opacity-100">
                        ({API_ROUTES.length} endpoints)
                    </span>
                </summary>
                <Card className="border-dashed">
                    <CardContent className="py-3 space-y-2">
                        {API_ROUTES.map(route => (
                            <div
                                key={route.path}
                                className="flex items-center gap-3 text-xs font-mono"
                            >
                                <span
                                    className={`shrink-0 font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                        route.method === "GET"
                                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                                    }`}
                                >
                                    {route.method}
                                </span>
                                <code className="truncate text-muted-foreground">
                                    {route.path}
                                </code>
                                <span className="text-muted-foreground/60 shrink-0 ml-auto">
                                    {route.auth ? "🔒" : "🔓"}
                                </span>
                            </div>
                        ))}
                        <p className="text-[10px] text-muted-foreground pt-1 border-t">
                            🔒 = Session required &nbsp;|&nbsp; 🔓 = Public
                        </p>
                    </CardContent>
                </Card>
            </details>
        </div>
    )
}
