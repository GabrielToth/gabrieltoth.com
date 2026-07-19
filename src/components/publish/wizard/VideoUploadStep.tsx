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
            // Auto-advance: user already uploaded the video, no need to stay on this step
            onNext()
        },
        [state, onStateChange, onNext, t]
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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">
                    {t("videoUpload.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
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
                                ? "border-primary bg-primary/5 dark:bg-primary/10"
                                : "border-input hover:border-border dark:border-input"
                        }`}
                    >
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
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
                    <div className="flex items-center gap-4 rounded-lg border bg-muted p-4 dark:bg-background">
                        <FileVideo className="h-8 w-8 text-primary" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {videoFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t("videoUpload.selectedFile", {
                                    name: videoFile.name,
                                    size: formatBytes(videoFile.size),
                                })}
                            </p>
                        </div>
                        <button
                            onClick={removeFile}
                            className="rounded-full p-1.5 text-muted-foreground hover:bg-accent dark:hover:bg-accent"
                            aria-label="Remove file"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
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

            {/* Navigation — Back always shown, Next visible when video already in state */}
            <div className="flex justify-between border-t pt-4 dark:border-border">
                <Button onClick={onBack} variant="outline">
                    {t("wizard.back")}
                </Button>
                {videoFile && (
                    <Button onClick={onNext}>{t("wizard.next")}</Button>
                )}
            </div>
        </div>
    )
}
