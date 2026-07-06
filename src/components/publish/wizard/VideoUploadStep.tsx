"use client"

import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { Upload, FileVideo, AlertCircle, X } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import type { PublishWizardState } from "./types"

interface VideoUploadStepProps {
    state: PublishWizardState
    onStateChange: (state: PublishWizardState) => void
    onBack: () => void
    onNext: () => void
}

function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)}MB`
    return `${(bytes / 1024).toFixed(0)}KB`
}

export default function VideoUploadStep({
    state,
    onStateChange,
    onBack,
    onNext,
}: VideoUploadStepProps) {
    const t = useTranslations("publish")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [dragOver, setDragOver] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const videoFile = state.content.videoFile

    /** Extract filename without extension to auto-fill the title */
    const extractTitleFromFilename = (filename: string): string => {
        return filename.replace(/\.[^.]+$/, "")
    }

    const selectFile = useCallback(
        (file: File) => {
            if (!file.type.startsWith("video/")) {
                setErrors({ videoFile: t("videoUpload.fileRequired") })
                return
            }
            const autoFillTitle = extractTitleFromFilename(file.name)
            onStateChange({
                ...state,
                content: {
                    ...state.content,
                    videoFile: file,
                    autoFillTitle,
                },
            })
            setErrors({})
        },
        [state, onStateChange, t]
    )

    const handleVideoDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files?.[0]
            if (file) selectFile(file)
        },
        [selectFile]
    )

    const handleVideoChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) selectFile(file)
        },
        [selectFile]
    )

    const removeFile = useCallback(() => {
        onStateChange({
            ...state,
            content: {
                ...state.content,
                videoFile: null,
                autoFillTitle: "",
            },
        })
        setErrors({})
    }, [state, onStateChange])

    const validate = (): boolean => {
        if (!state.content.videoFile) {
            setErrors({ videoFile: t("videoUpload.fileRequired") })
            return false
        }
        return true
    }

    const handleNext = () => {
        if (validate()) onNext()
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">
                    {t("videoUpload.title")}
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t("videoUpload.description")}
                </p>
            </div>

            {/* Video file drop zone or selected file display */}
            <div className="space-y-2">
                {!videoFile ? (
                    <div
                        onDragOver={e => {
                            e.preventDefault()
                            setDragOver(true)
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleVideoDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
                            dragOver
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                : "border-gray-300 hover:border-gray-400 dark:border-gray-600"
                        }`}
                    >
                        <Upload className="h-10 w-10 text-gray-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t("videoUpload.dropzone")}
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
                            {t("videoUpload.browse")}
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
                        <FileVideo className="h-8 w-8 text-blue-500" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {videoFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                                {t("videoUpload.selectedFile", {
                                    name: videoFile.name,
                                    size: formatBytes(videoFile.size),
                                })}
                            </p>
                        </div>
                        <button
                            onClick={removeFile}
                            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                            aria-label="Remove file"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Auto-fill title hint */}
                {videoFile && state.content.autoFillTitle && (
                    <p className="text-sm text-gray-500 italic">
                        {t("videoUpload.autoFillTitle", {
                            title: state.content.autoFillTitle,
                        })}
                    </p>
                )}

                {/* Error message */}
                {errors.videoFile && (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {errors.videoFile}
                    </p>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoChange}
                />
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
