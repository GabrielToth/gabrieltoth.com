/**
 * StreamStatusCard Component
 * Displays live stream status, health, bitrate (kbps), codec, resolution and execution mode per platform
 */

"use client"

import { useEffect, useState } from "react"
import { evaluateStreamHealth, StreamHealthMetrics } from "@/lib/live/stream-health"
import { Cpu, HardDrive, Wifi } from "lucide-react"

interface StreamStatusCardProps {
    platform: string
    username: string
    displayName: string
    isLive: boolean
    viewerCount: number
    title: string
    gameName: string
    startedAt: string | null
    metrics?: StreamHealthMetrics
    executionMode?: "cloud" | "local"
    localOnly?: boolean
}

export function StreamStatusCard({
    platform,
    displayName,
    isLive,
    viewerCount,
    title,
    gameName,
    startedAt,
    metrics: initialMetrics,
    executionMode = "cloud",
    localOnly = false,
}: StreamStatusCardProps) {
    const [liveMetrics, setLiveMetrics] = useState<StreamHealthMetrics | null>(initialMetrics || null)
    const [loadingMetrics, setLoadingMetrics] = useState(!initialMetrics)

    useEffect(() => {
        if (!isLive) {
            setLoadingMetrics(false)
            return
        }

        let isMounted = true
        async function fetchPlatformHealth() {
            try {
                const res = await fetch(`/api/live/health?platform=${encodeURIComponent(platform)}&isLive=true`)
                if (!res.ok) return
                const data = await res.json()
                if (data.success && data.metrics && isMounted) {
                    setLiveMetrics(data.metrics)
                }
            } catch {
                // Auxiliary fetch
            } finally {
                if (isMounted) setLoadingMetrics(false)
            }
        }

        fetchPlatformHealth()
        const interval = setInterval(fetchPlatformHealth, 15000)
        return () => {
            isMounted = false
            clearInterval(interval)
        }
    }, [platform, isLive])

    const getUptime = (): string => {
        if (!startedAt) return "—"
        const start = new Date(startedAt).getTime()
        const now = Date.now()
        const diff = now - start
        const hours = Math.floor(diff / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        return `${hours}h ${minutes}m`
    }

    const getPlatformColor = (): string => {
        switch (platform.toLowerCase()) {
            case "twitch": return "#9146FF"
            case "kick": return "#53FC18"
            case "youtube": return "#FF0000"
            case "facebook": return "#1877F2"
            case "instagram": return "#E4405F"
            default: return "#3B82F6"
        }
    }

    const health = isLive && liveMetrics ? evaluateStreamHealth(liveMetrics) : null

    const healthColors: Record<string, string> = {
        excellent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        good: "text-green-500 bg-green-500/10 border-green-500/20",
        fair: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        poor: "text-orange-500 bg-orange-500/10 border-orange-500/20",
        critical: "text-red-500 bg-red-500/10 border-red-500/20",
    }

    const isLocalExecution = localOnly || executionMode === "local"

    return (
        <div
            className="rounded-lg border p-4 transition-all hover:shadow-md bg-card"
            style={{
                borderColor: isLive ? getPlatformColor() : "var(--border)",
                borderLeftWidth: "4px",
                borderLeftColor: isLive ? getPlatformColor() : undefined,
            }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                        style={{ backgroundColor: getPlatformColor() }}
                    >
                        {platform.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">
                                {displayName}
                            </h3>
                            <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${
                                    isLocalExecution
                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                        : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                                }`}
                                title={
                                    isLocalExecution
                                        ? "Transmissão Local: Transmissão direta pelo cliente/encoder sem nuvem"
                                        : "Transmissão Cloud: Relay via infraestrutura em nuvem"
                                }
                            >
                                {isLocalExecution ? "LOCAL" : "CLOUD"}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">
                            {platform} {localOnly ? "(Apenas Local)" : ""}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isLive ? (
                        <div className="flex items-center gap-2">
                            {health && (
                                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${healthColors[health.level] || "text-muted-foreground"}`}>
                                    {health.level}
                                </span>
                            )}
                            <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500 border border-red-500/20">
                                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                LIVE
                            </span>
                        </div>
                    ) : (
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            OFFLINE
                        </span>
                    )}
                </div>
            </div>

            {/* General Metrics Grid */}
            <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center rounded-md bg-muted/30 p-2">
                    <p className="text-xl font-bold text-foreground">
                        {isLive ? viewerCount.toLocaleString() : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Espectadores</p>
                </div>
                <div className="text-center rounded-md bg-muted/30 p-2">
                    <p className="text-xl font-bold text-foreground">
                        {isLive ? getUptime() : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Tempo no Ar</p>
                </div>
                <div className="text-center rounded-md bg-muted/30 p-2">
                    <p className="text-xl font-bold text-foreground truncate" title={gameName}>
                        {gameName || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Categoria/Jogo</p>
                </div>
            </div>

            {/* Per-Destination Encoder / Network Metrics */}
            {isLive && (
                <div className="mt-3 rounded-md border border-border/60 bg-muted/20 p-2.5 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-medium text-foreground border-b border-border/40 pb-1.5">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Wifi className="h-3.5 w-3.5 text-primary" /> Estabilidade da Rede ({platform})
                        </span>
                        <span className="text-primary font-bold">
                            {liveMetrics ? `${liveMetrics.bitrateKbps} kbps` : loadingMetrics ? "Conectando..." : "—"}
                        </span>
                    </div>

                    {liveMetrics && (
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1">
                            <div className="flex items-center gap-1">
                                <Cpu className="h-3 w-3 text-muted-foreground" />
                                <span>Codec/Res: <strong className="text-foreground">{liveMetrics.codec.toUpperCase()} @ {liveMetrics.resolution} ({liveMetrics.fps} fps)</strong></span>
                            </div>
                            <div className="flex items-center gap-1 justify-end">
                                <HardDrive className="h-3 w-3 text-muted-foreground" />
                                <span>Latência: <strong className="text-foreground">{liveMetrics.latencyMs}ms</strong> | Perdas: <strong className="text-foreground">{liveMetrics.droppedFrames}</strong></span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {title && (
                <p className="mt-3 truncate text-xs text-muted-foreground" title={title}>
                    <span className="font-semibold text-foreground">Título:</span> {title}
                </p>
            )}
        </div>
    )
}
