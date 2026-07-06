"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from "next-intl"
import {
    SiYoutube,
    SiFacebook,
    SiInstagram,
    SiTiktok,
    SiX,
} from "@icons-pack/react-simple-icons"
import { AlertCircle, X, FileImage } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import type { PublishWizardState, YouTubeMetadata } from "./types"
import { DEFAULT_YOUTUBE_METADATA } from "./types"
import TagInput from "./TagInput"

interface ContentFormStepProps {
    state: PublishWizardState
    onStateChange: (state: PublishWizardState) => void
    onBack: () => void
    onNext: () => void
}

type StepError = Record<string, string>

/** Map platform ID to icon + color for field badges */
const PLATFORM_ICONS: Record<
    string,
    { Icon: React.ComponentType<{ className?: string }>; color: string }
> = {
    youtube: { Icon: SiYoutube, color: "text-red-600" },
    facebook: { Icon: SiFacebook, color: "text-blue-600" },
    instagram: { Icon: SiInstagram, color: "text-pink-600" },
    tiktok: { Icon: SiTiktok, color: "text-gray-900 dark:text-gray-100" },
    twitter: { Icon: SiX, color: "text-gray-700 dark:text-gray-300" },
}

/**
 * Define which platforms each field is compatible with.
 * Fields only show if at least one compatible platform is selected.
 */
const FIELD_PLATFORMS: Record<string, string[]> = {
    title: ["youtube"],
    description: ["youtube", "facebook", "instagram"],
    tags: ["youtube"],
    thumbnail: ["youtube"],
    text: ["facebook", "instagram"],
    images: ["facebook", "instagram"],
}

/** Platform badge row — shows icons for each compatible platform */
function PlatformBadges({ platforms }: { platforms: string[] }) {
    return (
        <span className="ml-2 inline-flex items-center gap-1">
            {platforms.map(pid => {
                const entry = PLATFORM_ICONS[pid]
                if (!entry) return null
                return (
                    <entry.Icon
                        key={pid}
                        className={`h-3.5 w-3.5 ${entry.color}`}
                    />
                )
            })}
        </span>
    )
}

