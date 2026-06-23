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
    onConnect,
}) => {
    const t = useTranslations("dashboard")
    const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
    const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(
        null
    )
    const [connectingYoutube, setConnectingYoutube] = useState(false)

    /**
     * Handle disconnect click
     */
    const handleDisconnectClick = (channelId: string) => {
        setConfirmDisconnect(channelId)
    }

    /**
     * Confirm disconnect
     */
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
     * Handle YouTube OAuth connect
     */
    const handleYoutubeConnect = async () => {
        if (connectingYoutube) return
        setConnectingYoutube(true)
        try {
            const response = await fetch("/api/youtube/link/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            })
            if (!response.ok) {
                const data = await response.json()
                throw new Error(
                    data.message || "Failed to start YouTube linking"
                )
            }
            const data = await response.json()
            if (data.authorizationUrl) {
                window.location.href = data.authorizationUrl
            } else {
                throw new Error("No authorization URL returned")
            }
        } catch (err) {
            logger.error("Failed to connect YouTube", { error: err })
            setConnectingYoutube(false)
        }
    }

    /**
     * Handle YouTube disconnect via revoke API
     */
    const handleYoutubeDisconnect = async (channelId: string) => {
        try {
            setDisconnectingId(channelId)
            const response = await fetch("/api/youtube/link/revoke", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            })
            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.message || "Failed to disconnect YouTube")
            }
            onDisconnect(channelId)
            setConfirmDisconnect(null)
        } catch (err) {
            logger.error("Failed to disconnect YouTube", { error: err })
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
                                                handleYoutubeDisconnect(
                                                    youtubeChannel.id
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
                                onClick={handleYoutubeConnect}
                                disabled={connectingYoutube}
                                className="bg-red-600 text-white hover:bg-red-700"
                            >
                                {connectingYoutube
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
                                                        handleConfirmDisconnect(
                                                            channel.id
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
                                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 opacity-60"
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
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                                        {t("youtube.notConnected")}
                                    </span>
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
