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
}

export default function ByoTokenChannelFinder({
    onChannelSelected,
}: ByoTokenChannelFinderProps) {
    const [open, setOpen] = useState(false)
    const [platform, setPlatform] = useState<PlatformId>("youtube")
    const [token, setToken] = useState("")
    const [clientId, setClientId] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [results, setResults] = useState<ResolveResult | null>(null)

    const needsClientId = platform === "twitch"

    const handleSubmit = async () => {
        if (!token.trim()) {
            setError("Informe o token de acesso.")
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
                setError(data?.message || data?.error || "Falha ao consultar.")
                return
            }
            const result: ResolveResult = data.results?.[0]
            setResults(result)
            if (!result?.ok) {
                setError(result?.message || result?.error || "Falha.")
            }
        } catch (err) {
            logger.error("BYO token lookup failed", { error: err })
            setError("Erro de rede ao consultar o token.")
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
                Usar meu próprio token (Local)
            </button>
        )
    }

    return (
        <Card className="p-4">
            <div className="mb-3 flex items-start justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                        <KeyRound className="h-4 w-4" />
                        Listar canais via token próprio
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Cole um token de acesso da plataforma para ver quais
                        canais ele pode usar. O token não é salvo.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setOpen(false)
                        reset()
                    }}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Fechar"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <label className="flex flex-col gap-1 text-xs">
                    <span className="text-muted-foreground">Plataforma</span>
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
                        <span className="text-muted-foreground">Client-Id</span>
                        <input
                            type="text"
                            value={clientId}
                            onChange={e => setClientId(e.target.value)}
                            placeholder="Client-Id da app Twitch"
                            className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                        />
                    </label>
                )}

                <label className="flex flex-1 flex-col gap-1 text-xs">
                    <span className="text-muted-foreground">Access token</span>
                    <input
                        type="password"
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        placeholder="Cole o token aqui"
                        autoComplete="off"
                        className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                    />
                </label>

                <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Consultando
                        </>
                    ) : (
                        "Listar canais"
                    )}
                </Button>
            </div>

            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                Usado apenas em memória para esta consulta. Nunca armazenamos o
                token.
            </p>

            {error && (
                <div className="mt-3 rounded-md bg-destructive/15 p-2 text-xs text-destructive">
                    {error}
                </div>
            )}

            {results?.ok && results.channels.length === 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                    Nenhum canal encontrado para este token.
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
                            {onChannelSelected && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        onChannelSelected(results.platform, ch)
                                    }
                                >
                                    Usar
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
