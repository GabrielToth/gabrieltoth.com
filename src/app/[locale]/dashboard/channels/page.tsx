"use client"

import { DynamicIcon } from "@/components/ui/dynamic-icon"
import type { IconName } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { logger } from "@/lib/logger"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import React, { useCallback, useEffect, useState } from "react"

interface ConnectedChannel {
    id: string
    platform: string
    accountId: string
    accountName: string
    isConnected: boolean
    thumbnailUrl?: string
    connectedAt?: string
    needsReconnect?: boolean
}

/** All available platforms */
// localOnly = only works in local development (no production OAuth app review)
const ALL_PLATFORMS = [
    { id: "youtube", name: "YouTube", implemented: true },
    { id: "tiktok", name: "TikTok", implemented: true },
    { id: "twitch", name: "Twitch", implemented: true },
    { id: "kick", name: "Kick", implemented: true },
    { id: "facebook", name: "Facebook", implemented: true, localOnly: true },
    { id: "instagram", name: "Instagram", implemented: true, localOnly: true },
    { id: "twitter", name: "Twitter/X", implemented: true },
    { id: "linkedin", name: "LinkedIn", implemented: false },
    { id: "kwai", name: "Kwai", implemented: false },
] as const

const PLATFORM_ICONS: Record<string, string> = {
    youtube: "Youtube",
    facebook: "Facebook",
    instagram: "Instagram",
    twitter: "Twitter",
    tiktok: "TikTok",
    linkedin: "Linkedin",
    kick: "Kick",
    twitch: "Twitch",
    kwai: "Kwai",
}

