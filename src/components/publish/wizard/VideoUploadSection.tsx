"use client"

import { useCallback, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileVideo, AlertCircle, X } from "lucide-react"

function formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
    }
    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(0)}MB`
    }
    return `${(bytes / 1024).toFixed(0)}KB`
}

interface VideoUploadSectionProps {
    videoFile: File | null
    onVideoFileChange: (file: File | null) => void
    error: string | undefined
}

export default function VideoUploadSection({
    videoFile,
    onVideoFileChange,
    error,
}: VideoUploadSectionProps) {
    const t = useTranslations("publish")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [dragOver, setDragOver] = useState(false)

    const handleVideoDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files?.[0]
            if (file && file.type.startsWith("video/")) {
                onVideoFileChange(file)
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
            }
        },
        [onVideoFileChange]
    )

    return (
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
                {error && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{error}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export { formatBytes }
