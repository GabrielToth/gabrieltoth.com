"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTranslations } from "next-intl"
import { Upload, FileVideo, AlertCircle, X } from "lucide-react"
import { useCallback, useRef, useState, useEffect } from "react"
import type { YouTubeMetadata } from "./types"

interface YouTubeMetadataFormProps {
    metadata: YouTubeMetadata
    onMetadataChange: (metadata: YouTubeMetadata) => void
    videoFile: File | null
    onVideoFileChange: (file: File | null) => void
    onBack: () => void
    onNext: () => void
    /** Whether to allow scheduling instead of immediate */
    allowSchedule?: boolean
}

function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
    }
    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(0)}MB`
    }
    return `${(bytes / 1024).toFixed(0)}KB`
}

export default function YouTubeMetadataForm({
    metadata,
    onMetadataChange,
    videoFile,
    onVideoFileChange,
    onBack,
    onNext,
    allowSchedule = true,
}: YouTubeMetadataFormProps) {
    const t = useTranslations("publish")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [dragOver, setDragOver] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [scheduleType, setScheduleType] = useState<"now" | "later">("now")

    // Set default schedule time to now+1hr if switching to schedule
    useEffect(() => {
        if (scheduleType === "later" && !metadata.scheduledDate) {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            tomorrow.setHours(10, 0, 0, 0)
            onMetadataChange({
                ...metadata,
                scheduledDate: tomorrow,
                scheduledTime: "10:00",
            })
        }
    }, [scheduleType])

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!videoFile) {
            newErrors.videoFile = t("step4.fileRequired")
        }
        if (!metadata.title.trim()) {
            newErrors.title = t("step4.titleRequired")
        }
        if (metadata.title.length > 100) {
            newErrors.title = t("step4.titleMax")
        }
        if (metadata.description.length > 5000) {
            newErrors.description = t("step4.descriptionMax")
        }
        if (metadata.tags.length > 30) {
            newErrors.tags = t("step4.tagsMax")
        }
        if (
            scheduleType === "later" &&
            !metadata.scheduledDate &&
            allowSchedule
        ) {
            newErrors.schedule = "Schedule date is required"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validate()) {
            // Convert schedule type to privacy status
            const updatedMetadata = {
                ...metadata,
                privacyStatus:
                    scheduleType === "later"
                        ? "private"
                        : metadata.privacyStatus,
            }
            onMetadataChange(updatedMetadata)
            onNext()
        }
    }

    const handleVideoDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files?.[0]
            if (file && file.type.startsWith("video/")) {
                onVideoFileChange(file)
                setErrors(prev => {
                    const next = { ...prev }
                    delete next.videoFile
                    return next
                })
            }
        },
        [onVideoFileChange]
    )

    const handleVideoChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) {
                if (!file.type.startsWith("video/")) return
                onVideoFileChange(file)
                setErrors(prev => {
                    const next = { ...prev }
                    delete next.videoFile
                    return next
                })
            }
        },
        [onVideoFileChange]
    )

    const handleTagsChange = (raw: string) => {
        const tags = raw
            .split(",")
            .map(t => t.trim())
            .filter(Boolean)
            .slice(0, 30)
        // Limit total chars to 500
        let total = 0
        const limited: string[] = []
        for (const tag of tags) {
            if (total + tag.length + 1 > 500) break
            limited.push(tag)
            total += tag.length + 1
        }
        onMetadataChange({ ...metadata, tags: limited })
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">{t("step4.title")}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("step4.description")}
                </p>
            </div>

            {/* Video File Upload */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <FileVideo className="h-5 w-5" />
                        {t("step4.videoFile")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!videoFile ? (
                        <div
                            onDragOver={e => {
                                e.preventDefault()
                                setDragOver(true)
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleVideoDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex cursor-pointer flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors ${
                                dragOver
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                    : "border-gray-300 hover:border-gray-400 dark:border-gray-600"
                            }`}
                        >
                            <Upload className="h-10 w-10 text-gray-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t("step4.dropzone")}
                            </p>
                            <p className="text-xs text-gray-400">
                                {t("step4.maxSize")}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={e => {
                                    e.stopPropagation()
                                    fileInputRef.current?.click()
                                }}
                            >
                                {t("step4.browse")}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
                            <FileVideo className="h-8 w-8 text-blue-500" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                    {videoFile.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatBytes(videoFile.size)}
                                </p>
                            </div>
                            <button
                                onClick={() => onVideoFileChange(null)}
                                className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
                                aria-label={t("step4.removeFile")}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoChange}
                    />
                    {errors.videoFile && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.videoFile}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {t("step4.basicInfo")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="video-title">
                            {t("step4.title")}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="video-title"
                            value={metadata.title}
                            onChange={e =>
                                onMetadataChange({
                                    ...metadata,
                                    title: e.target.value.slice(0, 100),
                                })
                            }
                            placeholder={t("step4.titlePlaceholder")}
                            maxLength={100}
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>
                                {metadata.title.length}/100{" "}
                                {t("step4.titleMax")}
                            </span>
                            {errors.title && (
                                <span className="text-red-500">
                                    {errors.title}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="video-description">
                            {t("step4.description")}
                        </Label>
                        <Textarea
                            id="video-description"
                            value={metadata.description}
                            onChange={e =>
                                onMetadataChange({
                                    ...metadata,
                                    description: e.target.value.slice(0, 5000),
                                })
                            }
                            placeholder={t("step4.descriptionPlaceholder")}
                            className="min-h-24 resize-none"
                            maxLength={5000}
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>
                                {metadata.description.length}/5000{" "}
                                {t("step4.descriptionMax")}
                            </span>
                            {errors.description && (
                                <span className="text-red-500">
                                    {errors.description}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Thumbnail hint */}
                    <div className="rounded bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-900">
                        {t("step4.thumbnailHint")}
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label htmlFor="video-tags">{t("step4.tags")}</Label>
                        <Input
                            id="video-tags"
                            value={metadata.tags.join(", ")}
                            onChange={e => handleTagsChange(e.target.value)}
                            placeholder={t("step4.tagsPlaceholder")}
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>{t("step4.tagsHint")}</span>
                            <span>{metadata.tags.length}/30 tags</span>
                        </div>
                        {errors.tags && (
                            <span className="text-xs text-red-500">
                                {errors.tags}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Audience - Made for Kids */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {t("step4.audience")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <Label>{t("step4.madeForKids")}</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="madeForKids"
                                    checked={!metadata.madeForKids}
                                    onChange={() =>
                                        onMetadataChange({
                                            ...metadata,
                                            madeForKids: false,
                                        })
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm">
                                    {t("step4.madeForKidsNo")}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="madeForKids"
                                    checked={metadata.madeForKids}
                                    onChange={() =>
                                        onMetadataChange({
                                            ...metadata,
                                            madeForKids: true,
                                        })
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm">
                                    {t("step4.madeForKidsYes")}
                                </span>
                            </label>
                        </div>
                        <p className="text-xs text-gray-400">
                            {t("step4.madeForKidsHint")}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Content - AI Generated */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {t("step4.content")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* AI Generated */}
                    <div className="space-y-3">
                        <Label>{t("step4.aiGenerated")}</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="aiGenerated"
                                    checked={!metadata.aiGenerated}
                                    onChange={() =>
                                        onMetadataChange({
                                            ...metadata,
                                            aiGenerated: false,
                                        })
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm">
                                    {t("step4.aiGeneratedNo")}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="aiGenerated"
                                    checked={metadata.aiGenerated}
                                    onChange={() =>
                                        onMetadataChange({
                                            ...metadata,
                                            aiGenerated: true,
                                        })
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm">
                                    {t("step4.aiGeneratedYes")}
                                </span>
                            </label>
                        </div>
                        <p className="text-xs text-gray-400">
                            {t("step4.aiGeneratedHint")}
                        </p>
                    </div>

                    {/* Paid Promotion */}
                    <div className="space-y-3">
                        <Label>{t("step4.paidPromotion")}</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="paidPromotion"
                                    checked={!metadata.paidPromotion}
                                    onChange={() =>
                                        onMetadataChange({
                                            ...metadata,
                                            paidPromotion: false,
                                        })
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm">
                                    {t("step4.paidPromotionNo")}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="paidPromotion"
                                    checked={metadata.paidPromotion}
                                    onChange={() =>
                                        onMetadataChange({
                                            ...metadata,
                                            paidPromotion: true,
                                        })
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm">
                                    {t("step4.paidPromotionYes")}
                                </span>
                            </label>
                        </div>
                        <p className="text-xs text-gray-400">
                            {t("step4.paidPromotionHint")}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Monetization */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {t("step4.monetization")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <Label>{t("step4.monetizationTitle")}</Label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="monetization"
                                    checked={metadata.monetization}
                                    onChange={() =>
                                        onMetadataChange({
                                            ...metadata,
                                            monetization: true,
                                        })
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm">
                                    {t("step4.monetizationYes")}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="monetization"
                                    checked={!metadata.monetization}
                                    onChange={() =>
                                        onMetadataChange({
                                            ...metadata,
                                            monetization: false,
                                        })
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm">
                                    {t("step4.monetizationNo")}
                                </span>
                            </label>
                        </div>
                        <p className="text-xs text-gray-400">
                            {t("step4.monetizationHint")}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Content Guidelines */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {t("step4.guidelines")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-xs text-gray-400">
                        {t("step4.guidelinesHint")}
                    </p>
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 rounded border p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                            <input
                                type="radio"
                                name="restrictions"
                                checked={
                                    metadata.contentRestrictions === "none"
                                }
                                onChange={() =>
                                    onMetadataChange({
                                        ...metadata,
                                        contentRestrictions: "none",
                                    })
                                }
                                className="h-4 w-4"
                            />
                            <span className="text-sm">{t("step4.none")}</span>
                        </label>
                        <label className="flex items-center gap-3 rounded border p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                            <input
                                type="radio"
                                name="restrictions"
                                checked={
                                    metadata.contentRestrictions ===
                                    "restricted"
                                }
                                onChange={() =>
                                    onMetadataChange({
                                        ...metadata,
                                        contentRestrictions: "restricted",
                                    })
                                }
                                className="h-4 w-4"
                            />
                            <span className="text-sm">
                                {t("step4.restricted")}
                            </span>
                        </label>
                        <label className="flex items-center gap-3 rounded border p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                            <input
                                type="radio"
                                name="restrictions"
                                checked={
                                    metadata.contentRestrictions ===
                                    "educational"
                                }
                                onChange={() =>
                                    onMetadataChange({
                                        ...metadata,
                                        contentRestrictions: "educational",
                                    })
                                }
                                className="h-4 w-4"
                            />
                            <span className="text-sm">
                                {t("step4.educational")}
                            </span>
                        </label>
                    </div>
                </CardContent>
            </Card>

            {/* Cards and End Screens */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {t("step4.cards")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xs text-gray-400">
                        {t("step4.cardsHint")}
                    </p>
                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="video-link-start">
                                {t("step4.addVideoStart")}
                            </Label>
                            <Input
                                id="video-link-start"
                                value={metadata.linkedVideoStart}
                                onChange={e =>
                                    onMetadataChange({
                                        ...metadata,
                                        linkedVideoStart: e.target.value,
                                    })
                                }
                                placeholder={t("step4.videoUrlPlaceholder")}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="video-link-end">
                                {t("step4.addVideoEnd")}
                            </Label>
                            <Input
                                id="video-link-end"
                                value={metadata.linkedVideoEnd}
                                onChange={e =>
                                    onMetadataChange({
                                        ...metadata,
                                        linkedVideoEnd: e.target.value,
                                    })
                                }
                                placeholder={t("step4.videoUrlPlaceholder")}
                                className="mt-1"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Privacy and Scheduling */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {t("step4.privacy")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Privacy Status */}
                    <div className="space-y-2">
                        <Label>{t("step4.privacyStatus")}</Label>
                        <Select
                            value={metadata.privacyStatus}
                            onValueChange={(
                                v: "public" | "unlisted" | "private"
                            ) =>
                                onMetadataChange({
                                    ...metadata,
                                    privacyStatus: v,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="public">
                                    {t("step4.public")}
                                </SelectItem>
                                <SelectItem value="unlisted">
                                    {t("step4.unlisted")}
                                </SelectItem>
                                <SelectItem value="private">
                                    {t("step4.private")}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Schedule type */}
                    {allowSchedule && (
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
                                    <span className="text-sm">
                                        {t("step4.scheduleNow")}
                                    </span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="scheduleType"
                                        checked={scheduleType === "later"}
                                        onChange={() =>
                                            setScheduleType("later")
                                        }
                                        className="h-4 w-4"
                                    />
                                    <span className="text-sm">
                                        {t("step4.scheduleLater")}
                                    </span>
                                </label>
                            </div>

                            {scheduleType === "later" && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="schedule-date">
                                            {t("step4.scheduleDate")}
                                        </Label>
                                        <Input
                                            id="schedule-date"
                                            type="date"
                                            value={
                                                metadata.scheduledDate
                                                    ? metadata.scheduledDate
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
                                                              (metadata.scheduledTime ||
                                                                  "10:00")
                                                      )
                                                    : null
                                                onMetadataChange({
                                                    ...metadata,
                                                    scheduledDate: d,
                                                })
                                            }}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="schedule-time">
                                            {t("step4.scheduleTime")}
                                        </Label>
                                        <Input
                                            id="schedule-time"
                                            type="time"
                                            value={metadata.scheduledTime}
                                            onChange={e =>
                                                onMetadataChange({
                                                    ...metadata,
                                                    scheduledTime:
                                                        e.target.value,
                                                })
                                            }
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            )}

                            {scheduleType === "later" && (
                                <div className="rounded bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                    {t("step4.scheduleWarning")}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between border-t pt-4 dark:border-gray-700">
                <Button onClick={onBack} variant="outline">
                    {t("wizard.back")}
                </Button>
                <Button onClick={handleNext}>{t("wizard.next")}</Button>
            </div>
        </div>
    )
}
