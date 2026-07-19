"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    SiYoutube,
    SiFacebook,
    SiInstagram,
    SiTiktok,
    SiX,
} from "@icons-pack/react-simple-icons"
import { FaLinkedin } from "react-icons/fa6"
import { useTranslations } from "next-intl"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import type { PlatformInfo, ContentType } from "./types"
import { CONTENT_TYPE_PLATFORMS } from "./types"

interface NetworkSelectStepProps {
    selectedPlatforms: string[]
    onPlatformsChange: (platforms: string[]) => void
    onBack: () => void
    onNext: () => void
    contentType: ContentType
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
    currentScopeVersion?: number
}

interface ChannelsResponse {
    channels: SocialChannel[]
}

const BASE_NETWORKS: PlatformInfo[] = [
    {
        id: "youtube",
        labelKey: "step1.youtube",
        descKey: "step1.youtubeDesc",
        icon: <SiYoutube className="h-6 w-6 text-red-600" />,
        features: [
            "text",
            "video",
            "title",
            "tags",
            "audience_kids",
            "ai_generated",
            "paid_promotion",
            "monetization",
            "content_restrictions",
            "cards_end_screens",
            "privacy_schedule",
            "channel_selection",
        ],
    },
    {
        id: "facebook",
        labelKey: "step1.facebook",
        descKey: "step1.facebookDesc",
        icon: <SiFacebook className="h-6 w-6 text-primary" />,
        features: ["text", "images", "channel_selection"],
    },
    {
        id: "instagram",
        labelKey: "step1.instagram",
        descKey: "step1.instagramDesc",
        icon: <SiInstagram className="h-6 w-6 text-pink-600" />,
        features: ["text", "images", "video"],
    },
    {
        id: "twitter",
        labelKey: "step1.twitter",
        descKey: "step1.twitterDesc",
        icon: <SiX className="h-6 w-6 text-foreground dark:text-muted-foreground" />,
        features: ["text", "images"],
    },
    {
        id: "linkedin",
        labelKey: "step1.linkedin",
        descKey: "step1.linkedinDesc",
        icon: <FaLinkedin className="h-6 w-6 text-primary" />,
        features: ["text", "images"],
    },
    {
        id: "tiktok",
        labelKey: "step1.tiktok",
        descKey: "step1.tiktokDesc",
        icon: <SiTiktok className="h-6 w-6 text-black dark:text-foreground" />,
        features: ["video"],
    },
]

