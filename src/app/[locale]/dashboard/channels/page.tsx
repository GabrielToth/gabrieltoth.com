"use client"

import { DynamicIcon } from "@/components/ui/dynamic-icon"
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
                    message:
                        locale === "pt-BR"
                            ? "Você já tem uma conta do TikTok conectada. Para conectar uma conta diferente, desconecte a atual primeiro. O TikTok OAuth não permite selecionar outra conta durante a autorização."
                            : locale === "es"
                              ? "Ya tienes una cuenta de TikTok conectada. Para conectar una cuenta diferente, primero desconecta la actual. La OAuth de TikTok no permite seleccionar otra cuenta durante la autorización."
                              : "You already have a TikTok account connected. To connect a different account, disconnect the current one first. TikTok OAuth does not allow selecting another account during authorization.",
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
                body: JSON.stringify({ locale }),
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
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 dark:border-gray-700 dark:border-t-blue-500" />
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
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t("channels.channels")}
                    </h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {t("channels.description")}
                    </p>
                </div>

                {/* Connected Channels */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t("channels.connected", {
                                count: connectedChannels.length,
                            })}
                        </h2>
                    </div>
                    {connectedChannels.length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">
                                {t("channels.noConnected")}
                            </p>
                            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                                {t("channels.connectPrompt")}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {connectedChannels.map(channel => (
                                <div
                                    key={channel.id}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <DynamicIcon
                                                name={
                                                    PLATFORM_ICONS[
                                                        channel.platform
                                                    ] as any
                                                }
                                                size={24}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {channel.accountName}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {t("channels.onPlatform", {
                                                    platform:
                                                        ALL_PLATFORMS.find(
                                                            p =>
                                                                p.id ===
                                                                channel.platform
                                                        )?.name ||
                                                        channel.platform,
                                                })}
                                            </p>
                                            {channel.connectedAt && (
                                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                                    {t(
                                                        "channels.connectedSince",
                                                        {
                                                            date: new Date(
                                                                channel.connectedAt
                                                            ).toLocaleDateString(),
                                                        }
                                                    )}
                                                </p>
                                            )}
                                            {channel.needsReconnect && (
                                                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                                    {t(
                                                        "channels.reconnectRequired"
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                                channel.needsReconnect
                                                    ? "bg-amber-100 text-amber-800"
                                                    : "bg-green-100 text-green-800"
                                            }`}
                                        >
                                            {channel.needsReconnect
                                                ? t("channels.updateNeeded")
                                                : t("channels.connectedStatus")}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 hover:bg-red-50"
                                            onClick={() =>
                                                handleDisconnect(channel)
                                            }
                                            disabled={
                                                disconnectingId === channel.id
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

                {/* Available Platforms — ALL platforms always visible */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t("channels.available")}
                        </h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {ALL_PLATFORMS.map(platform => {
                            const connectedList =
                                platformConnectedChannels[platform.id] || []
                            const hasConnected = connectedList.length > 0

                            return (
                                <div
                                    key={platform.id}
                                    className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                                <DynamicIcon
                                                    name={
                                                        PLATFORM_ICONS[
                                                            platform.id
                                                        ] as any
                                                    }
                                                    size={24}
                                                />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {platform.name}
                                                </p>
                                                {!platform.implemented ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className="mt-0.5 text-xs"
                                                    >
                                                        {t(
                                                            "channels.notImplemented"
                                                        )}
                                                    </Badge>
                                                ) : (platform as any)
                                                      .localOnly ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="mt-0.5 text-xs border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:bg-amber-950/30"
                                                    >
                                                        {t(
                                                            "channels.localOnly"
                                                        )}
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={
                                                connectingPlatform ===
                                                platform.id
                                            }
                                            onClick={() =>
                                                handleConnect(platform.id)
                                            }
                                        >
                                            {connectingPlatform === platform.id
                                                ? "..."
                                                : hasConnected
                                                  ? t("channels.addAnother")
                                                  : t("channels.connect")}
                                        </Button>
                                    </div>

                                    {/* Show connected accounts for this platform */}
                                    {connectedList.length > 0 && (
                                        <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 dark:border-gray-700">
                                            {connectedList.map(ch => (
                                                <div
                                                    key={ch.id}
                                                    className="flex items-center justify-between text-sm"
                                                >
                                                    <span className="truncate text-gray-700 dark:text-gray-300">
                                                        {ch.accountName}
                                                    </span>
                                                    <span className="ml-2 flex-shrink-0 text-xs text-green-600">
                                                        {t(
                                                            "channels.connectedStatus"
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>
            </div>

            {/* Confirmation Dialog */}
            <Dialog
                open={!!confirmDialog}
                onOpenChange={open => {
                    if (!open) setConfirmDialog(null)
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {locale === "pt-BR"
                                ? "Atenção"
                                : locale === "es"
                                  ? "Atención"
                                  : "Attention"}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmDialog?.message}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDialog(null)}
                        >
                            {locale === "pt-BR"
                                ? "Cancelar"
                                : locale === "es"
                                  ? "Cancelar"
                                  : "Cancel"}
                        </Button>
                        <Button
                            variant="default"
                            onClick={confirmDialog?.onConfirm}
                        >
                            {locale === "pt-BR"
                                ? "Continuar"
                                : locale === "es"
                                  ? "Continuar"
                                  : "Continue"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
