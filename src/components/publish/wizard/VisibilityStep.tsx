"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SiYoutube } from "@icons-pack/react-simple-icons"
import { useTranslations } from "next-intl"
import { useState, useEffect } from "react"
import type { PublishWizardState, YouTubeMetadata } from "./types"
import { DEFAULT_YOUTUBE_METADATA } from "./types"

interface VisibilityStepProps {
    state: PublishWizardState
    onStateChange: (state: PublishWizardState) => void
    onBack: () => void
    onNext: () => void
}

export default function VisibilityStep({
    state,
    onStateChange,
    onBack,
    onNext,
}: VisibilityStepProps) {
    const t = useTranslations("publish")
    const [scheduleType, setScheduleType] = useState<"now" | "later">("now")

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

    // Set default schedule time to tomorrow at 10am if switching to schedule
    useEffect(() => {
        if (scheduleType === "later" && !youtubeMeta.scheduledDate) {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            tomorrow.setHours(10, 0, 0, 0)
            setYouTubeMeta({
                scheduledDate: tomorrow,
                scheduledTime: "10:00",
            })
        }
    }, [scheduleType])

    if (!hasYouTube) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold">
                        {t("step6.title")}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {t("step6.description")}
                    </p>
                </div>
                <Card>
                    <CardContent className="py-8 text-center text-sm text-gray-500">
                        {t("step6.noYouTube")}
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
                <h2 className="text-xl font-semibold">{t("step6.title")}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("step6.description")}
                </p>
            </div>

            {/* Audience */}
            <Card className="border-l-4 border-l-red-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <SiYoutube className="h-5 w-5 text-red-600" />
                        {t("step6.audience")}
                        <Badge variant="secondary" className="ml-auto text-xs">
                            <SiYoutube className="mr-1 h-3 w-3" />
                            YouTube
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <Label>{t("step6.madeForKids")}</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="madeForKids"
                                    checked={!youtubeMeta.madeForKids}
                                    onChange={() =>
                                        setYouTubeMeta({ madeForKids: false })
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                    {t("step6.madeForKidsNo")}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="madeForKids"
                                    checked={youtubeMeta.madeForKids}
                                    onChange={() =>
                                        setYouTubeMeta({ madeForKids: true })
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                    {t("step6.madeForKidsYes")}
                                </span>
                            </label>
                        </div>
                        <p className="text-xs text-gray-400">
                            {t("step6.madeForKidsHint")}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Content: AI, Paid Promotion */}
            <Card className="border-l-4 border-l-red-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <SiYoutube className="h-5 w-5 text-red-600" />
                        {t("step6.content")}
                        <Badge variant="secondary" className="ml-auto text-xs">
                            <SiYoutube className="mr-1 h-3 w-3" />
                            YouTube
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <Label>{t("step6.aiGenerated")}</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="aiGenerated"
                                    checked={!youtubeMeta.aiGenerated}
                                    onChange={() =>
                                        setYouTubeMeta({ aiGenerated: false })
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                    {t("step6.aiGeneratedNo")}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="aiGenerated"
                                    checked={youtubeMeta.aiGenerated}
                                    onChange={() =>
                                        setYouTubeMeta({ aiGenerated: true })
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                    {t("step6.aiGeneratedYes")}
                                </span>
                            </label>
                        </div>
                        <p className="text-xs text-gray-400">
                            {t("step6.aiGeneratedHint")}
                        </p>
                    </div>
                    <div className="space-y-3">
                        <Label>{t("step6.paidPromotion")}</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="paidPromotion"
                                    checked={!youtubeMeta.paidPromotion}
                                    onChange={() =>
                                        setYouTubeMeta({ paidPromotion: false })
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                    {t("step6.paidPromotionNo")}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="paidPromotion"
                                    checked={youtubeMeta.paidPromotion}
                                    onChange={() =>
                                        setYouTubeMeta({ paidPromotion: true })
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                    {t("step6.paidPromotionYes")}
                                </span>
                            </label>
                        </div>
                        <p className="text-xs text-gray-400">
                            {t("step6.paidPromotionHint")}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Monetization */}
            <Card className="border-l-4 border-l-red-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <SiYoutube className="h-5 w-5 text-red-600" />
                        {t("step6.monetization")}
                        <Badge variant="secondary" className="ml-auto text-xs">
                            <SiYoutube className="mr-1 h-3 w-3" />
                            YouTube
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <Label>{t("step6.monetizationTitle")}</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="monetization"
                                    checked={youtubeMeta.monetization}
                                    onChange={() =>
                                        setYouTubeMeta({ monetization: true })
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                    {t("step6.monetizationYes")}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="monetization"
                                    checked={!youtubeMeta.monetization}
                                    onChange={() =>
                                        setYouTubeMeta({ monetization: false })
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                    {t("step6.monetizationNo")}
                                </span>
                            </label>
                        </div>
                        <p className="text-xs text-gray-400">
                            {t("step6.monetizationHint")}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Cards and End Screens */}
            <Card className="border-l-4 border-l-red-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <SiYoutube className="h-5 w-5 text-red-600" />
                        {t("step6.cards")}
                        <Badge variant="secondary" className="ml-auto text-xs">
                            <SiYoutube className="mr-1 h-3 w-3" />
                            YouTube
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xs text-gray-400">
                        {t("step6.cardsHint")}
                    </p>
                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="video-link-start">
                                {t("step6.addVideoStart")}
                            </Label>
                            <Input
                                id="video-link-start"
                                value={youtubeMeta.linkedVideoStart}
                                onChange={e =>
                                    setYouTubeMeta({
                                        linkedVideoStart: e.target.value,
                                    })
                                }
                                placeholder={t("step6.videoUrlPlaceholder")}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="video-link-end">
                                {t("step6.addVideoEnd")}
                            </Label>
                            <Input
                                id="video-link-end"
                                value={youtubeMeta.linkedVideoEnd}
                                onChange={e =>
                                    setYouTubeMeta({
                                        linkedVideoEnd: e.target.value,
                                    })
                                }
                                placeholder={t("step6.videoUrlPlaceholder")}
                                className="mt-1"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Privacy and Scheduling */}
            <Card className="border-l-4 border-l-red-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <SiYoutube className="h-5 w-5 text-red-600" />
                        {t("step6.privacy")}
                        <Badge variant="secondary" className="ml-auto text-xs">
                            <SiYoutube className="mr-1 h-3 w-3" />
                            YouTube
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Privacy Status */}
                    <div className="space-y-2">
                        <Label>{t("step6.privacyStatus")}</Label>
                        <Select
                            value={youtubeMeta.privacyStatus}
                            onValueChange={(
                                v: "public" | "unlisted" | "private"
                            ) => setYouTubeMeta({ privacyStatus: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="public">
                                    {t("step6.public")}
                                </SelectItem>
                                <SelectItem value="unlisted">
                                    {t("step6.unlisted")}
                                </SelectItem>
                                <SelectItem value="private">
                                    {t("step6.private")}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Schedule type */}
                    <div className="space-y-3 border-t pt-3 dark:border-gray-700">
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="scheduleType"
                                    checked={scheduleType === "now"}
                                    onChange={() => setScheduleType("now")}
                                    className="h-4 w-4"
                                />
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                    {t("step6.scheduleNow")}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="scheduleType"
                                    checked={scheduleType === "later"}
                                    onChange={() => setScheduleType("later")}
                                    className="h-4 w-4"
                                />
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                    {t("step6.scheduleLater")}
                                </span>
                            </label>
                        </div>

                        {scheduleType === "later" && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="schedule-date">
                                        {t("step6.scheduleDate")}
                                    </Label>
                                    <Input
                                        id="schedule-date"
                                        type="date"
                                        value={
                                            youtubeMeta.scheduledDate
                                                ? youtubeMeta.scheduledDate
                                                      .toISOString()
                                                      .split("T")[0]
                                                : ""
                                        }
                                        onChange={e => {
                                            const dateVal = e.target.value
                                            const d = dateVal
                                                ? new Date(
                                                      dateVal +
                                                          "T" +
                                                          (youtubeMeta.scheduledTime ||
                                                              "10:00")
                                                  )
                                                : null
                                            setYouTubeMeta({
                                                scheduledDate: d,
                                            })
                                        }}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="schedule-time">
                                        {t("step6.scheduleTime")}
                                    </Label>
                                    <Input
                                        id="schedule-time"
                                        type="time"
                                        value={youtubeMeta.scheduledTime}
                                        onChange={e =>
                                            setYouTubeMeta({
                                                scheduledTime: e.target.value,
                                            })
                                        }
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        )}

                        {scheduleType === "later" && (
                            <div className="rounded bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                {t("step6.scheduleWarning")}
                            </div>
                        )}
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
