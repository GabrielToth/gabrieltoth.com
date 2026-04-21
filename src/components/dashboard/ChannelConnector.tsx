"use client"

import { cn } from "@/lib/utils"
import React, { useState } from "react"

export interface SocialChannel {
    id: string
    name: string
    icon: React.ReactNode
    isConnected: boolean
}

export interface ChannelConnectorProps {
    channels: SocialChannel[]
    onConnect: (channelId: string) => void
    onDisconnect: (channelId: string) => void
    className?: string
}

/**
 * ChannelConnector Component
 * Social channel connection management UI
 * Features:
 * - Display icons for supported social networks
 * - Show connection status (connected/disconnected)
 * - Allow users to connect/disconnect channels
 * - Visual indicators for connection status
 * - Tailwind CSS styling with Vercel color palette
 * - Accessible with ARIA attributes
 */
export const ChannelConnector: React.FC<ChannelConnectorProps> = ({
    channels,
    onConnect,
    onDisconnect,
    className,
}) => {
    const [hoveredChannel, setHoveredChannel] = useState<string | null>(null)

    const handleChannelClick = (channel: SocialChannel) => {
        if (channel.isConnected) {
            onDisconnect(channel.id)
        } else {
            onConnect(channel.id)
        }
    }

    return (
        <div className={cn("space-y-3", className)}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Connect Channels
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {channels.map(channel => (
                    <div
                        key={channel.id}
                        className="relative"
                        onMouseEnter={() => setHoveredChannel(channel.id)}
                        onMouseLeave={() => setHoveredChannel(null)}
                    >
                        <button
                            onClick={() => handleChannelClick(channel)}
                            className={cn(
                                "relative flex h-12 w-12 items-center justify-center rounded-lg border-2 transition-all",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                                channel.isConnected
                                    ? "border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                            )}
                            title={channel.name}
                            aria-label={`${channel.name} - ${channel.isConnected ? "Connected" : "Disconnected"}`}
                            aria-pressed={channel.isConnected}
                        >
                            <span className="flex h-6 w-6 items-center justify-center text-lg">
                                {channel.icon}
                            </span>

                            {/* Connection Status Indicator */}
                            {channel.isConnected && (
                                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
                                    <svg
                                        className="h-3 w-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            )}
                        </button>

                        {/* Tooltip */}
                        {hoveredChannel === channel.id && (
                            <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white">
                                {channel.name}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Connection Status Summary */}
            <div className="text-xs text-gray-500">
                {channels.filter(c => c.isConnected).length} of{" "}
                {channels.length} channels connected
            </div>
        </div>
    )
}
