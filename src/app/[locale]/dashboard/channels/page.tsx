"use client"

import { ChannelGroupManager } from "@/components/dashboard/groups/channel-group-manager"
import { DynamicIcon } from "@/components/ui/dynamic-icon"
import type { IconName } from "@/lib/icons"
import { Button } from "@/components/ui/button"
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
import { TutorialLauncher } from "@/components/tutorial/tutorial-launcher"

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
                    message: t("channels.tiktokSingleAccountNotice", {
                        accountName: connectedTikTok.accountName,
                    }),
                    onConfirm: () => {
                        setConfirmDialog(null)
                        startOAuthFlow(platform)
                    },
                })
                return
            }
        }

        startOAuthFlow(platform)
    }

    const startOAuthFlow = (platform: string) => {
        setConnectingPlatform(platform)
        try {
            const authUrl = `/api/oauth/connect/${platform}?locale=${locale}`
            window.location.href = authUrl
        } catch (err) {
            logger.error("Failed to initiate OAuth flow", {
                platform,
                error: err,
            })
            setConnectingPlatform(null)
        }
    }

    const handleDisconnect = (channel: ConnectedChannel) => {
        setConfirmDialog({
            message: t("channels.confirmDisconnect", {
                platform: channel.platform,
                accountName: channel.accountName,
            }),
            onConfirm: async () => {
                setConfirmDialog(null)
                setDisconnectingId(channel.id)
                try {
                    const response = await fetch(
                        `/api/oauth/disconnect/${channel.platform}?channelId=${channel.id}`,
                        {
                            method: "POST",
                        }
                    )

                    if (!response.ok) {
                        throw new Error(
                            `Disconnect failed with status ${response.status}`
                        )
                    }

                    await fetchChannels()
                } catch (err) {
                    logger.error("Failed to disconnect channel", {
                        channelId: channel.id,
                        error: err,
                    })
                    setError(t("channels.disconnectError"))
                } finally {
                    setDisconnectingId(null)
                }
            },
        })
    }

    // Group channels by platform
    const platformConnectedChannels = channels.reduce<
        Record<string, ConnectedChannel[]>
    >((acc, channel) => {
        if (!acc[channel.platform]) {
            acc[channel.platform] = []
        }
        acc[channel.platform].push(channel)
        return acc
    }, {})

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t("channels.title")}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t("channels.subtitle")}
                    </p>
                </div>
                <TutorialLauncher category="channels" />
            </div>

            {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center p-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            ) : (
                <>
                    {/* Connected Channels List */}
                    <section>
                        <h2 className="text-sm font-semibold mb-2">
                            {t("channels.connected")}
                        </h2>
                        {channels.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">
                                {t("channels.noChannels")}
                            </p>
                        ) : (
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {channels.map(channel => (
                                    <div
                                        key={channel.id}
                                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden">
                                                {channel.thumbnailUrl ? (
                                                    <img
                                                        src={
                                                            channel.thumbnailUrl
                                                        }
                                                        alt={
                                                            channel.accountName
                                                        }
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <DynamicIcon
                                                        name={
                                                            PLATFORM_ICONS[
                                                                channel.platform
                                                            ] as IconName
                                                        }
                                                        size={16}
                                                    />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {channel.accountName}
                                                </p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {channel.platform}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span
                                                className={`inline-block h-1.5 w-1.5 rounded-full ${channel.needsReconnect ? "bg-amber-500" : "bg-green-500"}`}
                                            />
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 px-1.5 text-xs text-red-600 hover:bg-red-50"
                                                onClick={() =>
                                                    handleDisconnect(channel)
                                                }
                                                disabled={
                                                    disconnectingId ===
                                                    channel.id
                                                }
                                            >
                                                {disconnectingId === channel.id
                                                    ? "..."
                                                    : t("channels.disconnect")}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Connected Channels Group Manager */}
                    <section>
                        <ChannelGroupManager connectedChannels={channels} />
                    </section>

                    {/* Available Platforms Grid */}
                    <section>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-semibold">
                                {t("channels.available")}
                            </h2>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                                <span className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />{" "}
                                    Operacional
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />{" "}
                                    Dev / Sandbox
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-neutral-400 inline-block" />{" "}
                                    Em Breve
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                            {ALL_PLATFORMS.map(platform => {
                                const connectedList =
                                    platformConnectedChannels[platform.id] || []
                                const hasConnected = connectedList.length > 0
                                const statusColor = platform.implemented
                                    ? (platform as { localOnly?: boolean })
                                          .localOnly
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                    : "bg-neutral-400"

                                const statusTooltip = platform.implemented
                                    ? (platform as { localOnly?: boolean })
                                          .localOnly
                                        ? "Ambiente Dev / Sandbox"
                                        : "Disponível e Operacional"
                                    : "Em Desenvolvimento"

                                return (
                                    <div
                                        key={platform.id}
                                        className="flex flex-col items-center justify-between rounded-lg border border-border bg-card p-2.5 text-center transition-colors hover:border-primary/50 relative"
                                    >
                                        <span
                                            className={`absolute top-2 right-2 h-2 w-2 rounded-full ${statusColor}`}
                                            title={statusTooltip}
                                        />
                                        <div className="p-2 rounded-full bg-muted/50 mb-1">
                                            <DynamicIcon
                                                name={
                                                    (PLATFORM_ICONS[
                                                        platform.id
                                                    ] || "Share2") as IconName
                                                }
                                                size={20}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-foreground truncate w-full">
                                            {platform.name}
                                        </span>
                                        {hasConnected && (
                                            <span className="text-[9px] font-mono font-bold text-emerald-500 mt-0.5">
                                                {connectedList.length} linked
                                            </span>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="mt-2 h-7 w-full text-[11px] px-1"
                                            onClick={() =>
                                                handleConnect(platform.id)
                                            }
                                            disabled={
                                                !platform.implemented ||
                                                connectingPlatform ===
                                                    platform.id
                                            }
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
                </>
            )}

            {/* Confirm Modal */}
            <Dialog
                open={!!confirmDialog}
                onOpenChange={() => setConfirmDialog(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("channels.confirmTitle")}</DialogTitle>
                        <DialogDescription>
                            {confirmDialog?.message}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDialog(null)}
                        >
                            {t("channels.cancel")}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={confirmDialog?.onConfirm}
                        >
                            {t("channels.confirm")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
