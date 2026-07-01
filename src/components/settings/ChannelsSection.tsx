"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { DynamicIcon } from "@/components/ui/dynamic-icon"
import { logger } from "@/lib/logger"
import { useTranslations } from "next-intl"
import React, { useState } from "react"
import { SocialChannel } from "./SettingsContainer"

/**
 * ChannelsSectionProps
 */
export interface ChannelsSectionProps {
    channels: SocialChannel[]
    onDisconnect: (channelId: string) => void
    onConnect: () => void
}

/**
 * ChannelsSection Component
 * Manage connected social channels
 * List connected social channels
 * Disconnect button for each channel
 * Add Channel button
 * Connection status display
 *
 * Features:
 * - Display connected channels
 * - Show connection status
 * - Disconnect channels
 * - Add new channels
 * - Confirmation dialogs
 */
export const ChannelsSection: React.FC<ChannelsSectionProps> = ({
    channels,
    onDisconnect,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onConnect,
}) => {
    const t = useTranslations("dashboard")
    const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
    const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(
        null
    )
    const [connectingPlatform, setConnectingPlatform] = useState<string | null>(
        null
    )

    /**
     * Handle disconnect click
     */
    const handleDisconnectClick = (channelId: string) => {
        setConfirmDisconnect(channelId)
    }

    /**
     * Confirm disconnect
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleConfirmDisconnect = async (channelId: string) => {
        try {
            setDisconnectingId(channelId)
            onDisconnect(channelId)
            setConfirmDisconnect(null)
        } finally {
            setDisconnectingId(null)
        }
    }

    /**
     * Handle OAuth connect for any platform
     */
    const handlePlatformConnect = async (platform: string) => {
        if (connectingPlatform) return
        setConnectingPlatform(platform)
        try {
            const response = await fetch(`/api/oauth/authorize/${platform}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
            } else {
                throw new Error("No authorization URL returned")
            }
        } catch (err) {
            logger.error(`Failed to connect ${platform}`, { error: err })
            setConnectingPlatform(null)
        }
    }

    /**
     * Handle platform disconnect via OAuth revoke API
     */
    const handlePlatformDisconnect = async (
        channelId: string,
        platform: string
    ) => {
        try {
            setDisconnectingId(channelId)
            const response = await fetch(`/api/oauth/disconnect/${platform}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            })
            if (!response.ok) {
                const data = await response.json()
                throw new Error(
                    data.message || `Failed to disconnect ${platform}`
                )
            }
            onDisconnect(channelId)
            setConfirmDisconnect(null)
        } catch (err) {
            logger.error(`Failed to disconnect ${platform}`, { error: err })
        } finally {
            setDisconnectingId(null)
        }
    }

    /**
     * Get platform icon name
     */
    const getPlatformIcon = (platform: string): string => {
        const iconMap: Record<string, string> = {
            facebook: "facebook",
            instagram: "instagram",
            twitter: "twitter",
            tiktok: "tiktok",
            linkedin: "linkedin",
            youtube: "Youtube",
            kick: "kick",
        }
        return iconMap[platform] || "link"
    }

    /**
     * Get platform display name
     */
    const getPlatformName = (platform: string): string => {
        const nameMap: Record<string, string> = {
            facebook: "Facebook",
            instagram: "Instagram",
            twitter: "Twitter/X",
            tiktok: "TikTok",
            linkedin: "LinkedIn",
            youtube: "YouTube",
        }
        return nameMap[platform] || platform
    }

    const connectedChannels = channels.filter(c => c.isConnected)
    const disconnectedChannels = channels.filter(c => !c.isConnected)
    const youtubeChannel = channels.find(c => c.platform === "youtube")
    const nonYoutubeConnected = connectedChannels.filter(
        c => c.platform !== "youtube"
    )
    const nonYoutubeDisconnected = disconnectedChannels.filter(
        c => c.platform !== "youtube"
    )

    return (
        <Card>
            <CardHeader>
                <CardTitle>YouTube</CardTitle>
                <CardDescription>{t("youtube.connectYouTube")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* YouTube Connect Card */}
                <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <DynamicIcon name="Youtube" size={32} />
                            <div>
                                <p className="font-medium text-gray-900">
                                    YouTube
                                </p>
                                {youtubeChannel?.isConnected ? (
                                    <>
                                        <p className="text-sm text-gray-600">
                                            {youtubeChannel.accountName}
                                        </p>
                                        {youtubeChannel.connectedAt && (
                                            <p className="text-xs text-gray-500">
                                                {t("youtube.connectedSince")}{" "}
                                                {new Date(
                                                    youtubeChannel.connectedAt
                                                ).toLocaleDateString()}
                                            </p>
                                        )}
                                        {youtubeChannel.needsReconnect && (
                                            <p className="mt-1 text-xs text-amber-600">
                                                Disconnect and reconnect to enable analytics & monetization features
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        {t("youtube.noChannel")}
                                    </p>
                                )}
                            </div>
                        </div>
                        {youtubeChannel?.isConnected ? (
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                    {t("youtube.connected")}
                                </span>
                                {youtubeChannel.needsReconnect && (
                                    <span
                                        className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 cursor-help"
                                        title="New scopes required: disconnect and reconnect to access analytics, members, and affiliates data"
                                    >
                                        Reconnect needed
                                    </span>
                                )}
                                {confirmDisconnect === youtubeChannel.id ? (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                setConfirmDisconnect(null)
                                            }
                                        >
                                            {t("youtube.cancel")}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 hover:bg-red-50"
                                            onClick={() =>
                                                handlePlatformDisconnect(
                                                    youtubeChannel.id,
                                                    "youtube"
                                                )
                                            }
                                            disabled={
                                                disconnectingId ===
                                                youtubeChannel.id
                                            }
                                        >
                                            {disconnectingId ===
                                            youtubeChannel.id
                                                ? t("youtube.disconnecting")
                                                : t(
                                                      "youtube.confirmDisconnect"
                                                  )}
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:bg-red-50"
                                        onClick={() =>
                                            handleDisconnectClick(
                                                youtubeChannel.id
                                            )
                                        }
                                    >
                                        {t("youtube.disconnect")}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => handlePlatformConnect("youtube")}
                                disabled={connectingPlatform === "youtube"}
                                className="bg-red-600 text-white hover:bg-red-700"
                            >
                                {connectingPlatform === "youtube"
                                    ? t("youtube.connecting")
                                    : t("youtube.connect")}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Other Connected Channels */}
                {nonYoutubeConnected.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900">
                            {t("youtube.connected")} (
                            {nonYoutubeConnected.length})
                        </h3>
                        <div className="space-y-3">
                            {nonYoutubeConnected.map(channel => (
                                <div
                                    key={channel.id}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <DynamicIcon
                                            name={
                                                getPlatformIcon(
                                                    channel.platform
                                                ) as import("@/lib/icons").IconName
                                            }
                                            size={24}
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {getPlatformName(
                                                    channel.platform
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {channel.accountName}
                                            </p>
                                            {channel.connectedAt && (
                                                <p className="text-xs text-gray-500">
                                                    {t(
                                                        "youtube.connectedSince"
                                                    )}{" "}
                                                    {new Date(
                                                        channel.connectedAt
                                                    ).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                            {t("youtube.connected")}
                                        </span>
                                        {channel.needsReconnect && (
                                            <span
                                                className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 cursor-help"
                                                title="New scopes required: disconnect and reconnect to access new features"
                                            >
                                                Reconnect needed
                                            </span>
                                        )}
                                        {confirmDisconnect === channel.id ? (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setConfirmDisconnect(
                                                            null
                                                        )
                                                    }
                                                >
                                                    {t("youtube.cancel")}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 hover:bg-red-50"
                                                    onClick={() =>
                                                        handlePlatformDisconnect(
                                                            channel.id,
                                                            channel.platform
                                                        )
                                                    }
                                                    disabled={
                                                        disconnectingId ===
                                                        channel.id
                                                    }
                                                >
                                                    {disconnectingId ===
                                                    channel.id
                                                        ? t(
                                                              "youtube.disconnecting"
                                                          )
                                                        : t(
                                                              "youtube.confirmDisconnect"
                                                          )}
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={() =>
                                                    handleDisconnectClick(
                                                        channel.id
                                                    )
                                                }
                                            >
                                                {t("youtube.disconnect")}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Other Available Channels */}
                {nonYoutubeDisconnected.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900">
                            {t("youtube.notConnected")} (
                            {nonYoutubeDisconnected.length})
                        </h3>
                        <div className="space-y-3">
                            {nonYoutubeDisconnected.map(channel => (
                                <div
                                    key={channel.id}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <DynamicIcon
                                            name={
                                                getPlatformIcon(
                                                    channel.platform
                                                ) as import("@/lib/icons").IconName
                                            }
                                            size={24}
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {getPlatformName(
                                                    channel.platform
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {t("youtube.notConnected")}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            handlePlatformConnect(
                                                channel.platform
                                            )
                                        }
                                        disabled={
                                            connectingPlatform ===
                                            channel.platform
                                        }
                                    >
                                        {connectingPlatform === channel.platform
                                            ? t("youtube.connecting")
                                            : t("youtube.connect")}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default ChannelsSection
