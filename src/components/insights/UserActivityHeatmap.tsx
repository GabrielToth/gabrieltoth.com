"use client"

import React, { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Activity, ShieldCheck, UserCheck, Clock, Filter } from "lucide-react"

export interface UserAuditLogAction {
    id: string
    userId: string
    userEmail?: string
    action: string
    resource: string
    status: "success" | "failure"
    timestamp: string
    ipAddress?: string
    userAgent?: string
    details?: Record<string, unknown>
}

interface UserActivityHeatmapProps {
    logs?: UserAuditLogAction[]
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const HOURS_OF_DAY = Array.from({ length: 24 }, (_, i) => `${i}:00`)

// Sample generated data if logs are empty/simulated
function generateSampleHeatmapData(): {
    matrix: number[][]
    logs: UserAuditLogAction[]
} {
    const matrix: number[][] = Array.from({ length: 7 }, () =>
        Array.from({ length: 24 }, () => Math.floor(Math.random() * 8))
    )

    const actions = [
        "auth.login",
        "post.published",
        "channel.connected",
        "settings.updated",
        "town.searched",
        "stream.scheduled",
    ]

    const logs: UserAuditLogAction[] = Array.from({ length: 12 }, (_, i) => ({
        id: `audit-${i + 1}`,
        userId: "usr_active_01",
        userEmail: "bentoexposed@gmail.com",
        action: actions[i % actions.length],
        resource: "dashboard",
        status: "success",
        timestamp: new Date(Date.now() - i * 1800000).toISOString(),
        ipAddress: "192.168.1.203",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        details: { actionRef: `act_${i + 100}`, locale: "pt-BR" },
    }))

    return { matrix, logs }
}

export const UserActivityHeatmap: React.FC<UserActivityHeatmapProps> = ({
    logs: initialLogs,
}) => {
    const t = useTranslations("dashboard")
    const [selectedActionFilter, setSelectedActionFilter] =
        useState<string>("all")

    const sample = useMemo(() => generateSampleHeatmapData(), [])
    const logs =
        initialLogs && initialLogs.length > 0 ? initialLogs : sample.logs

    const matrix = useMemo(() => {
        const mat: number[][] = Array.from({ length: 7 }, () =>
            Array.from({ length: 24 }, () => 0)
        )
        if (initialLogs && initialLogs.length > 0) {
            initialLogs.forEach(log => {
                const date = new Date(log.timestamp)
                const day = date.getDay()
                const hour = date.getHours()
                mat[day][hour] = (mat[day][hour] || 0) + 1
            })
        } else {
            return sample.matrix
        }
        return mat
    }, [initialLogs, sample.matrix])

    const filteredLogs = useMemo(() => {
        if (selectedActionFilter === "all") return logs
        return logs.filter(l => l.action.includes(selectedActionFilter))
    }, [logs, selectedActionFilter])

    const getIntensityClass = (val: number) => {
        if (val === 0) return "bg-neutral-900 border-neutral-800"
        if (val <= 2)
            return "bg-emerald-950/60 border-emerald-800/40 text-emerald-300"
        if (val <= 4)
            return "bg-emerald-800/80 border-emerald-600/50 text-emerald-200"
        if (val <= 6)
            return "bg-emerald-600 border-emerald-500 text-white font-bold"
        return "bg-emerald-500 border-emerald-400 text-black font-extrabold shadow-sm shadow-emerald-500/50"
    }

    return (
        <div className="space-y-6 bg-card border border-border/40 rounded-xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-emerald-400" />
                        <h3 className="text-lg font-semibold text-foreground">
                            {t("insights.activityHeatmap", {
                                defaultValue:
                                    "User Action Audit & Activity Heatmap",
                            })}
                        </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t("insights.heatmapSubtitle", {
                            defaultValue:
                                "24h x 7d action frequency density & real-time user action logs",
                        })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                        value={selectedActionFilter}
                        onChange={e => setSelectedActionFilter(e.target.value)}
                        className="bg-background border border-border text-xs rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        aria-label="Filter action logs"
                    >
                        <option value="all">All Actions</option>
                        <option value="auth">Authentication</option>
                        <option value="post">Posts & Publishing</option>
                        <option value="channel">Channels</option>
                        <option value="settings">Settings</option>
                        <option value="town">Location Search</option>
                    </select>
                </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto pb-2">
                <div className="min-w-[640px]">
                    <div className="grid grid-cols-[50px_repeat(24,1fr)] gap-1 mb-1">
                        <div className="text-[10px] text-muted-foreground"></div>
                        {HOURS_OF_DAY.map((h, i) => (
                            <div
                                key={h}
                                className="text-[9px] text-muted-foreground text-center"
                            >
                                {i % 3 === 0 ? h : ""}
                            </div>
                        ))}
                    </div>

                    {DAYS_OF_WEEK.map((dayLabel, dayIdx) => (
                        <div
                            key={dayLabel}
                            className="grid grid-cols-[50px_repeat(24,1fr)] gap-1 mb-1 items-center"
                        >
                            <span className="text-xs font-medium text-muted-foreground">
                                {dayLabel}
                            </span>
                            {matrix[dayIdx].map((val, hrIdx) => (
                                <div
                                    key={`${dayIdx}-${hrIdx}`}
                                    title={`${dayLabel} ${HOURS_OF_DAY[hrIdx]}: ${val} actions logged`}
                                    className={`h-6 rounded border transition-all duration-150 flex items-center justify-center text-[9px] cursor-pointer hover:scale-105 ${getIntensityClass(
                                        val
                                    )}`}
                                >
                                    {val > 0 ? val : ""}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground border-t border-border/30 pt-3">
                <span>Less</span>
                <div className="w-3 h-3 rounded bg-neutral-900 border border-neutral-800" />
                <div className="w-3 h-3 rounded bg-emerald-950/60 border border-emerald-800/40" />
                <div className="w-3 h-3 rounded bg-emerald-800/80 border border-emerald-600/50" />
                <div className="w-3 h-3 rounded bg-emerald-600 border border-emerald-500" />
                <div className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400" />
                <span>More</span>
            </div>

            {/* Detailed Audit Action Log Feed */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        Detailed User Action Logs ({filteredLogs.length})
                    </h4>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-full font-mono">
                        0-client policy active • standard audit
                    </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {filteredLogs.map(log => (
                        <div
                            key={log.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-background/60 border border-border/30 hover:border-emerald-500/30 transition-all text-xs gap-2"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <UserCheck className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-foreground font-mono">
                                            {log.action}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.2 bg-neutral-800 rounded text-neutral-300">
                                            {log.resource}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        User: {log.userEmail || log.userId} •
                                        IP: {log.ipAddress || "127.0.0.1"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-auto text-muted-foreground font-mono text-[11px]">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-neutral-500" />
                                    <span>
                                        {new Date(
                                            log.timestamp
                                        ).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
