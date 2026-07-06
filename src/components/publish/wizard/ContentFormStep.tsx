"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { SiYoutube } from "@icons-pack/react-simple-icons"
import {
    Upload,
    FileVideo,
    Image,
    AlertCircle,
    X,
    FileImage,
} from "lucide-react"
import { useCallback, useRef, useState } from "react"
import type { PublishWizardState, YouTubeMetadata } from "./types"
import {
    DEFAULT_YOUTUBE_METADATA,
    PLATFORM_VIDEO_LIMITS,
    getCompatibleVideoLimit,
    getPlatformsExceedingLimit,
} from "./types"
import TagInput from "./TagInput"

interface ContentFormStepProps {
    state: PublishWizardState
    onStateChange: (state: PublishWizardState) => void
    onBack: () => void
    onNext: () => void
}

type StepError = Record<string, string>

/** Map platform id to its display name key */
const PLATFORM_LABEL_KEYS: Record<string, string> = {
    youtube: "YouTube",
    facebook: "Facebook",
    instagram: "Instagram",
    twitter: "Twitter",
    linkedin: "LinkedIn",
}

/** Map platform id to its icon component */
const PLATFORM_ICONS: Record<string, React.ReactNode> = {
    youtube: <SiYoutube className="h-4 w-4 text-red-600" />,
}

