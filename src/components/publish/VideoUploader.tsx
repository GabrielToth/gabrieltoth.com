"use client"

import { Upload, FileVideo, AlertCircle } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "next-intl"

export interface VideoUploaderProps {
    onFileSelect: (file: File) => void
    acceptedMimeTypes?: string[]
    maxSizeBytes?: number
    disabled?: boolean
    selectedPlatforms?: string[]
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

export default function VideoUploader({
    onFileSelect,
    acceptedMimeTypes = ["video/mp4", "video/webm", "video/quicktime"],
    maxSizeBytes = 500 * 1024 * 1024,
    disabled = false,
    selectedPlatforms,
}: VideoUploaderProps) {
    const t = useTranslations("publish")
    const inputRef = useRef<HTMLInputElement>(null)
    const [dragOver, setDragOver] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const validateAndSelect = useCallback(
        (file: File) => {
            setError(null)

            if (
                acceptedMimeTypes.length > 0 &&
                !acceptedMimeTypes.includes(file.type) &&
                !file.type.startsWith("video/")
            ) {
                setError(t("videoUploader.unsupportedType"))
                return
            }

            if (file.size > maxSizeBytes) {
                setError(
                    t("videoUploader.fileTooLarge", {
                        platform: selectedPlatforms?.[0] || "",
                        limit: formatBytes(maxSizeBytes),
                    })
                )
                return
            }

            onFileSelect(file)
        },
        [acceptedMimeTypes, maxSizeBytes, onFileSelect, selectedPlatforms, t]
    )

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files?.[0]
            if (file) validateAndSelect(file)
        },
        [validateAndSelect]
    )

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) validateAndSelect(file)
        },
        [validateAndSelect]
    )

    if (!selectedPlatforms || selectedPlatforms.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-4 py-8 text-center text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <p className="text-sm">
                        {t("videoUploader.selectPlatformFirst")}
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <FileVideo className="h-5 w-5" />
                    {t("videoUploader.title")}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div
                    onDragOver={e => {
                        e.preventDefault()
                        if (!disabled) setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={disabled ? undefined : handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors ${
                        dragOver
                            ? "border-primary bg-primary/5"
                            : "border-input hover:border-border"
                    } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                >
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        {t("videoUploader.dropzone")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {t("videoUploader.maxSize", {
                            size: formatBytes(maxSizeBytes),
                        })}
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={e => {
                            e.stopPropagation()
                            inputRef.current?.click()
                        }}
                    >
                        {t("videoUploader.browse")}
                    </Button>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept={acceptedMimeTypes.join(",")}
                    className="hidden"
                    onChange={disabled ? undefined : handleChange}
                    disabled={disabled}
                />

                {error && (
                    <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
