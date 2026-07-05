"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    SiYoutube,
    SiFacebook,
    SiInstagram,
    SiX,
} from "@icons-pack/react-simple-icons"
import { FaLinkedin } from "react-icons/fa6"
import { useTranslations } from "next-intl"
import { CheckCircle, Lock, XCircle } from "lucide-react"

export interface NetworkOption {
    id: string
    labelKey: string
    descKey: string
    icon: React.ReactNode
    implemented: boolean
    connected: boolean
}

interface NetworkSelectStepProps {
    onSelect: (platform: string) => void
}

const NETWORKS: NetworkOption[] = [
    {
        id: "youtube",
        labelKey: "step1.youtube",
        descKey: "step1.youtubeDesc",
        icon: <SiYoutube className="h-6 w-6 text-red-600" />,
        implemented: true,
        connected: true,
    },
    {
        id: "facebook",
        labelKey: "step1.facebook",
        descKey: "step1.facebookDesc",
        icon: <SiFacebook className="h-6 w-6 text-blue-600" />,
        implemented: false,
        connected: false,
    },
    {
        id: "instagram",
        labelKey: "step1.instagram",
        descKey: "step1.instagramDesc",
        icon: <SiInstagram className="h-6 w-6 text-pink-600" />,
        implemented: false,
        connected: false,
    },
    {
        id: "twitter",
        labelKey: "step1.twitter",
        descKey: "step1.twitterDesc",
        icon: <SiX className="h-6 w-6 text-gray-800 dark:text-gray-200" />,
        implemented: false,
        connected: false,
    },
    {
        id: "linkedin",
        labelKey: "step1.linkedin",
        descKey: "step1.linkedinDesc",
        icon: <FaLinkedin className="h-6 w-6 text-blue-700" />,
        implemented: false,
        connected: false,
    },
]

export default function NetworkSelectStep({
    onSelect,
}: NetworkSelectStepProps) {
    const t = useTranslations("publish")

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">{t("step1.title")}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("step1.description")}
                </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                {t("step1.youtubeRecommended")}
            </div>

            <div className="grid gap-4">
                {NETWORKS.map(network => (
                    <Card
                        key={network.id}
                        className={`relative overflow-hidden transition-all ${
                            network.implemented
                                ? "cursor-pointer border-blue-300 hover:border-blue-500 hover:shadow-md dark:border-blue-700 dark:hover:border-blue-500"
                                : "cursor-not-allowed opacity-60"
                        }`}
                        onClick={() => {
                            if (network.implemented) onSelect(network.id)
                        }}
                    >
                        <div className="flex items-start gap-4 p-4">
                            <div className="flex-shrink-0 pt-1">
                                {network.icon}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">
                                        {t(network.labelKey)}
                                    </h3>
                                    {network.implemented ? (
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
                                {!network.connected && network.implemented && (
                                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                                        <XCircle className="h-3 w-3" />
                                        {t("step1.disconnected")}
                                    </span>
                                )}
                            </div>

                            {network.implemented && (
                                <div className="flex-shrink-0">
                                    <Button
                                        size="sm"
                                        onClick={e => {
                                            e.stopPropagation()
                                            onSelect(network.id)
                                        }}
                                    >
                                        {t("step1.selectChannel")}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
