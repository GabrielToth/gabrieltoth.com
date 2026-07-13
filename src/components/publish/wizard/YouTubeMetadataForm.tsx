"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import type { YouTubeMetadata } from "./types"
import VideoUploadSection from "./VideoUploadSection"
import BasicInfoSection from "./BasicInfoSection"
import AudienceSection from "./AudienceSection"
import ContentDisclosureSection from "./ContentDisclosureSection"
import MonetizationSection from "./MonetizationSection"
import CardsEndScreensSection from "./CardsEndScreensSection"
import PrivacyScheduleSection from "./PrivacyScheduleSection"

interface YouTubeMetadataFormProps {
    metadata: YouTubeMetadata
    onMetadataChange: (metadata: YouTubeMetadata) => void
    videoFile: File | null
    onVideoFileChange: (file: File | null) => void
    onBack: () => void
    onNext: () => void
    allowSchedule?: boolean
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
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [scheduleType, setScheduleType] = useState<"now" | "later">("now")

    const handleTagsChange = (raw: string) => {
        const tags = raw
            .split(",")
            .map(t => t.trim())
            .filter(Boolean)
            .slice(0, 30)
        let total = 0
        const limited: string[] = []
        for (const tag of tags) {
            if (total + tag.length + 1 > 500) break
            limited.push(tag)
            total += tag.length + 1
        }
        onMetadataChange({ ...metadata, tags: limited })
    }

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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">{t("step4.title")}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("step4.description")}
                </p>
            </div>

            <VideoUploadSection
                videoFile={videoFile}
                onVideoFileChange={onVideoFileChange}
                error={errors.videoFile}
            />

            <BasicInfoSection
                title={metadata.title}
                onTitleChange={title =>
                    onMetadataChange({ ...metadata, title })
                }
                description={metadata.description}
                onDescriptionChange={description =>
                    onMetadataChange({ ...metadata, description })
                }
                tags={metadata.tags}
                onTagsChange={handleTagsChange}
                errors={errors}
            />

            <AudienceSection
                madeForKids={metadata.madeForKids}
                onMadeForKidsChange={value =>
                    onMetadataChange({ ...metadata, madeForKids: value })
                }
            />

            <ContentDisclosureSection
                aiGenerated={metadata.aiGenerated}
                onAiGeneratedChange={value =>
                    onMetadataChange({ ...metadata, aiGenerated: value })
                }
                paidPromotion={metadata.paidPromotion}
                onPaidPromotionChange={value =>
                    onMetadataChange({ ...metadata, paidPromotion: value })
                }
            />

            <MonetizationSection
                monetizationEnabled={metadata.monetization}
                onMonetizationChange={value =>
                    onMetadataChange({ ...metadata, monetization: value })
                }
            />

            {/* Ad Suitability — placeholder section */}
            <CardPlaceholder
                title={t("step4.adSuitability")}
                description={t("step4.adSuitabilityQuestion")}
                hint={t("step4.adSuitabilityWhy")}
            />

            <CardsEndScreensSection
                linkedVideoStart={metadata.linkedVideoStart}
                onLinkedVideoStartChange={value =>
                    onMetadataChange({ ...metadata, linkedVideoStart: value })
                }
                linkedVideoEnd={metadata.linkedVideoEnd}
                onLinkedVideoEndChange={value =>
                    onMetadataChange({ ...metadata, linkedVideoEnd: value })
                }
            />

            <PrivacyScheduleSection
                privacyStatus={metadata.privacyStatus}
                onPrivacyStatusChange={value =>
                    onMetadataChange({ ...metadata, privacyStatus: value })
                }
                scheduleType={scheduleType}
                onScheduleTypeChange={setScheduleType}
                scheduledDate={metadata.scheduledDate}
                onScheduledDateChange={date =>
                    onMetadataChange({ ...metadata, scheduledDate: date })
                }
                scheduledTime={metadata.scheduledTime}
                onScheduledTimeChange={time =>
                    onMetadataChange({ ...metadata, scheduledTime: time })
                }
                allowSchedule={allowSchedule}
                errors={errors}
            />

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

/** Small inline component for static informational card */
function CardPlaceholder({
    title,
    description,
    hint,
}: {
    title: string
    description: string
    hint: string
}) {
    return (
        <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
                {description}
            </p>
            <p className="mt-1 text-xs text-gray-400">{hint}</p>
        </div>
    )
}

export type { YouTubeMetadataFormProps }
