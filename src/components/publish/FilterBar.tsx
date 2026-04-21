"use client"

import { Button } from "@/components/ui/button"
import React from "react"

export interface SocialChannel {
    id: string
    platform: "facebook" | "instagram" | "twitter" | "tiktok" | "linkedin"
    accountId: string
    accountName: string
    isConnected: boolean
    connectedAt?: Date
}

export interface FilterBarProps {
    channels: SocialChannel[]
    selectedChannels: string[]
    onFilterChange: (channels: string[]) => void
}

/**
 * FilterBar Component
 * Displays multi-select filter controls for social channels
 *
 * Features:
 * - Multi-select capability for filtering by channel
 * - Clear all button to reset filters
 * - Display selected filters count
 * - Disabled state for disconnected channels
 * - Responsive layout
 */
export const FilterBar: React.FC<FilterBarProps> = ({
    channels,
    selectedChannels,
    onFilterChange,
}) => {
    const handleChannelToggle = (platform: string) => {
        const newSelectedChannels = selectedChannels.includes(platform)
            ? selectedChannels.filter(c => c !== platform)
            : [...selectedChannels, platform]
        onFilterChange(newSelectedChannels)
    }

    const handleClearAll = () => {
        onFilterChange([])
    }

    const connectedChannels = channels.filter(c => c.isConnected)

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
                {/* Header with title and selected count */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-gray-900">
                            Filter by Channel
                        </label>
                        {selectedChannels.length > 0 && (
                            <p className="mt-1 text-xs text-gray-500">
                                {selectedChannels.length} filter
                                {selectedChannels.length !== 1 ? "s" : ""}{" "}
                                applied
                            </p>
                        )}
                    </div>
                </div>

                {/* Channel filter buttons */}
                <div className="flex flex-wrap gap-2">
                    {connectedChannels.length > 0 ? (
                        connectedChannels.map(channel => (
                            <button
                                key={channel.id}
                                onClick={() =>
                                    handleChannelToggle(channel.platform)
                                }
                                className={`inline-flex items-center rounded-full px-3 py-2 text-xs sm:text-sm font-medium transition-colors min-h-10 ${
                                    selectedChannels.includes(channel.platform)
                                        ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                                aria-pressed={selectedChannels.includes(
                                    channel.platform
                                )}
                                title={`Filter by ${channel.accountName}`}
                            >
                                {channel.accountName}
                            </button>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500">
                            No connected channels available
                        </p>
                    )}
                </div>

                {/* Clear all button */}
                {selectedChannels.length > 0 && (
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAll}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 min-h-10"
                        >
                            Clear all filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default FilterBar
