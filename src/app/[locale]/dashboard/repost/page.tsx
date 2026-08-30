"use client"

import { useTranslations } from "next-intl"
import { useCallback, useEffect, useState } from "react"
import { TutorialLauncher } from "@/components/tutorial/tutorial-launcher"

interface ChannelGroup {
    id: string
    name: string
}

interface RepostConfig {
    id: string
    source_platform: string
    source_channel_url: string
    target_group_id: string | null
    check_interval_minutes: number
    enabled: boolean
    last_checked_at: string | null
    source_channel: { title: string } | null
    target_group: ChannelGroup | null
}

export default function RepostPage() {
    const _t = useTranslations("dashboard.repost")
    const [configs, setConfigs] = useState<RepostConfig[]>([])
    const [groups, setGroups] = useState<ChannelGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [sourceUrl, setSourceUrl] = useState("")
    const [targetGroupId, setTargetGroupId] = useState("")
    const [interval, setInterval] = useState(360)
    const [saving, setSaving] = useState(false)

    const fetchData = useCallback(async () => {
        try {
            const [cRes, gRes] = await Promise.all([
                fetch("/api/repost-configs"),
                fetch("/api/channel-groups"),
            ])
            if (cRes.ok) {
                const d = await cRes.json()
                if (d.success) setConfigs(d.data)
            }
            if (gRes.ok) {
                const d = await gRes.json()
                if (d.success) setGroups(d.data)
            }
        } catch {
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleCreate = useCallback(async () => {
        if (!sourceUrl.trim()) return
        setSaving(true)
        try {
            await fetch("/api/repost-configs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source_channel_url: sourceUrl,
                    target_group_id: targetGroupId || null,
                    check_interval_minutes: interval,
                }),
            })
            setSourceUrl("")
            setTargetGroupId("")
            setShowForm(false)
            fetchData()
        } finally {
            setSaving(false)
        }
    }, [sourceUrl, targetGroupId, interval, fetchData])

    const handleToggle = useCallback(
        async (config: RepostConfig) => {
            await fetch("/api/repost-configs", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: config.id,
                    enabled: !config.enabled,
                }),
            })
            fetchData()
        },
        [fetchData]
    )

    const handleDelete = useCallback(
        async (id: string) => {
            await fetch(`/api/repost-configs?id=${id}`, { method: "DELETE" })
            fetchData()
        },
        [fetchData]
    )

    if (loading)
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Auto Repost
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Automatically repost YouTube videos to other platforms
                        in your groups
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <TutorialLauncher category="repost" />
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                        {showForm ? "Cancel" : "New Config"}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
                    <input
                        value={sourceUrl}
                        onChange={e => setSourceUrl(e.target.value)}
                        placeholder="YouTube channel URL or handle (e.g. https://youtube.com/@channel)"
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none"
                    />
                    <select
                        value={targetGroupId}
                        onChange={e => setTargetGroupId(e.target.value)}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none"
                    >
                        <option value="">Select target group...</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>
                                {g.name}
                            </option>
                        ))}
                    </select>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-neutral-400">
                            Check every
                        </label>
                        <input
                            type="number"
                            value={interval}
                            onChange={e =>
                                setInterval(parseInt(e.target.value) || 360)
                            }
                            min={60}
                            className="w-20 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none"
                        />
                        <span className="text-xs text-neutral-400">
                            minutes
                        </span>
                    </div>
                    <button
                        onClick={handleCreate}
                        disabled={saving || !sourceUrl.trim()}
                        className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {saving ? "Creating..." : "Create Auto Repost"}
                    </button>
                </div>
            )}

            {configs.length === 0 && !showForm && (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                    <p className="text-muted-foreground">
                        No auto-repost configs yet. Create one to start
                        reposting YouTube videos automatically.
                    </p>
                </div>
            )}

            <div className="space-y-3">
                {configs.map(config => (
                    <div
                        key={config.id}
                        className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex items-center justify-between"
                    >
                        <div>
                            <p className="text-sm font-semibold text-neutral-200">
                                {config.source_channel?.title ||
                                    config.source_channel_url ||
                                    "YouTube Channel"}
                            </p>
                            <p className="text-xs text-neutral-400">
                                &rarr; {config.target_group?.name || "No group"}{" "}
                                &middot; Every {config.check_interval_minutes}
                                min
                                {config.last_checked_at &&
                                    ` &middot; Last check: ${new Date(config.last_checked_at).toLocaleString()}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleToggle(config)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                    config.enabled
                                        ? "bg-emerald-600/20 text-emerald-400"
                                        : "bg-neutral-800 text-neutral-500"
                                }`}
                            >
                                {config.enabled ? "ON" : "OFF"}
                            </button>
                            <button
                                onClick={() => handleDelete(config.id)}
                                className="text-neutral-600 hover:text-red-400 text-xs"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
