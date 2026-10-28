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
import ByoTokenChannelFinder from "@/components/dashboard/channels/byo-token-channel-finder"

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
    { id: "tiktok", name: "TikTok", implemented: true, byoAvailable: true },
    { id: "twitch", name: "Twitch", implemented: true },
    { id: "kick", name: "Kick", implemented: true },
    {
        id: "facebook",
        name: "Facebook",
        implemented: true,
        localOnly: true,
        byoAvailable: true,
    },
    {
        id: "instagram",
        name: "Instagram",
        implemented: true,
        localOnly: true,
        byoAvailable: true,
    },
    { id: "twitter", name: "Twitter/X", implemented: true },
    { id: "linkedin", name: "LinkedIn", implemented: true },
    { id: "kwai", name: "Kwai", implemented: true, byoOnly: true },
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
    const [byoModalPlatform, setByoModalPlatform] = useState<string | null>(
        null
    )
    const [byoChannelId, setByoChannelId] = useState("")
    const [byoChannelName, setByoChannelName] = useState("")
    const [byoAccessToken, setByoAccessToken] = useState("")
    const [byoSubmitting, setByoSubmitting] = useState(false)
    const [byoError, setByoError] = useState<string | null>(null)

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

        if (platform === "kwai") {
            setByoModalPlatform("kwai")
            setByoChannelId("")
            setByoChannelName("")
            setByoAccessToken("")
            setByoError(null)
            return
        }

        if (
            platform === "facebook" ||
            platform === "instagram" ||
            platform === "tiktok"
        ) {
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
                            setByoModalPlatform("tiktok")
                            setByoChannelId("")
                            setByoChannelName("")
                            setByoAccessToken("")
                            setByoError(null)
                        },
                    })
                    return
                }
            }
            setByoModalPlatform(platform)
            setByoChannelId("")
            setByoChannelName("")
            setByoAccessToken("")
            setByoError(null)
            return
        }

        startOAuthFlow(platform)
    }

    const handleByoSubmit = async () => {
        if (!byoModalPlatform) return
        if (!byoChannelId.trim() || !byoChannelName.trim()) {
            setByoError(t("channels.byoErrorRequired"))
            return
        }

        setByoSubmitting(true)
        setByoError(null)
        try {
            const response = await fetch("/api/byo/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: byoModalPlatform,
                    channelId: byoChannelId.trim(),
                    channelName: byoChannelName.trim(),
                    accessToken: byoAccessToken.trim() || undefined,
                }),
            })

            const data = await response.json()
            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || data.error || t("channels.byoErrorConnect")
                )
            }

            await fetchChannels()
            setByoModalPlatform(null)
            setByoChannelId("")
            setByoChannelName("")
            setByoAccessToken("")
        } catch (err) {
            setByoError(
                err instanceof Error
                    ? err.message
                    : t("channels.byoErrorConnect")
            )
        } finally {
            setByoSubmitting(false)
        }
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
                    const response = await fetch("/api/channels/disconnect", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            channelId: channel.id,
                            platform: channel.platform,
                        }),
                    })

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

            <ByoTokenChannelFinder onChannelConnected={fetchChannels} />

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
                                    {t("channels.byoLegend")}
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
                                const isByo =
                                    Boolean(
                                        (platform as { byoOnly?: boolean })
                                            .byoOnly
                                    ) ||
                                    Boolean(
                                        (platform as { byoAvailable?: boolean })
                                            .byoAvailable
                                    ) ||
                                    Boolean(
                                        (platform as { localOnly?: boolean })
                                            .localOnly
                                    )

                                const statusColor = platform.implemented
                                    ? isByo
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                    : "bg-neutral-400"

                                const statusTooltip = platform.implemented
                                    ? isByo
                                        ? t("channels.byoLegend")
                                        : t("channels.statusOperational")
                                    : t("channels.statusInDevelopment")

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
                                                {t("channels.linkedCount", {
                                                    count: connectedList.length,
                                                })}
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

            {/* BYO / Token Connection Dialog */}
            <Dialog
                open={Boolean(byoModalPlatform)}
                onOpenChange={open => {
                    if (!open) {
                        setByoModalPlatform(null)
                        setByoError(null)
                    }
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {t("channels.byoModalTitle", {
                                platform:
                                    (byoModalPlatform &&
                                        ALL_PLATFORMS.find(
                                            p => p.id === byoModalPlatform
                                        )?.name) ||
                                    byoModalPlatform ||
                                    "",
                            })}
                        </DialogTitle>
                        <DialogDescription className="text-xs pt-1">
                            {byoModalPlatform === "kwai"
                                ? t("channels.byoNoticeKwai")
                                : t("channels.byoNoticeRestricted")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2 text-xs">
                        <label className="flex flex-col gap-1">
                            <span className="font-medium text-foreground">
                                {t("channels.byoChannelId")} *
                            </span>
                            <input
                                type="text"
                                value={byoChannelId}
                                onChange={e => setByoChannelId(e.target.value)}
                                placeholder={
                                    byoModalPlatform === "kwai"
                                        ? t("channels.byoChannelIdPlaceholder")
                                        : "ex: 10485729104859"
                                }
                                className="rounded border border-border bg-background px-2.5 py-1.5 text-sm"
                            />
                        </label>

                        <label className="flex flex-col gap-1">
                            <span className="font-medium text-foreground">
                                {t("channels.byoChannelName")} *
                            </span>
                            <input
                                type="text"
                                value={byoChannelName}
                                onChange={e =>
                                    setByoChannelName(e.target.value)
                                }
                                placeholder={t(
                                    "channels.byoChannelNamePlaceholder"
                                )}
                                className="rounded border border-border bg-background px-2.5 py-1.5 text-sm"
                            />
                        </label>

                        <label className="flex flex-col gap-1">
                            <span className="font-medium text-foreground">
                                {t("channels.byoAccessToken")}
                            </span>
                            <input
                                type="password"
                                value={byoAccessToken}
                                onChange={e =>
                                    setByoAccessToken(e.target.value)
                                }
                                placeholder={
                                    byoModalPlatform === "kwai"
                                        ? t(
                                              "channels.byoAccessTokenPlaceholderKwai"
                                          )
                                        : t(
                                              "channels.byoAccessTokenPlaceholder"
                                          )
                                }
                                className="rounded border border-border bg-background px-2.5 py-1.5 text-sm"
                            />
                        </label>

                        {byoError && (
                            <div className="rounded-md bg-destructive/15 p-2 text-xs text-destructive">
                                {byoError}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        {byoModalPlatform !== "kwai" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-muted-foreground mr-auto"
                                onClick={() => {
                                    const p = byoModalPlatform
                                    setByoModalPlatform(null)
                                    if (p) startOAuthFlow(p)
                                }}
                            >
                                {t("channels.byoTryOAuth")}
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setByoModalPlatform(null)}
                        >
                            {t("channels.cancel")}
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            disabled={byoSubmitting}
                            onClick={handleByoSubmit}
                        >
                            {byoSubmitting ? "..." : t("channels.byoSubmit")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