export default function ContentFormStep({
    state,
    onStateChange,
    onBack,
    onNext,
}: ContentFormStepProps) {
    const t = useTranslations("publish")
    const imageInputRef = useRef<HTMLInputElement>(null)
    const thumbnailInputRef = useRef<HTMLInputElement>(null)
    const [thumbnailDragOver, setThumbnailDragOver] = useState(false)
    const [errors, setErrors] = useState<StepError>({})

    const isVideo = state.contentType === "video"
    const isPost = state.contentType === "post"

    const selectedPlatformIds = state.platformSelections.map(s => s.platformId)
    const hasYouTube = selectedPlatformIds.includes("youtube")

    /** Get visible fields for current content type, filtered by selected platforms */
    const visibleFields = (
        isVideo
            ? ["title", "description", "tags", "thumbnail"]
            : ["text", "images"]
    ).filter(fieldId => {
        const compatible = FIELD_PLATFORMS[fieldId] || []
        return compatible.some(p => selectedPlatformIds.includes(p))
    })

    // YouTube metadata helper
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

    // Validation
    const validate = (): boolean => {
        const errs: StepError = {}

        // Post content type: needs at least text or images
        if (
            isPost &&
            !state.content.text.trim() &&
            state.content.images.length === 0
        ) {
            errs.text = t("step4.textRequired")
        }

        // YouTube fields
        if (hasYouTube) {
            if (!youtubeMeta.title.trim()) {
                errs.youtube_title = t("step4.titleRequired")
            }
            if (youtubeMeta.title.length > 100) {
                errs.youtube_title = t("step4.titleMax")
            }
            if (youtubeMeta.description.length > 5000) {
                errs.youtube_description = t("step4.descriptionMax")
            }
            const tagsTotalChars = youtubeMeta.tags.join(",").length
            if (tagsTotalChars > 500) {
                errs.youtube_tags = t("step4.tagsMax")
            }
        }

        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleNext = () => {
        if (validate()) onNext()
    }

    // Thumbnail file handlers
    const handleThumbnailDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setThumbnailDragOver(false)
            const file = e.dataTransfer.files?.[0]
            if (file && file.type.startsWith("image/")) {
                onStateChange({
                    ...state,
                    content: { ...state.content, thumbnailFile: file },
                })
            }
        },
        [state, onStateChange]
    )

    const handleThumbnailChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file && file.type.startsWith("image/")) {
                onStateChange({
                    ...state,
                    content: { ...state.content, thumbnailFile: file },
                })
            }
        },
        [state, onStateChange]
    )

    // Image upload handlers
    const handleImageUpload = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || [])
            if (files.length > 0) {
                onStateChange({
                    ...state,
                    content: {
                        ...state.content,
                        images: [...state.content.images, ...files],
                    },
                })
            }
        },
        [state, onStateChange]
    )

    const removeImage = (index: number) => {
        const newImages = state.content.images.filter((_, i) => i !== index)
        onStateChange({
            ...state,
            content: { ...state.content, images: newImages },
        })
    }

    // Tags handler
    const handleTagsChange = (tags: string[]) => {
        setYouTubeMeta({ tags })
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">{t("step4.title")}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("step4.description")}
                </p>
            </div>

            {/* ── INDIVIDUAL FIELDS WITH PLATFORM BADGES ── */}
            <div className="space-y-6">
                {/* Post: Text + Images */}
                {visibleFields.includes("text") && (
                    <div className="space-y-2">
                        <Label htmlFor="universal-text">
                            {t("step4.text")}
                            <PlatformBadges platforms={FIELD_PLATFORMS.text} />
                            {isPost && !state.content.images.length && (
                                <span className="ml-2 text-xs text-red-500">
                                    *
                                </span>
                            )}
                        </Label>
                        <Textarea
                            id="universal-text"
                            value={state.content.text}
                            onChange={e =>
                                onStateChange({
                                    ...state,
                                    content: {
                                        ...state.content,
                                        text: e.target.value,
                                    },
                                })
                            }
                            placeholder={t("step4.textPostPlaceholder")}
                            className="min-h-20 resize-none"
                        />
                        {errors.text && (
                            <p className="flex items-center gap-1 text-xs text-red-500">
                                <AlertCircle className="h-3 w-3" />
                                {errors.text}
                            </p>
                        )}
                    </div>
                )}

                {visibleFields.includes("images") && (
                    <div className="space-y-2">
                        <Label>
                            {t("step4.images")}
                            <PlatformBadges
                                platforms={FIELD_PLATFORMS.images}
                            />
                        </Label>
                        <Input
                            type="file"
                            multiple
                            accept="image/*"
                            ref={imageInputRef}
                            onChange={handleImageUpload}
                            className="cursor-pointer"
                        />
                        {state.content.images.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {state.content.images.map((img, idx) => (
                                    <div key={idx} className="relative">
                                        <img
                                            src={URL.createObjectURL(img)}
                                            alt={`Upload ${idx + 1}`}
                                            className="h-16 w-full rounded object-cover"
                                        />
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Video: Title */}
                {visibleFields.includes("title") && (
                    <div className="space-y-2">
                        <Label htmlFor="yt-title">
                            {t("step4.title")}
                            <PlatformBadges platforms={FIELD_PLATFORMS.title} />
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="yt-title"
                            value={youtubeMeta.title}
                            onChange={e =>
                                setYouTubeMeta({
                                    title: e.target.value.slice(0, 100),
                                })
                            }
                            placeholder={t("step4.titlePlaceholder")}
                            maxLength={100}
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>
                                {youtubeMeta.title.length}/100{" "}
                                {t("step4.titleMax")}
                            </span>
                            {errors.youtube_title && (
                                <span className="text-red-500">
                                    {errors.youtube_title}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Video: Description */}
                {visibleFields.includes("description") && (
                    <div className="space-y-2">
                        <Label htmlFor="yt-description">
                            {t("step4.description")}
                            <PlatformBadges
                                platforms={FIELD_PLATFORMS.description}
                            />
                        </Label>
                        <Textarea
                            id="yt-description"
                            value={youtubeMeta.description}
                            onChange={e =>
                                setYouTubeMeta({
                                    description: e.target.value.slice(0, 5000),
                                })
                            }
                            placeholder={t("step4.descriptionPlaceholder")}
                            className="min-h-20 resize-none"
                            maxLength={5000}
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>
                                {youtubeMeta.description.length}
                                /5000 {t("step4.descriptionMax")}
                            </span>
                            {errors.youtube_description && (
                                <span className="text-red-500">
                                    {errors.youtube_description}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Video: Tags */}
                {visibleFields.includes("tags") && (
                    <div className="space-y-2">
                        <Label htmlFor="yt-tags">
                            {t("step4.tags")}
                            <PlatformBadges platforms={FIELD_PLATFORMS.tags} />
                        </Label>
                        <TagInput
                            tags={youtubeMeta.tags}
                            onChange={handleTagsChange}
                            placeholder={t("step4.tagsPlaceholder")}
                            maxChars={500}
                        />
                        {errors.youtube_tags && (
                            <p className="flex items-center gap-1 text-xs text-red-500">
                                <AlertCircle className="h-3 w-3" />
                                {errors.youtube_tags}
                            </p>
                        )}
                    </div>
                )}

                {/* Video: Thumbnail */}
                {visibleFields.includes("thumbnail") && (
                    <div className="space-y-2">
                        <Label>
                            {t("step4.thumbnail")}
                            <PlatformBadges
                                platforms={FIELD_PLATFORMS.thumbnail}
                            />
                        </Label>
                        {!state.content.thumbnailFile ? (
                            <div
                                onDragOver={e => {
                                    e.preventDefault()
                                    setThumbnailDragOver(true)
                                }}
                                onDragLeave={() => setThumbnailDragOver(false)}
                                onDrop={handleThumbnailDrop}
                                onClick={() =>
                                    thumbnailInputRef.current?.click()
                                }
                                className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors ${
                                    thumbnailDragOver
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                        : "border-gray-300 hover:border-gray-400 dark:border-gray-600"
                                }`}
                            >
                                <FileImage className="h-6 w-6 text-gray-400" />
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {t("step4.thumbnailHint")}
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={e => {
                                        e.stopPropagation()
                                        thumbnailInputRef.current?.click()
                                    }}
                                >
                                    {t("step4.browseImage")}
                                </Button>
                            </div>
                        ) : (
                            <div className="relative">
                                <img
                                    src={URL.createObjectURL(
                                        state.content.thumbnailFile
                                    )}
                                    alt="Thumbnail preview"
                                    className="h-32 w-full rounded-lg object-cover"
                                />
                                <button
                                    onClick={() =>
                                        onStateChange({
                                            ...state,
                                            content: {
                                                ...state.content,
                                                thumbnailFile: null,
                                            },
                                        })
                                    }
                                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        <input
                            ref={thumbnailInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleThumbnailChange}
                        />
                    </div>
                )}

                {/* No visible fields warning */}
                {visibleFields.length === 0 && (
                    <p className="py-8 text-center text-sm text-gray-500">
                        {t("step4.noCompatibleFields")}
                    </p>
                )}
            </div>

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
