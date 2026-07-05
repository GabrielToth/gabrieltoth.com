"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslations } from "next-intl"
import { SiYoutube, SiFacebook } from "@icons-pack/react-simple-icons"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import type { PlatformSelection } from "./types"

interface ChannelSelectStepProps {
    platformSelections: PlatformSelection[]
    onSelectionsChange: (selections: PlatformSelection[]) => void
    onBack: () => void
    onNext: () => void
}

/** Response shape from GET /api/user/channels */
interface SocialChannelResponse {
    channels: SocialChannel[]
}

interface SocialChannel {
    id: string
    platform: string
    accountId: string
    accountName: string
    isConnected: boolean
    thumbnailUrl?: string
    connectedAt?: string
    needsReconnect?: boolean
}

/** Map platform to channel icon */
const CHANNEL_ICONS: Record<string, React.ReactNode> = {
    youtube: <SiYoutube className="h-5 w-5 text-red-500" />,
    facebook: <SiFacebook className="h-5 w-5 text-blue-600" />,
}

/** Platforms that require channel selection */
const PLATFORMS_WITH_CHANNELS = new Set(["youtube", "facebook"])

interface AvailableChannel {
    id: string
    platformId: string
    name: string
    thumbnailUrl: string
    metadata: string
}

export default function ChannelSelectStep({
    platformSelections,
    onSelectionsChange,
    onBack,
    onNext,
}: ChannelSelectStepProps) {
    const t = useTranslations("publish")
    const [channelsByPlatform, setChannelsByPlatform] = useState<
        Record<string, AvailableChannel[]>
    >({})
    const [loading, setLoading] = useState(true)

    // Determine which platforms need channel selection
    const platformsNeedingChannels = platformSelections.filter(s =>
        PLATFORMS_WITH_CHANNELS.has(s.platformId)
    )

    useEffect(() => {
        async function fetchAllChannels() {
            setLoading(true)

            try {
                const res = await fetch("/api/user/channels")
                if (!res.ok) {
                    setLoading(false)
                    return
                }

                const data: SocialChannelResponse = await res.json()
                const allChannels = data.channels || []

                // Group connected channels by platform
                const results: Record<string, AvailableChannel[]> = {}

                for (const sel of platformsNeedingChannels) {
                    const platformChannels = allChannels
                        .filter(
                            ch =>
                                ch.platform === sel.platformId && ch.isConnected
                        )
                        .map(ch => ({
                            id: ch.accountId,
                            platformId: sel.platformId,
                            name: ch.accountName,
                            thumbnailUrl: ch.thumbnailUrl || "",
                            metadata: ch.connectedAt
                                ? t("step2.connectedSince", {
                                      date: new Date(
                                          ch.connectedAt
                                      ).toLocaleDateString(),
                                  })
                                : "",
                        }))

                    results[sel.platformId] = platformChannels
                }

                setChannelsByPlatform(results)
            } catch {
                // API error — leave results empty
            } finally {
                setLoading(false)
            }
        }

        if (platformsNeedingChannels.length > 0) {
            fetchAllChannels()
        } else {
            setLoading(false)
        }
    }, [platformsNeedingChannels.map(s => s.platformId).join(","), t])

    const toggleChannel = (platformId: string, channelId: string) => {
        const updated = platformSelections.map(sel => {
            if (sel.platformId !== platformId) return sel
            const ids = sel.channelIds.includes(channelId)
                ? sel.channelIds.filter(id => id !== channelId)
                : [...sel.channelIds, channelId]
            return { ...sel, channelIds: ids }
        })
        onSelectionsChange(updated)
    }

    const getChannelIds = (platformId: string): string[] => {
        return (
            platformSelections.find(s => s.platformId === platformId)
                ?.channelIds || []
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">{t("step2.title")}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("step2.description")}
                </p>
            </div>

            {/* Duplicate content warning: only when 2+ channels on same platform */}
            {platformSelections.some(s => s.channelIds.length >= 2) && (
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
            )}

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">
                        {t("step2.loadingChannels")}
                    </span>
                </div>
            ) : platformsNeedingChannels.length === 0 ? (
                /* No platforms need channel selection → skip */
                <div className="py-8 text-center text-sm text-gray-500">
                    No channel selection needed for selected platforms.
                </div>
            ) : (
                /* Channel list per platform */
                <div className="space-y-6">
                    {platformsNeedingChannels.map(sel => {
                        const channels =
                            channelsByPlatform[sel.platformId] || []
                        const selectedIds = getChannelIds(sel.platformId)

                        return (
                            <div key={sel.platformId}>
                                <div className="mb-3 flex items-center gap-2">
                                    {CHANNEL_ICONS[sel.platformId] || null}
                                    <h3 className="font-semibold capitalize">
                                        {sel.platformId}
                                    </h3>
                                    <span className="text-xs text-gray-400">
                                        {t("step2.channelCount", {
                                            count: selectedIds.length,
                                        })}
                                    </span>
                                </div>

                                {channels.length === 0 ? (
                                    <Card className="p-6 text-center">
                                        <p className="text-sm text-gray-500">
                                            {t("step2.noChannels")}
                                        </p>
                                        {sel.platformId === "youtube" && (
                                            <Button
                                                className="mt-3"
                                                size="sm"
                                                variant="outline"
                                                asChild
                                            >
                                                <a href="/dashboard/channels">
                                                    {t("step2.connectChannel")}
                                                </a>
                                            </Button>
                                        )}
                                    </Card>
                                ) : (
                                    <div className="space-y-2">
                                        {channels.map(channel => (
                                            <Card
                                                key={channel.id}
                                                className={`transition-all ${
                                                    selectedIds.includes(
                                                        channel.id
                                                    )
                                                        ? "border-blue-400 ring-1 ring-blue-400 dark:border-blue-600"
                                                        : ""
                                                }`}
                                            >
                                                <label
                                                    htmlFor={`ch-${sel.platformId}-${channel.id}`}
                                                    className="flex cursor-pointer items-center gap-4 p-4"
                                                >
                                                    <Checkbox
                                                        id={`ch-${sel.platformId}-${channel.id}`}
                                                        checked={selectedIds.includes(
                                                            channel.id
                                                        )}
                                                        onCheckedChange={() =>
                                                            toggleChannel(
                                                                sel.platformId,
                                                                channel.id
                                                            )
                                                        }
                                                    />
                                                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                                                        {channel.thumbnailUrl ? (
                                                            <img
                                                                src={
                                                                    channel.thumbnailUrl
                                                                }
                                                                alt={
                                                                    channel.name
                                                                }
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            CHANNEL_ICONS[
                                                                sel.platformId
                                                            ] || (
                                                                <div className="flex h-full w-full items-center justify-center text-gray-400">
                                                                    ?
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">
                                                            {channel.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {channel.metadata}
                                                        </p>
                                                    </div>
                                                </label>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between border-t pt-4 dark:border-gray-700">
                <Button onClick={onBack} variant="outline">
                    {t("wizard.back")}
                </Button>
                <Button onClick={onNext}>{t("wizard.next")}</Button>
            </div>
        </div>
    )
}