export default function NetworkSelectStep({
    selectedPlatforms,
    onPlatformsChange,
    onBack,
    onNext,
    contentType,
}: NetworkSelectStepProps) {
    const t = useTranslations("publish")
    const [channels, setChannels] = useState<SocialChannel[]>([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function fetchChannels() {
            try {
                const res = await fetch("/api/user/channels")
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`)
                }
                const data: ChannelsResponse = await res.json()
                if (!cancelled) {
                    setChannels(data.channels || [])
                    setLoading(false)
                }
            } catch {
                if (!cancelled) {
                    setFetchError(true)
                    setLoading(false)
                }
            }
        }

        fetchChannels()

        return () => {
            cancelled = true
        }
    }, [])

    // Group channels by platform and count connected ones
    const platformChannelCount: Record<string, number> = {}
    for (const ch of channels) {
        if (ch.isConnected) {
            platformChannelCount[ch.platform] =
                (platformChannelCount[ch.platform] || 0) + 1
        }
    }

    // Merge channel counts into network definitions
    const networks: PlatformInfo[] = BASE_NETWORKS.map(n => ({
        ...n,
        channelCount: platformChannelCount[n.id] || 0,
    }))

    // Filter platforms by content type compatibility
    const compatibleIds = CONTENT_TYPE_PLATFORMS[contentType] || []
    const filteredNetworks = networks.filter(n => compatibleIds.includes(n.id))

    const togglePlatform = (platformId: string) => {
        if (selectedPlatforms.includes(platformId)) {
            onPlatformsChange(selectedPlatforms.filter(p => p !== platformId))
        } else {
            onPlatformsChange([...selectedPlatforms, platformId])
        }
    }

    const isAvailable = (id: string): boolean => {
        return platformChannelCount[id] > 0
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">{t("step1.title")}</h2>
                <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
                    {t("step1.description")}
                </p>
            </div>

            <div className="rounded-lg bg-primary/5 p-4 text-sm text-primary dark:bg-primary/10 dark:text-primary">
                <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{t("step1.youtubeRecommended")}</span>
                </div>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">
                        {t("step2.loadingChannels")}
                    </span>
                </div>
            )}

            {/* Error state */}
            {fetchError && !loading && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-300">
                    <p>{t("step2.noChannels")}</p>
                </div>
            )}

            {/* Network cards */}
            {!loading && (
                <div className="grid gap-4">
                    {filteredNetworks.map(network => {
                        const isSelected = selectedPlatforms.includes(
                            network.id
                        )
                        const available = isAvailable(network.id)

                        return (
                            <Card
                                key={network.id}
                                className={`relative overflow-hidden transition-all ${
                                    !available
                                        ? "cursor-not-allowed opacity-60"
                                        : isSelected
                                          ? "border-2 border-primary ring-2 ring-ring/20"
                                          : "cursor-pointer border hover:border-primary/50 hover:shadow-sm dark:hover:border-border"
                                }`}
                                onClick={() => {
                                    if (available) {
                                        togglePlatform(network.id)
                                    }
                                }}
                            >
                                <div className="flex items-start gap-4 p-4">
                                    {/* Checkbox */}
                                    <div className="pt-1">
                                        <Checkbox
                                            checked={isSelected}
                                            disabled={!available}
                                            onCheckedChange={() => {
                                                if (available) {
                                                    togglePlatform(network.id)
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* Icon */}
                                    <div className="flex-shrink-0 pt-1">
                                        {network.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold">
                                                {t(network.labelKey)}
                                            </h3>
                                            {/* Account count badge */}
                                            {network.channelCount !==
                                                undefined &&
                                                network.channelCount > 0 && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        <CheckCircle className="h-3 w-3" />
                                                        {t(
                                                            "step1.accountCount",
                                                            {
                                                                count: network.channelCount,
                                                            }
                                                        )}
                                                    </span>
                                                )}
                                            {network.channelCount === 0 && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground dark:bg-card dark:text-muted-foreground">
                                                    {t("step1.noAccounts")}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
                                            {t(network.descKey)}
                                        </p>

                                        {/* Features / compatibility badges */}
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {network.features.map(feat => (
                                                <span
                                                    key={feat}
                                                    className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground dark:bg-card dark:text-muted-foreground"
                                                >
                                                    {feat_label(feat, t)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between border-t pt-4 dark:border-border">
                <Button onClick={onBack} variant="outline">
                    {t("wizard.back")}
                </Button>
                <Button
                    onClick={onNext}
                    disabled={selectedPlatforms.length === 0}
                >
                    {t("wizard.next")}
                </Button>
            </div>
        </div>
    )
}

/** Map feature key to short label for badges */
function feat_label(
    feat: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any
): string {
    const labels: Record<string, string> = {
        text: "📝 Texto",
        images: "🖼️ Imagens",
        video: "🎬 Vídeo",
        title: "🏷️ Título",
        tags: "# Tags",
        audience_kids: "👶 Público",
        ai_generated: "🤖 IA",
        paid_promotion: "💰 Promoção",
        monetization: "💵 Monetização",
        content_restrictions: "⚠️ Diretrizes",
        cards_end_screens: "🔗 Cards",
        privacy_schedule: "🔒 Privacidade",
        channel_selection: "📺 Canais",
    }
    return labels[feat] || feat
}