export default function ChannelsPage() {
    const t = useTranslations("dashboard")
    const params = useParams()
    const locale = (params?.locale as string) || "en"
    const [channels, setChannels] = useState<ConnectedChannel[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [connectingPlatform, setConnectingPlatform] = useState<string | null>(
        null
    )
    const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
    const [confirmDialog, setConfirmDialog] = useState<{
        message: string
        onConfirm: () => void
    } | null>(null)

    const fetchChannels = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await fetch("/api/user/channels")
            if (!response.ok) {
                throw new Error(`Failed to fetch channels: ${response.status}`)
            }
            const data = await response.json()
            setChannels(data.channels || [])
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "Failed to load channels"
            setError(msg)
            logger.error("Failed to fetch channels", { error: err })
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchChannels()
    }, [fetchChannels])

    const handleConnect = async (platform: string) => {
        if (connectingPlatform) return

        // TikTok only supports one connected account per user (no account selector in OAuth)
        if (platform === "tiktok") {
            const connectedTikTok = channels.find(
                ch => ch.platform === "tiktok" && ch.isConnected
            )
            if (connectedTikTok) {
                setConfirmDialog({
                    message: t("channels.tiktokReconnectMessage"),
                    onConfirm: async () => {
                        setConfirmDialog(null)
                        await startConnect(platform)
                    },
                })
                return
            }
        }

        await startConnect(platform)
    }

    const startConnect = async (platform: string) => {
        setConnectingPlatform(platform)
        try {
            const response = await fetch(`/api/oauth/authorize/${platform}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    locale,
                    redirectTo: window.location.pathname,
                }),
            })
            if (!response.ok) {
                const data = await response.json()
                throw new Error(
                    data.message || `Failed to start ${platform} linking`
                )
            }
            const data = await response.json()
            if (data.authorizationUrl) {
                window.location.href = data.authorizationUrl
            }
        } catch (err) {
            logger.error(`Failed to connect ${platform}`, { error: err })
            setConnectingPlatform(null)
        }
    }

    const handleDisconnect = async (channel: ConnectedChannel) => {
        setDisconnectingId(channel.id)
        try {
            const response = await fetch(
                `/api/oauth/disconnect/${channel.platform}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                }
            )
            if (!response.ok) {
                const data = await response.json()
                throw new Error(
                    data.message || `Failed to disconnect ${channel.platform}`
                )
            }
            await fetchChannels()
        } catch (err) {
            logger.error(`Failed to disconnect ${channel.platform}`, {
                error: err,
            })
        } finally {
            setDisconnectingId(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-blue-500 dark:border-border dark:border-t-blue-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                <p>{error}</p>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={fetchChannels}
                >
                    {t("publish.retry")}
                </Button>
            </div>
        )
    }

    const connectedChannels = channels.filter(c => c.isConnected)

    // Build a map of which platforms are connected and how many channels each has
    const platformConnectedChannels = connectedChannels.reduce<
        Record<string, ConnectedChannel[]>
    >((acc, ch) => {
        if (!acc[ch.platform]) acc[ch.platform] = []
        acc[ch.platform].push(ch)
        return acc
    }, {})

    return (
        <>
            <div className="space-y-4">
                <div>
                    <h1 className="text-xl font-bold">{t("channels.channels")}</h1>
                    <p className="text-xs text-muted-foreground">{t("channels.description")}</p>
                </div>

                {/* Connected Channels */}
                <section>
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-semibold">
                            {t("channels.connected", { count: connectedChannels.length })}
                        </h2>
                    </div>
                    {connectedChannels.length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed border-border py-6 text-center">
                            <p className="text-xs text-muted-foreground">{t("channels.noConnected")}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{t("channels.connectPrompt")}</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {connectedChannels.map(channel => (
                                <div
                                    key={channel.id}
                                    className="flex items-center justify-between rounded-md border border-border bg-white px-3 py-1.5 dark:bg-background"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted">
                                            <DynamicIcon
                                                name={PLATFORM_ICONS[channel.platform] as IconName}
                                                size={14}
                                            />
                                        </div>
                                        <span className="truncate text-sm font-medium">{channel.accountName}</span>
                                        <span className="shrink-0 text-xs text-muted-foreground">
                                            {ALL_PLATFORMS.find(p => p.id === channel.platform)?.name || channel.platform}
                                        </span>
                                        {channel.needsReconnect && (
                                            <span className="shrink-0 text-xs text-amber-600">{t("channels.reconnectRequired")}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${channel.needsReconnect ? "bg-amber-500" : "bg-green-500"}`} />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 px-1.5 text-xs text-red-600 hover:bg-red-50"
                                            onClick={() => handleDisconnect(channel)}
                                            disabled={disconnectingId === channel.id}
                                        >
                                            {disconnectingId === channel.id ? "..." : t("channels.disconnect")}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Available Platforms */}
                <section>
                    <h2 className="text-sm font-semibold mb-2">{t("channels.available")}</h2>
                    <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                        {ALL_PLATFORMS.map(platform => {
                            const connectedList = platformConnectedChannels[platform.id] || []
                            const hasConnected = connectedList.length > 0

                            return (
                                <div
                                    key={platform.id}
                                    className="flex items-center justify-between rounded-md border border-border bg-white px-3 py-2 dark:bg-background"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted">
                                            <DynamicIcon
                                                name={PLATFORM_ICONS[platform.id] as IconName}
                                                size={14}
                                            />
                                        </div>
                                        <span className="text-sm font-medium">{platform.name}</span>
                                        {!platform.implemented ? (
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t("channels.notImplemented")}</Badge>
                                        ) : (platform as { localOnly?: boolean }).localOnly ? (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:bg-amber-950/30">
                                                {t("channels.localOnly")}
                                            </Badge>
                                        ) : null}
                                        {hasConnected && (
                                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        className="h-6 px-2 text-xs shrink-0"
                                        disabled={connectingPlatform === platform.id}
                                        onClick={() => handleConnect(platform.id)}
                                    >
                                        {connectingPlatform === platform.id
                                            ? "..."
                                            : hasConnected
                                              ? t("channels.addAnother")
                                              : t("channels.connect")}
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </section>
            </div>

            <Dialog
                open={!!confirmDialog}
                onOpenChange={open => { if (!open) setConfirmDialog(null) }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("channels.dialogTitle")}</DialogTitle>
                        <DialogDescription>{confirmDialog?.message}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialog(null)}>
                            {t("channels.dialogCancel")}
                        </Button>
                        <Button variant="default" onClick={confirmDialog?.onConfirm}>
                            {t("channels.dialogContinue")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
