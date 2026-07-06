"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SiYoutube } from "@icons-pack/react-simple-icons"
import { useTranslations } from "next-intl"
import type {
    PublishWizardState,
    YouTubeMetadata,
    AdSuitability,
} from "./types"
import {
    DEFAULT_YOUTUBE_METADATA,
    DEFAULT_AD_SUITABILITY,
    AD_SUITABILITY_CATEGORIES,
} from "./types"

interface AdSuitabilityStepProps {
    state: PublishWizardState
    onStateChange: (state: PublishWizardState) => void
    onBack: () => void
    onNext: () => void
}

export default function AdSuitabilityStep({
    state,
    onStateChange,
    onBack,
    onNext,
}: AdSuitabilityStepProps) {
    const t = useTranslations("publish")

    const hasYouTube = state.platformSelections.some(
        s => s.platformId === "youtube"
    )

    const youtubeMeta: YouTubeMetadata =
        state.platformMetadata.youtube || DEFAULT_YOUTUBE_METADATA

    const setYouTubeMeta = (update: Partial<YouTubeMetadata>) => {
        onStateChange({
            ...state,
            platformMetadata: {
                ...state.platformMetadata,
                youtube: { ...youtubeMeta, ...update },
            },
        })
    }

    const setAdSuitability = (
        category: keyof AdSuitability,
        value: 0 | 1 | 2
    ) => {
        setYouTubeMeta({
            adSuitability: {
                ...youtubeMeta.adSuitability,
                [category]: value,
            },
        })
    }

    if (!hasYouTube) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold">
                        {t("step5.title")}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {t("step5.description")}
                    </p>
                </div>
                <Card>
                    <CardContent className="py-8 text-center text-sm text-gray-500">
                        {t("step5.noYouTube")}
                    </CardContent>
                </Card>
                <div className="flex justify-between border-t pt-4 dark:border-gray-700">
                    <Button onClick={onBack} variant="outline">
                        {t("wizard.back")}
                    </Button>
                    <Button onClick={onNext}>{t("wizard.next")}</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">{t("step5.title")}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("step5.description")}
                </p>
            </div>

            {/* Ad Suitability — mirrors YouTube Studio's full questionnaire */}
            <Card className="border-l-4 border-l-red-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <SiYoutube className="h-5 w-5 text-red-600" />
                        {t("step5.adSuitability")}
                        <Badge variant="secondary" className="ml-auto text-xs">
                            <SiYoutube className="mr-1 h-3 w-3" />
                            YouTube
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("step5.adSuitabilityQuestion")}
                    </p>
                    <p className="text-xs text-gray-400">
                        {t("step5.adSuitabilityWhy")}
                    </p>

                    <div className="space-y-6">
                        {AD_SUITABILITY_CATEGORIES.map(cat => (
                            <div
                                key={cat.key}
                                className="rounded-lg border p-4 dark:border-gray-700"
                            >
                                <p className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {t(`step5.adCat_${cat.key}_title`)}
                                </p>
                                <div className="space-y-2">
                                    {Array.from(
                                        { length: cat.levels },
                                        (_, idx) => {
                                            const level = idx as 0 | 1 | 2
                                            const isSelected =
                                                youtubeMeta.adSuitability[
                                                    cat.key
                                                ] === level
                                            return (
                                                <label
                                                    key={level}
                                                    className={`flex cursor-pointer items-start gap-3 rounded border p-3 transition-colors ${
                                                        isSelected
                                                            ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/20"
                                                            : "hover:bg-gray-50 dark:hover:bg-gray-900 dark:border-gray-700"
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`ads-${cat.key}`}
                                                        checked={isSelected}
                                                        onChange={() =>
                                                            setAdSuitability(
                                                                cat.key,
                                                                level
                                                            )
                                                        }
                                                        className="mt-0.5 h-4 w-4 shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {t(
                                                                `step5.adCat_${cat.key}_l${level}_label`
                                                            )}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                            {t(
                                                                `step5.adCat_${cat.key}_l${level}_desc`
                                                            )}
                                                        </p>
                                                    </div>
                                                </label>
                                            )
                                        }
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* None of the above */}
                    <div className="border-t pt-4 dark:border-gray-700">
                        <label
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                                Object.values(youtubeMeta.adSuitability).every(
                                    v => v === 0
                                )
                                    ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/20"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-900 dark:border-gray-700"
                            }`}
                        >
                            <input
                                type="radio"
                                name="ads-none-of-the-above"
                                checked={Object.values(
                                    youtubeMeta.adSuitability
                                ).every(v => v === 0)}
                                onChange={() => {
                                    setYouTubeMeta({
                                        adSuitability: {
                                            ...DEFAULT_AD_SUITABILITY,
                                        },
                                    })
                                }}
                                className="h-4 w-4 shrink-0"
                            />
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {t("step5.adNone")}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t("step5.adNoneDesc")}
                                </p>
                            </div>
                        </label>
                    </div>
                </CardContent>
            </Card>

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
