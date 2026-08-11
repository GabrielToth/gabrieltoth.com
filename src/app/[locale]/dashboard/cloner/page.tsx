"use client"

import { useTranslations } from "next-intl"
import { useCallback, useEffect, useState } from "react"

interface ChannelGroup {
    id: string
    name: string
}

interface CloneConfig {
    id: string
    source_channel_url: string
    target_group_id: string | null
    enabled: boolean
    created_at: string
    last_cloned_at: string | null
    status: "idle" | "running" | "error"
    target_group: ChannelGroup | null
}

export default function ClonerPage() {
    const t = useTranslations("dashboard.cloner")
    const [configs, setConfigs] = useState<CloneConfig[]>([])
    const [groups, setGroups] = useState<ChannelGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [sourceUrl, setSourceUrl] = useState("")
    const [targetGroupId, setTargetGroupId] = useState("")
    const [saving, setSaving] = useState(false)
    const [cloningId, setCloningId] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        try {
            const [cRes, gRes] = await Promise.all([
                fetch("/api/cloner-configs"),
                fetch("/api/channel-groups"),
            ])
            if (cRes.ok) { const d = await cRes.json(); if (d.success) setConfigs(d.data) }
            if (gRes.ok) { const d = await gRes.json(); if (d.success) setGroups(d.data) }
        } catch {} finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const handleCreate = useCallback(async () => {
        if (!sourceUrl.trim()) return
        setSaving(true)
        try {
            await fetch("/api/cloner-configs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source_channel_url: sourceUrl,
                    target_group_id: targetGroupId || null,
                }),
            })
            setSourceUrl("")
            setTargetGroupId("")
            fetchData()
        } finally { setSaving(false) }
    }, [sourceUrl, targetGroupId, fetchData])

    const triggerClone = useCallback(async (id: string) => {
        setCloningId(id)
        try {
            await fetch(`/api/cloner-configs/${id}/clone`, { method: "POST" })
            fetchData()
        } finally { setCloningId(null) }
    }, [fetchData])

    const handleDelete = useCallback(async (id: string) => {
        await fetch(`/api/cloner-configs?id=${id}`, { method: "DELETE" })
        fetchData()
    }, [fetchData])

    if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Loading...</p></div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
                <input
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder={t("channelUrlPlaceholder")}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none"
                />
                <select
                    value={targetGroupId}
                    onChange={(e) => setTargetGroupId(e.target.value)}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none"
                >
                    <option value="">{t("selectGroup")}</option>
                    {groups.length === 0 && <option disabled>{t("noGroups")}</option>}
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <button
                    onClick={handleCreate}
                    disabled={saving || !sourceUrl.trim()}
                    className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {saving ? t("cloning") : t("startCloning")}
                </button>
            </div>

            {configs.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                    <p className="text-muted-foreground">{t("noConfigs")}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {configs.map(config => (
                        <div key={config.id} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-neutral-200">
                                    {config.source_channel_url}
                                </p>
                                <p className="text-xs text-neutral-400">
                                    &rarr; {config.target_group?.name || "No group"} &middot;{" "}
                                    Created {new Date(config.created_at).toLocaleDateString()}
                                    {config.last_cloned_at && ` &middot; Last clone: ${new Date(config.last_cloned_at).toLocaleString()}`}
                                </p>
                                <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded font-semibold ${
                                    config.status === "running" ? "bg-blue-600/20 text-blue-400" :
                                    config.status === "error" ? "bg-red-600/20 text-red-400" :
                                    "bg-neutral-700/30 text-neutral-400"
                                }`}>
                                    {config.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => triggerClone(config.id)}
                                    disabled={cloningId === config.id}
                                    className="rounded-lg bg-indigo-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
                                >
                                    {cloningId === config.id ? "..." : "Clone Now"}
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
            )}
        </div>
    )
}
