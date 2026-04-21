"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Icon } from "@/components/ui/icon"
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
    const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
    const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(
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
     * Get platform icon name
     */
    const getPlatformIcon = (platform: string): string => {
        const iconMap: Record<string, string> = {
            facebook: "facebook",
            instagram: "instagram",
            twitter: "twitter",
            tiktok: "tiktok",
            linkedin: "linkedin",
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
        }
        return nameMap[platform] || platform
    }

    const connectedChannels = channels.filter(c => c.isConnected)
    const disconnectedChannels = channels.filter(c => !c.isConnected)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Connected Channels</CardTitle>
                <CardDescription>
                    Manage your connected social media accounts
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Connected Channels */}
                {connectedChannels.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900">
                            Connected Channels ({connectedChannels.length})
                        </h3>
                        <div className="space-y-3">
                            {connectedChannels.map(channel => (
                                <div
                                    key={channel.id}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon
                                            name={getPlatformIcon(
                                                channel.platform
                                            )}
                                            size="md"
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
                                                    Connected on{" "}
                                                    {new Date(
                                                        channel.connectedAt
                                                    ).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                                            Connected
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
                                                    Cancel
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
                                                        ? "Disconnecting..."
                                                        : "Confirm"}
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
                                                Disconnect
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Disconnected Channels */}
                {disconnectedChannels.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900">
                            Available Channels ({disconnectedChannels.length})
                        </h3>
                        <div className="space-y-3">
                            {disconnectedChannels.map(channel => (
                                <div
                                    key={channel.id}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 opacity-60"
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon
                                            name={getPlatformIcon(
                                                channel.platform
                                            )}
                                            size="md"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {getPlatformName(
                                                    channel.platform
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Not connected
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                                        Not Connected
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add Channel Button */}
                <div className="flex justify-end">
                    <Button
                        onClick={onConnect}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Add Channel
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default ChannelsSection
