"use client"

import { useEffect, useState } from "react"
import { Users, Video, CreditCard, Server } from "lucide-react"

interface TelemetryData {
    timestamp: string
    siteMetrics: {
        totalUsers: number
        activeSessions24h: number
        connectedChannels: number
        clonedChannelsActive: number
        scheduledPostsPending: number
    }
    creditsTelemetry: {
        totalGranted: number
        totalConsumed: number
        remainingBalance: number
    }
    systemHealth: {
        status: string
        uptimeSeconds: number
        apiLatencyMs: number
        errorRate24h: string
    }
    platformUsage: Record<string, number>
}

export default function AdminTelemetryView() {
    const [data, setData] = useState<TelemetryData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/admin/telemetry")
            .then(res => res.json())
            .then(json => {
                setData(json)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground animate-pulse">
                    Loading Dev/Owner Telemetry...
                </p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="p-8">
                <p className="text-destructive">
                    Failed to load telemetry data.
                </p>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Dev / Owner Control Panel & Telemetry
                </h1>
                <p className="text-muted-foreground">
                    Real-time system telemetry, active sessions, credit
                    consumption, and platform stats.
                </p>
            </div>

            {/* Metrics Overview Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-card rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">Total Users</span>
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        {data.siteMetrics.totalUsers.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {data.siteMetrics.activeSessions24h} active in last 24h
                    </p>
                </div>

                <div className="p-6 bg-card rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">
                            Connected Channels
                        </span>
                        <Video className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        {data.siteMetrics.connectedChannels.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {data.siteMetrics.clonedChannelsActive} active clone
                        pipelines
                    </p>
                </div>

                <div className="p-6 bg-card rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">
                            Credit Balance
                        </span>
                        <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        {data.creditsTelemetry.remainingBalance.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {data.creditsTelemetry.totalConsumed.toLocaleString()}{" "}
                        consumed
                    </p>
                </div>

                <div className="p-6 bg-card rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-sm font-medium">
                            System Health
                        </span>
                        <Server className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground capitalize">
                        {data.systemHealth.status}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Latency: {data.systemHealth.apiLatencyMs}ms | Errors:{" "}
                        {data.systemHealth.errorRate24h}
                    </p>
                </div>
            </div>

            {/* Platform Distribution */}
            <div className="p-6 bg-card rounded-lg border border-border space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                    Platform Usage Share
                </h2>
                <div className="grid gap-4 md:grid-cols-5">
                    {Object.entries(data.platformUsage).map(
                        ([platform, pct]) => (
                            <div
                                key={platform}
                                className="p-4 bg-muted rounded-md space-y-1"
                            >
                                <span className="text-xs font-semibold uppercase text-muted-foreground">
                                    {platform}
                                </span>
                                <div className="text-xl font-bold text-foreground">
                                    {pct}%
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    )
}
