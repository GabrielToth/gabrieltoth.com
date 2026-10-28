"use client"

/**
 * ByoTokenChannelFinder
 *
 * Local-mode helper: the user pastes an access token they obtained directly
 * from a platform and we list every channel that token can act on. Nothing is
 * persisted — the token lives only in this component's state for the request.
 *
 * Backed by POST /api/byo/channels (authenticated + rate limited).
 */

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createLogger } from "@/lib/logger"
import { KeyRound, Loader2, ShieldCheck, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

const logger = createLogger("ByoTokenChannelFinder")

const PLATFORMS = [
    { id: "youtube", label: "YouTube" },
    { id: "twitch", label: "Twitch" },
    { id: "kick", label: "Kick" },
    { id: "twitter", label: "X / Twitter" },
    { id: "tiktok", label: "TikTok" },
    { id: "facebook", label: "Facebook" },
    { id: "instagram", label: "Instagram" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "kwai", label: "Kwai" },
] as const

type PlatformId = (typeof PLATFORMS)[number]["id"]

interface ResolvedChannel {
    id: string
    name: string
    avatarUrl?: string
    detail?: string
}

interface ResolveResult {
    platform: string
    ok: boolean
    channels: ResolvedChannel[]
    error?: string
    message?: string
}

export interface ByoTokenChannelFinderProps {
    /** Called when the user picks a channel to use. */
    onChannelSelected?: (platform: string, channel: ResolvedChannel) => void
    /** Called when a channel is successfully connected/saved in database. */
    onChannelConnected?: () => void
    initialPlatform?: PlatformId
}

export default function ByoTokenChannelFinder({
    onChannelSelected,
    onChannelConnected,
    initialPlatform,
}: ByoTokenChannelFinderProps) {
    const t = useTranslations("dashboard.channels.byoFinder")
    const [open, setOpen] = useState(false)
    const [platform, setPlatform] = useState<PlatformId>(
        initialPlatform || "youtube"
    )
    const [token, setToken] = useState("")
    const [clientId, setClientId] = useState("")
    const [loading, setLoading] = useState(false)
    const [connectingChannelId, setConnectingChannelId] = useState<
        string | null
    >(null)
    const [connectSuccess, setConnectSuccess] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [results, setResults] = useState<ResolveResult | null>(null)

    const needsClientId = platform === "twitch"

    const handleConnectChannel = async (
        targetPlatform: string,
        ch: ResolvedChannel
    ) => {
        setConnectingChannelId(ch.id)
        setError(null)
        setConnectSuccess(null)
        try {
            const res = await fetch("/api/byo/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: targetPlatform,
                    channelId: ch.id,
                    channelName: ch.name,
                    accessToken: token,
                    avatarUrl: ch.avatarUrl,
                }),
            })

            const data = await res.json()
            if (!res.ok || !data.success) {
                throw new Error(data.message || data.error || t("errorConnect"))
            }

            setConnectSuccess(t("connectSuccess", { name: ch.name }))
            onChannelConnected?.()
            onChannelSelected?.(targetPlatform, ch)
        } catch (err) {
            const msg = err instanceof Error ? err.message : t("errorConnect")
            setError(msg)
            logger.error("Failed to connect BYO channel", { error: err })
        } finally {
            setConnectingChannelId(null)
        }
    }

    const handleSubmit = async () => {
        if (!token.trim()) {
            setError(t("errorToken"))
            return
        }
        setLoading(true)
        setError(null)
        setResults(null)
        try {
            const res = await fetch("/api/byo/channels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform,
                    accessToken: token.trim(),
                    clientId: needsClientId ? clientId.trim() : undefined,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data?.message || data?.error || t("errorFetch"))
                return
            }
            const result: ResolveResult = data.results?.[0]
            setResults(result)
            if (!result?.ok) {
                setError(result?.message || result?.error || t("errorFetch"))
            }
        } catch (err) {
            logger.error("BYO token lookup failed", { error: err })
            setError(t("errorNetwork"))
        } finally {
            setLoading(false)
        }
    }

    const reset = () => {
        setToken("")
        setClientId("")
        setResults(null)
        setError(null)
    }

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"
            >
                <KeyRound className="h-4 w-4" />
                {t("open")}
            </button>
        )
    }

    return (
        <Card className="p-4">
            <div className="mb-3 flex items-start justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <KeyRound className="h-4 w-4" />
                        {t("title")}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t("description")}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setOpen(false)
                        reset()
                    }}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={t("close")}
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <label className="flex flex-col gap-1 text-xs">
                    <span className="text-muted-foreground">
                        {t("platform")}
                    </span>
                    <select
                        value={platform}
                        onChange={e => {
                            setPlatform(e.target.value as PlatformId)
                            reset()
                        }}
                        className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                    >
                        {PLATFORMS.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </label>

                {needsClientId && (
                    <label className="flex flex-1 flex-col gap-1 text-xs">
                        <span className="text-muted-foreground">
                            {t("clientId")}
                        </span>
                        <input
                            type="text"
                            value={clientId}
                            onChange={e => setClientId(e.target.value)}
                            placeholder={t("clientIdPlaceholder")}
                            className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                        />
                    </label>
                )}

                <label className="flex flex-1 flex-col gap-1 text-xs">
                    <span className="text-muted-foreground">
                        {platform === "kwai"
                            ? t("kwaiTokenLabel")
                            : t("accessToken")}
                    </span>
                    <input
                        type={platform === "kwai" ? "text" : "password"}
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        placeholder={
                            platform === "kwai"
                                ? t("kwaiTokenPlaceholder")
                                : t("tokenPlaceholder")
                        }
                        autoComplete="off"
                        className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                    />
                </label>

                <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("loading")}
                        </>
                    ) : (
                        t("submit")
                    )}
                </Button>
            </div>

            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                {t("privacy")}
            </p>

            {connectSuccess && (
                <div className="mt-3 rounded-md bg-emerald-500/15 p-2 text-xs text-emerald-600 dark:text-emerald-400">
                    {connectSuccess}
                </div>
            )}

            {error && (
                <div className="mt-3 rounded-md bg-destructive/15 p-2 text-xs text-destructive">
                    {error}
                </div>
            )}

            {results?.ok && results.channels.length === 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                    {t("noChannels")}
                </p>
            )}

            {results?.ok && results.channels.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {results.channels.map(ch => (
                        <div
                            key={ch.id}
                            className="flex items-center justify-between rounded-lg border border-border bg-background p-2"
                        >
                            <div className="flex min-w-0 items-center gap-2">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                                    {ch.avatarUrl ? (
                                        <img
                                            src={ch.avatarUrl}
                                            alt={ch.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <KeyRound className="h-4 w-4" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                        {ch.name}
                                    </p>
                                    {ch.detail && (
                                        <p className="truncate text-xs text-muted-foreground">
                                            {ch.detail}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="default"
                                disabled={connectingChannelId === ch.id}
                                onClick={() =>
                                    handleConnectChannel(results.platform, ch)
                                }
                            >
                                {connectingChannelId === ch.id ? (
                                    <>
                                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                        {t("connecting")}
                                    </>
                                ) : (
                                    t("connect")
                                )}
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
