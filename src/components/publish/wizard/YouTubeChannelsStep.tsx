"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslations } from "next-intl"
import { AlertTriangle, Loader2 } from "lucide-react"
import { SiYoutube } from "@icons-pack/react-simple-icons"
import { useEffect, useState } from "react"
import type { YouTubeChannel } from "./types"

interface YouTubeChannelsStepProps {
    selectedChannelIds: string[]
    onChannelsChange: (ids: string[]) => void
    onBack: () => void
    onNext: () => void
}

export default function YouTubeChannelsStep({
    selectedChannelIds,
    onChannelsChange,
    onBack,
    onNext,
}: YouTubeChannelsStepProps) {
    const t = useTranslations("publish")
    const [channels, setChannels] = useState<YouTubeChannel[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchChannels() {
            try {
                const res = await fetch("/api/youtube/channels")
                if (res.ok) {
                    const data = await res.json()
                    setChannels(data.channels || data || [])
                }
            } catch {
                // If API fails, show empty state
            } finally {
                setLoading(false)
            }
        }
        fetchChannels()
    }, [])

    const toggleChannel = (channelId: string) => {
        const isSelected = selectedChannelIds.includes(channelId)
        if (isSelected) {
            onChannelsChange(selectedChannelIds.filter(id => id !== channelId))
        } else {
            onChannelsChange([...selectedChannelIds, channelId])
        }
    }

    const formatNumber = (num: number): string => {
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M"
        if (num >= 1_000) return (num / 1_000).toFixed(1) + "K"
        return num.toString()
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">{t("step2.title")}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("step2.description")}
                </p>
            </div>

            {/* Duplicate content warning */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-300">
                            {t("step2.channelWarningTitle")}
                        </h4>
                        <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                            {t("step2.channelWarning")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">
                        {t("step2.loadingChannels")}
                    </span>
                </div>
            ) : channels.length === 0 ? (
                /* No channels */
                <Card className="p-8 text-center">
                    <SiYoutube className="mx-auto h-12 w-12 text-red-500" />
                    <h3 className="mt-4 font-semibold">
                        {t("step2.noChannels")}
                    </h3>
                    <Button className="mt-4" asChild>
                        <a href="/dashboard/settings/channels">
                            {t("step2.connectChannel")}
                        </a>
                    </Button>
                </Card>
            ) : (
                /* Channel list */
                <div className="space-y-3">
                    <p className="text-sm text-gray-500">
                        {t("step2.channelCount", {
                            count: selectedChannelIds.length,
                        })}
                    </p>
                    {channels.map(channel => (
                        <Card
                            key={channel.id}
                            className={`transition-all ${
                                selectedChannelIds.includes(channel.id)
                                    ? "border-blue-400 ring-1 ring-blue-400 dark:border-blue-600"
                                    : ""
                            }`}
                        >
                            <label
                                htmlFor={`channel-${channel.id}`}
                                className="flex cursor-pointer items-center gap-4 p-4"
                            >
                                <Checkbox
                                    id={`channel-${channel.id}`}
                                    checked={selectedChannelIds.includes(
                                        channel.id
                                    )}
                                    onCheckedChange={() =>
                                        toggleChannel(channel.id)
                                    }
                                />
                                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                                    {channel.thumbnailUrl ? (
                                        <img
                                            src={channel.thumbnailUrl}
                                            alt={channel.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <SiYoutube className="h-full w-full p-2 text-red-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                        {channel.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatNumber(channel.subscriberCount)}{" "}
                                        {t("step2.channelSubscribers")} ·{" "}
                                        {formatNumber(channel.videoCount)}{" "}
                                        {t("step2.channelVideos")}
                                    </p>
                                </div>
                            </label>
                        </Card>
                    ))}
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between border-t pt-4 dark:border-gray-700">
                <Button onClick={onBack} variant="outline">
                    {t("wizard.back")}
                </Button>
                <Button
                    onClick={onNext}
                    disabled={selectedChannelIds.length === 0}
                >
                    {t("wizard.next")}
                </Button>
            </div>
        </div>
    )
}
