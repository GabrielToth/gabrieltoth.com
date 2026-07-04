"use client"

import { DynamicIcon } from "@/components/ui/dynamic-icon"
import { Button } from "@/components/ui/button"
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
    connectedAt?: string
    needsReconnect?: boolean
}

const PLATFORM_NAMES: Record<string, string> = {
    youtube: "YouTube",
    facebook: "Facebook",
    instagram: "Instagram",
    twitter: "Twitter/X",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    kick: "Kick",
}

const PLATFORM_ICONS: Record<string, string> = {
    youtube: "Youtube",
    facebook: "Facebook",
    instagram: "Instagram",
    twitter: "Twitter",
    tiktok: "TikTok",
    linkedin: "Linkedin",
    kick: "Kick",
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
                    Retry
                </Button>
            </div>
        )
    }

    const connectedChannels = channels.filter(c => c.isConnected)
    const disconnectedChannels = channels.filter(c => !c.isConnected)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Channels
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Manage all your connected social media channels
                </p>
            </div>

            {/* Connected Channels */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Connected ({connectedChannels.length})
                    </h2>
                </div>
                {connectedChannels.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">
                            No channels connected yet
                        </p>
                        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                            Connect a channel below to start publishing
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
                                            {PLATFORM_NAMES[channel.platform] ||
                                                channel.platform}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {channel.accountName}
                                        </p>
                                        {channel.connectedAt && (
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                Connected{" "}
                                                {new Date(
                                                    channel.connectedAt
                                                ).toLocaleDateString()}
                                            </p>
                                        )}
                                        {channel.needsReconnect && (
                                            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                                Reconnect required for new
                                                features
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
                                            ? "Update needed"
                                            : "Connected"}
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
                                            : "Disconnect"}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Available Channels */}
            <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">
                    Available Channels
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(PLATFORM_NAMES).map(([platform, name]) => {
                        const isConnected = connectedChannels.some(
                            c => c.platform === platform
                        )
                        if (isConnected) return null
                        return (
                            <div
                                key={platform}
                                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                        <DynamicIcon
                                            name={
                                                PLATFORM_ICONS[platform] as any
                                            }
                                            size={24}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {name}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Not connected
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleConnect(platform)}
                                    disabled={connectingPlatform === platform}
                                >
                                    {connectingPlatform === platform
                                        ? "..."
                                        : "Connect"}
                                </Button>
                            </div>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}
