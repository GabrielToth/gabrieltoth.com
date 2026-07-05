"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    SiYoutube,
    SiFacebook,
    SiInstagram,
    SiX,
} from "@icons-pack/react-simple-icons"
import { FaLinkedin } from "react-icons/fa6"
import { useTranslations } from "next-intl"
import { CheckCircle, Lock, XCircle, AlertCircle } from "lucide-react"
import type { PlatformInfo } from "./types"

interface NetworkSelectStepProps {
    selectedPlatforms: string[]
    onPlatformsChange: (platforms: string[]) => void
    onNext: () => void
}

const NETWORKS: PlatformInfo[] = [
    {
        id: "youtube",
        labelKey: "step1.youtube",
        descKey: "step1.youtubeDesc",
        icon: <SiYoutube className="h-6 w-6 text-red-600" />,
        implemented: true,
        connected: true,
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
        icon: <SiFacebook className="h-6 w-6 text-blue-600" />,
        implemented: false,
        connected: false,
        features: ["text", "images", "channel_selection"],
    },
    {
        id: "instagram",
        labelKey: "step1.instagram",
        descKey: "step1.instagramDesc",
        icon: <SiInstagram className="h-6 w-6 text-pink-600" />,
        implemented: false,
        connected: false,
        features: ["text", "images", "video"],
    },
    {
        id: "twitter",
        labelKey: "step1.twitter",
        descKey: "step1.twitterDesc",
        icon: <SiX className="h-6 w-6 text-gray-800 dark:text-gray-200" />,
        implemented: false,
        connected: false,
        features: ["text", "images"],
    },
    {
        id: "linkedin",
        labelKey: "step1.linkedin",
        descKey: "step1.linkedinDesc",
        icon: <FaLinkedin className="h-6 w-6 text-blue-700" />,
        implemented: false,
        connected: false,
        features: ["text", "images"],
    },
]

export default function NetworkSelectStep({
    selectedPlatforms,
    onPlatformsChange,
    onNext,
}: NetworkSelectStepProps) {
    const t = useTranslations("publish")

    const togglePlatform = (platformId: string) => {
        if (selectedPlatforms.includes(platformId)) {
            onPlatformsChange(selectedPlatforms.filter(p => p !== platformId))
        } else {
            onPlatformsChange([...selectedPlatforms, platformId])
        }
    }

    const isImplemented = (id: string) => {
        return NETWORKS.find(n => n.id === id)?.implemented ?? false
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">{t("step1.title")}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("step1.description")}
                </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{t("step1.youtubeRecommended")}</span>
                </div>
            </div>

            <div className="grid gap-4">
                {NETWORKS.map(network => {
                    const isSelected = selectedPlatforms.includes(network.id)
                    const implemented = network.implemented

                    return (
                        <Card
                            key={network.id}
                            className={`relative overflow-hidden transition-all ${
                                !implemented
                                    ? "cursor-not-allowed opacity-60"
                                    : isSelected
                                      ? "border-2 border-blue-500 ring-2 ring-blue-500/20"
                                      : "cursor-pointer border hover:border-blue-300 hover:shadow-sm dark:hover:border-blue-700"
                            }`}
                            onClick={() => {
                                if (implemented) togglePlatform(network.id)
                            }}
                        >
                            <div className="flex items-start gap-4 p-4">
                                {/* Checkbox */}
                                <div className="pt-1">
                                    <Checkbox
                                        checked={isSelected}
                                        disabled={!implemented}
                                        onCheckedChange={() =>
                                            togglePlatform(network.id)
                                        }
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
                                        {implemented ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                <CheckCircle className="h-3 w-3" />
                                                {t("step1.implemented")}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                <Lock className="h-3 w-3" />
                                                {t("step1.notImplemented")}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                        {t(network.descKey)}
                                    </p>

                                    {/* Features / compatibility badges */}
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {network.features.map(feat => (
                                            <span
                                                key={feat}
                                                className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                            >
                                                {feat_label(feat, t)}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Disconnected warning */}
                                    {!network.connected && implemented && (
                                        <span className="mt-2 inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                                            <XCircle className="h-3 w-3" />
                                            {t("step1.disconnected")}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>

            {/* Navigation */}
            <div className="flex justify-end border-t pt-4 dark:border-gray-700">
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
