"use client"

import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
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
    const t = useTranslations("dashboard.publish")
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
        <div className="rounded-lg border border-border bg-white p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
                {/* Header with title and selected count */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-foreground">
                            {t("filterByChannel")}
                        </label>
                        {selectedChannels.length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t("filtersApplied", {
                                    count: selectedChannels.length,
                                })}
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
                                        ? "bg-primary/10 text-primary ring-2 ring-ring"
                                        : "bg-muted text-foreground hover:bg-accent"
                                }`}
                                aria-pressed={selectedChannels.includes(
                                    channel.platform
                                )}
                                title={
                                    t("filterByChannel") +
                                    ": " +
                                    channel.accountName
                                }
                            >
                                {channel.accountName}
                            </button>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {t("noConnectedChannels")}
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
                            className="text-primary hover:text-primary hover:bg-primary/5 min-h-10"
                        >
                            {t("clearAllFilters")}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default FilterBar
