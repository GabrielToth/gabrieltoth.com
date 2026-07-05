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
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { SiYoutube } from "@icons-pack/react-simple-icons"
import { Upload, FileVideo, Image, AlertCircle, X } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import type {
    PublishWizardState,
    YouTubeMetadata,
    PlatformSelection,
} from "./types"
import { DEFAULT_YOUTUBE_METADATA, PLATFORM_EXCLUSIVE_FEATURES } from "./types"

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
    const [dragOver, setDragOver] = useState(false)
    const [errors, setErrors] = useState<StepError>({})

    // Determine which platforms are selected
    const selectedPlatformIds = state.platformSelections.map(s => s.platformId)
    const hasYouTube = selectedPlatformIds.includes("youtube")

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

        // Universal: video required if any video-capable platform selected
        if (hasYouTube && !state.content.videoFile) {
            errs.videoFile = t("step4.fileRequired")
        }

        // YouTube: title required
        if (hasYouTube && !youtubeMeta.title.trim()) {
            errs.youtube_title = t("step4.titleRequired")
        }
        if (hasYouTube && youtubeMeta.title.length > 100) {
            errs.youtube_title = t("step4.titleMax")
        }
        if (hasYouTube && youtubeMeta.description.length > 5000) {
            errs.youtube_description = t("step4.descriptionMax")
        }
        if (hasYouTube && youtubeMeta.tags.length > 30) {
            errs.youtube_tags = t("step4.tagsMax")
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
        setYouTubeMeta({ tags: limited })
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">{t("step4.title")}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("step4.description")}
                </p>
            </div>

            {/* ── UNIVERSAL SECTION: Text Content ── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Image className="h-5 w-5" />
                        Conteúdo Universal
                        <Badge variant="outline" className="ml-auto text-xs">
                            Todas as plataformas
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Text */}
                    <div className="space-y-2">
                        <Label htmlFor="universal-text">Texto</Label>
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
                            placeholder="Escreva seu conteúdo..."
                            className="min-h-20 resize-none"
                        />
                    </div>

                    {/* Images */}
                    <div className="space-y-2">
                        <Label>Imagens</Label>
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

                    {/* Video file (universal, but required if YouTube selected) */}
                    <div className="space-y-2">
                        <Label>
                            Arquivo de Vídeo
                            {hasYouTube && (
                                <span className="ml-2 text-xs text-red-500">
                                    * obrigatório para YouTube
                                </span>
                            )}
                        </Label>
                        {!state.content.videoFile ? (
                            <div
                                onDragOver={e => {
                                    e.preventDefault()
                                    setDragOver(true)
                                }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleVideoDrop}
                                onClick={() => fileInputRef.current?.click()}
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
                                Informações Básicas
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

                            <div className="rounded bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-900">
                                {t("step4.thumbnailHint")}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="yt-tags">
                                    {t("step4.tags")}
                                </Label>
                                <Input
                                    id="yt-tags"
                                    value={youtubeMeta.tags.join(", ")}
                                    onChange={e =>
                                        handleTagsChange(e.target.value)
                                    }
                                    placeholder={t("step4.tagsPlaceholder")}
                                />
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>{t("step4.tagsHint")}</span>
                                    <span>
                                        {youtubeMeta.tags.length}/30 tags
                                    </span>
                                </div>
                                {errors.youtube_tags && (
                                    <span className="text-xs text-red-500">
                                        {errors.youtube_tags}
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Audience */}
                    <Card className="border-l-4 border-l-red-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <SiYoutube className="h-5 w-5 text-red-600" />
                                {t("step4.audience")}
                                <Badge
                                    variant="secondary"
                                    className="ml-auto text-xs"
                                >
                                    <SiYoutube className="mr-1 h-3 w-3" />
                                    YouTube
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <Label>{t("step4.madeForKids")}</Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="madeForKids"
                                            checked={!youtubeMeta.madeForKids}
                                            onChange={() =>
                                                setYouTubeMeta({
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
                                            checked={youtubeMeta.madeForKids}
                                            onChange={() =>
                                                setYouTubeMeta({
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

                    {/* Content: AI, Paid Promotion */}
                    <Card className="border-l-4 border-l-red-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <SiYoutube className="h-5 w-5 text-red-600" />
                                {t("step4.content")}
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
                            <div className="space-y-3">
                                <Label>{t("step4.aiGenerated")}</Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="aiGenerated"
                                            checked={!youtubeMeta.aiGenerated}
                                            onChange={() =>
                                                setYouTubeMeta({
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
                                            checked={youtubeMeta.aiGenerated}
                                            onChange={() =>
                                                setYouTubeMeta({
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
                            <div className="space-y-3">
                                <Label>{t("step4.paidPromotion")}</Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="paidPromotion"
                                            checked={!youtubeMeta.paidPromotion}
                                            onChange={() =>
                                                setYouTubeMeta({
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
                                            checked={youtubeMeta.paidPromotion}
                                            onChange={() =>
                                                setYouTubeMeta({
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
                    <Card className="border-l-4 border-l-red-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <SiYoutube className="h-5 w-5 text-red-600" />
                                {t("step4.monetization")}
                                <Badge
                                    variant="secondary"
                                    className="ml-auto text-xs"
                                >
                                    <SiYoutube className="mr-1 h-3 w-3" />
                                    YouTube
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <Label>{t("step4.monetizationTitle")}</Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="monetization"
                                            checked={youtubeMeta.monetization}
                                            onChange={() =>
                                                setYouTubeMeta({
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
                                            checked={!youtubeMeta.monetization}
                                            onChange={() =>
                                                setYouTubeMeta({
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
                    <Card className="border-l-4 border-l-red-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <SiYoutube className="h-5 w-5 text-red-600" />
                                {t("step4.guidelines")}
                                <Badge
                                    variant="secondary"
                                    className="ml-auto text-xs"
                                >
                                    <SiYoutube className="mr-1 h-3 w-3" />
                                    YouTube
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-xs text-gray-400">
                                {t("step4.guidelinesHint")}
                            </p>
                            <div className="space-y-2">
                                {(
                                    [
                                        "none",
                                        "restricted",
                                        "educational",
                                    ] as const
                                ).map(type => (
                                    <label
                                        key={type}
                                        className="flex items-center gap-3 rounded border p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                                    >
                                        <input
                                            type="radio"
                                            name="restrictions"
                                            checked={
                                                youtubeMeta.contentRestrictions ===
                                                type
                                            }
                                            onChange={() =>
                                                setYouTubeMeta({
                                                    contentRestrictions: type,
                                                })
                                            }
                                            className="h-4 w-4"
                                        />
                                        <span className="text-sm">
                                            {t(
                                                `step4.${type === "none" ? "none" : type}`
                                            )}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cards and End Screens */}
                    <Card className="border-l-4 border-l-red-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <SiYoutube className="h-5 w-5 text-red-600" />
                                {t("step4.cards")}
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
                            <p className="text-xs text-gray-400">
                                {t("step4.cardsHint")}
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="yt-link-start">
                                        {t("step4.addVideoStart")}
                                    </Label>
                                    <Input
                                        id="yt-link-start"
                                        value={youtubeMeta.linkedVideoStart}
                                        onChange={e =>
                                            setYouTubeMeta({
                                                linkedVideoStart:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder={t(
                                            "step4.videoUrlPlaceholder"
                                        )}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="yt-link-end">
                                        {t("step4.addVideoEnd")}
                                    </Label>
                                    <Input
                                        id="yt-link-end"
                                        value={youtubeMeta.linkedVideoEnd}
                                        onChange={e =>
                                            setYouTubeMeta({
                                                linkedVideoEnd: e.target.value,
                                            })
                                        }
                                        placeholder={t(
                                            "step4.videoUrlPlaceholder"
                                        )}
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
                                {t("step4.privacy")}
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
                                <Label>{t("step4.privacyStatus")}</Label>
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

                            <div className="space-y-3 border-t pt-3 dark:border-gray-700">
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="scheduleType"
                                            checked={!youtubeMeta.scheduledDate}
                                            onChange={() =>
                                                setYouTubeMeta({
                                                    scheduledDate: null,
                                                })
                                            }
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
                                            checked={
                                                youtubeMeta.scheduledDate !==
                                                null
                                            }
                                            onChange={() => {
                                                const tomorrow = new Date()
                                                tomorrow.setDate(
                                                    tomorrow.getDate() + 1
                                                )
                                                tomorrow.setHours(10, 0, 0, 0)
                                                setYouTubeMeta({
                                                    scheduledDate: tomorrow,
                                                    scheduledTime: "10:00",
                                                })
                                            }}
                                            className="h-4 w-4"
                                        />
                                        <span className="text-sm">
                                            {t("step4.scheduleLater")}
                                        </span>
                                    </label>
                                </div>

                                {youtubeMeta.scheduledDate && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label htmlFor="yt-schedule-date">
                                                {t("step4.scheduleDate")}
                                            </Label>
                                            <Input
                                                id="yt-schedule-date"
                                                type="date"
                                                value={
                                                    youtubeMeta.scheduledDate
                                                        .toISOString()
                                                        .split("T")[0]
                                                }
                                                onChange={e => {
                                                    const dateVal =
                                                        e.target.value
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
                                            <Label htmlFor="yt-schedule-time">
                                                {t("step4.scheduleTime")}
                                            </Label>
                                            <Input
                                                id="yt-schedule-time"
                                                type="time"
                                                value={
                                                    youtubeMeta.scheduledTime
                                                }
                                                onChange={e =>
                                                    setYouTubeMeta({
                                                        scheduledTime:
                                                            e.target.value,
                                                    })
                                                }
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                )}

                                {youtubeMeta.scheduledDate && (
                                    <div className="rounded bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                        {t("step4.scheduleWarning")}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Future: Facebook-specific section */}
            {/* Future: Instagram-specific section */}
            {/* Future: Twitter-specific section */}
            {/* Future: LinkedIn-specific section */}

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