function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)}MB`
    return `${(bytes / 1024).toFixed(0)}KB`
}

export default function ContentFormStep({
    state,
    onStateChange,
    onBack,
    onNext,
}: ContentFormStepProps) {
    const t = useTranslations("publish")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const thumbnailInputRef = useRef<HTMLInputElement>(null)
    const [dragOver, setDragOver] = useState(false)
    const [thumbnailDragOver, setThumbnailDragOver] = useState(false)
    const [errors, setErrors] = useState<StepError>({})

    const isVideo = state.contentType === "video"
    const isPost = state.contentType === "post"

    // Determine which platforms are selected
    const selectedPlatformIds = state.platformSelections.map(s => s.platformId)
    const hasYouTube = selectedPlatformIds.includes("youtube")

    // Video size limit: lowest among selected platforms
    const compatibleLimit = getCompatibleVideoLimit(selectedPlatformIds)
    const videoFile = state.content.videoFile
    const exceedingPlatforms = videoFile
        ? getPlatformsExceedingLimit(selectedPlatformIds, videoFile.size)
        : []

    // YouTube metadata helper
    const youtubeMeta =
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

        // Video content type: required video file + size check
        if (isVideo && !state.content.videoFile) {
            errs.videoFile = t("step4.fileRequired")
        }
        if (
            isVideo &&
            state.content.videoFile &&
            compatibleLimit > 0 &&
            state.content.videoFile.size > compatibleLimit
        ) {
            errs.videoFile = t("step4.fileTooLargeForPlatforms", {
                limit: formatBytes(compatibleLimit),
            })
        }

        // Post content type: needs at least text or images
        if (
            isPost &&
            !state.content.text.trim() &&
            state.content.images.length === 0
        ) {
            errs.text = t("step4.textRequired")
        }

        // YouTube: title required when YouTube is selected
        if (hasYouTube && !youtubeMeta.title.trim()) {
            errs.youtube_title = t("step4.titleRequired")
        }
        if (hasYouTube && youtubeMeta.title.length > 100) {
            errs.youtube_title = t("step4.titleMax")
        }
        if (hasYouTube && youtubeMeta.description.length > 5000) {
            errs.youtube_description = t("step4.descriptionMax")
        }
        // Tags limit: 500 chars total (YouTube's limit, not 30 tags)
        if (hasYouTube) {
            const tagsTotalChars = youtubeMeta.tags.join(",").length
            if (tagsTotalChars > 500) {
                errs.youtube_tags = t("step4.tagsMax")
            }
        }

        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleNext = () => {
        if (validate()) {
            onNext()
        }
    }

    // Video file handlers
    const handleVideoDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files?.[0]
            if (file && file.type.startsWith("video/")) {
                onStateChange({
                    ...state,
                    content: { ...state.content, videoFile: file },
                })
                setErrors(prev => {
                    const next = { ...prev }
                    delete next.videoFile
                    return next
                })
            }
        },
        [state, onStateChange]
    )

    const handleVideoChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file && file.type.startsWith("video/")) {
                onStateChange({
                    ...state,
                    content: { ...state.content, videoFile: file },
                })
                setErrors(prev => {
                    const next = { ...prev }
                    delete next.videoFile
                    return next
                })
            }
        },
        [state, onStateChange]
    )

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

            {/* ── UNIVERSAL SECTION ── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        {isVideo ? (
                            <FileVideo className="h-5 w-5" />
                        ) : (
                            <Image className="h-5 w-5" />
                        )}
                        {isVideo
                            ? t("step4.contentVideo")
                            : t("step4.contentPost")}
                        <Badge variant="outline" className="ml-auto text-xs">
                            {t("step4.allPlatforms")}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Text — always shown */}
                    <div className="space-y-2">
                        <Label htmlFor="universal-text">
                            {t("step4.text")}
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
                            placeholder={
                                isVideo
                                    ? t("step4.textVideoPlaceholder")
                                    : t("step4.textPostPlaceholder")
                            }
                            className="min-h-20 resize-none"
                        />
                        {errors.text && (
                            <p className="flex items-center gap-1 text-xs text-red-500">
                                <AlertCircle className="h-3 w-3" />
                                {errors.text}
                            </p>
                        )}
                    </div>

                    {/* Images — only for Post content type */}
                    {isPost && (
                        <div className="space-y-2">
                            <Label>{t("step4.images")}</Label>
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

                    {/* Video file — only for Video content type */}
                    {isVideo && (
                        <div className="space-y-2">
                            <Label>
                                {t("step4.videoFile")}
                                <span className="ml-2 text-xs text-red-500">
                                    *
                                </span>
                            </Label>
                            {!state.content.videoFile ? (
                                <div
                                    onDragOver={e => {
                                        e.preventDefault()
                                        setDragOver(true)
                                    }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleVideoDrop}
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors ${
                                        dragOver
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                            : "border-gray-300 hover:border-gray-400 dark:border-gray-600"
                                    }`}
                                >
                                    <Upload className="h-8 w-8 text-gray-400" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {t("step4.dropzone")}
                                    </p>
                                    {compatibleLimit > 0 && (
                                        <p className="text-xs text-gray-400">
                                            {t("step4.maxSizeDynamic", {
                                                limit: formatBytes(
                                                    compatibleLimit
                                                ),
                                            })}
                                        </p>
                                    )}
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
                                <div className="flex items-center gap-4 rounded-lg border bg-gray-50 p-3 dark:bg-gray-900">
                                    <FileVideo className="h-6 w-6 text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {state.content.videoFile.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatBytes(
                                                state.content.videoFile.size
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            onStateChange({
                                                ...state,
                                                content: {
                                                    ...state.content,
                                                    videoFile: null,
                                                },
                                            })
                                        }
                                        className="rounded-full p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}

                            {/* Platform incompatibility warnings */}
                            {exceedingPlatforms.length > 0 && (
                                <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                                    <p className="flex items-center gap-1 text-xs font-medium text-amber-800 dark:text-amber-300">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        {t("step4.incompatiblePlatforms")}
                                    </p>
                                    <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-700 dark:text-amber-400">
                                        {exceedingPlatforms.map(p => (
                                            <li key={p.id}>
                                                {t("step4.platformExceeded", {
                                                    platform:
                                                        PLATFORM_LABEL_KEYS[
                                                            p.id
                                                        ] ??
                                                        p.id
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            p.id.slice(1),
                                                    limit: formatBytes(p.limit),
                                                })}
                                            </li>
                                        ))}
                                    </ul>
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
                                <p className="flex items-center gap-1 text-xs text-red-500">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.videoFile}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Thumbnail — only for Video content type */}
                    {isVideo && (
                        <div className="space-y-2">
                            <Label>{t("step4.thumbnail")}</Label>
                            {!state.content.thumbnailFile ? (
                                <div
                                    onDragOver={e => {
                                        e.preventDefault()
                                        setThumbnailDragOver(true)
                                    }}
                                    onDragLeave={() =>
                                        setThumbnailDragOver(false)
                                    }
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
                </CardContent>
            </Card>

            {/* ── PLATFORM-SPECIFIC SECTIONS ── */}

            {/* YouTube Metadata */}
            {hasYouTube && (
                <>
                    {/* Basic Info: Title, Description, Tags */}
                    <Card className="border-l-4 border-l-red-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <SiYoutube className="h-5 w-5 text-red-600" />
                                {t("step4.basicInfo")}
                                <Badge
                                    variant="secondary"
                                    className="ml-auto text-xs"
                                >
                                    <SiYoutube className="mr-1 h-3 w-3" />
                                    YouTube
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="yt-title">
                                    {t("step4.title")}
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

                            <div className="space-y-2">
                                <Label htmlFor="yt-description">
                                    {t("step4.description")}
                                </Label>
                                <Textarea
                                    id="yt-description"
                                    value={youtubeMeta.description}
                                    onChange={e =>
                                        setYouTubeMeta({
                                            description: e.target.value.slice(
                                                0,
                                                5000
                                            ),
                                        })
                                    }
                                    placeholder={t(
                                        "step4.descriptionPlaceholder"
                                    )}
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

                            {/* Tags — YouTube-style input */}
                            <div className="space-y-2">
                                <Label htmlFor="yt-tags">
                                    {t("step4.tags")}
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
                        </CardContent>
                    </Card>

                    {/* Future: Facebook-specific section */}
                    {/* Future: Instagram-specific section */}
                    {/* Future: Twitter-specific section */}
                    {/* Future: LinkedIn-specific section */}
                </>
            )}

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
