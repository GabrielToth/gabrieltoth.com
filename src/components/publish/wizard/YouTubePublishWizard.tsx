"use client"

import { useCallback, useState } from "react"
import { useTranslations } from "next-intl"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { X } from "lucide-react"
import NetworkSelectStep from "./NetworkSelectStep"
import YouTubeChannelsStep from "./YouTubeChannelsStep"
import StorageModeStep from "./StorageModeStep"
import YouTubeMetadataForm from "./YouTubeMetadataForm"
import ProcessingStep from "./ProcessingStep"
import type {
    YouTubeMetadata,
    YouTubePublishData,
    ProcessingState,
} from "./types"
import { DEFAULT_METADATA } from "./types"

interface YouTubePublishWizardProps {
    onClose: () => void
    defaultDate?: Date
}

type WizardStep = 1 | 2 | 3 | 4 | 5

export default function YouTubePublishWizard({
    onClose,
}: YouTubePublishWizardProps) {
    const t = useTranslations("publish")

    // Wizard state
    const [currentStep, setCurrentStep] = useState<WizardStep>(1)
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(
        null
    )
    const [channelIds, setChannelIds] = useState<string[]>([])
    const [storageMode] = useState<"local">("local")
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [metadata, setMetadata] = useState<YouTubeMetadata>(DEFAULT_METADATA)
    const [processing, setProcessing] = useState<ProcessingState>({
        status: "idle",
    })

    const handleNetworkSelect = (platform: string) => {
        setSelectedPlatform(platform)
        setCurrentStep(2)
    }

    const handleChannelsChange = (ids: string[]) => {
        setChannelIds(ids)
    }

    const handlePublish = useCallback(async () => {
        if (!videoFile) return

        setProcessing({ status: "uploading", progress: 0, speed: "0 KB/s" })

        try {
            // Build form data for upload
            const formData = new FormData()
            formData.append("video", videoFile)
            formData.append("description", metadata.description)
            formData.append("title", metadata.title)
            formData.append("privacyStatus", metadata.privacyStatus)
            formData.append("tags", metadata.tags.join(","))
            formData.append(
                "madeForKids",
                metadata.madeForKids ? "true" : "false"
            )
            formData.append(
                "aiGenerated",
                metadata.aiGenerated ? "true" : "false"
            )
            formData.append(
                "paidPromotion",
                metadata.paidPromotion ? "true" : "false"
            )
            formData.append(
                "monetization",
                metadata.monetization ? "true" : "false"
            )
            formData.append("contentRestrictions", metadata.contentRestrictions)

            // Simulate upload progress
            setProcessing({
                status: "uploading",
                progress: 30,
                speed: "2.5 MB/s",
            })

            // Send to YouTube publish endpoint
            const res = await fetch("/api/platform/youtube/publish", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(
                    data.message || data.error || "Failed to publish"
                )
            }

            setProcessing({
                status: "uploading",
                progress: 80,
                speed: "5 MB/s",
            })
            setProcessing({ status: "metadata" })

            // Short delay for metadata processing
            await new Promise(r => setTimeout(r, 500))

            setProcessing({ status: "publishing" })
            await new Promise(r => setTimeout(r, 500))

            const result = await res.json()

            setProcessing({
                status: "complete",
                videoId: result.videoId || "",
                url:
                    result.url ||
                    `https://youtube.com/watch?v=${result.videoId}`,
            })
        } catch (err) {
            setProcessing({
                status: "error",
                message:
                    err instanceof Error
                        ? err.message
                        : "Unknown error occurred",
            })
        }
    }, [videoFile, metadata])

    const handleStartPublish = () => {
        setCurrentStep(5)
        handlePublish()
    }

    const handleRetry = () => {
        setProcessing({ status: "idle" })
        setCurrentStep(4)
    }

    // Get step progress for header
    const totalSteps = 5
    const stepTitles = [
        t("step1.title"),
        t("step2.title"),
        t("step3.title"),
        t("step4.title"),
        t("step5.title"),
    ]

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <NetworkSelectStep onSelect={handleNetworkSelect} />
            case 2:
                return (
                    <YouTubeChannelsStep
                        selectedChannelIds={channelIds}
                        onChannelsChange={handleChannelsChange}
                        onBack={() => setCurrentStep(1)}
                        onNext={() => setCurrentStep(3)}
                    />
                )
            case 3:
                return (
                    <StorageModeStep
                        selectedMode={storageMode}
                        onBack={() => setCurrentStep(2)}
                        onNext={() => setCurrentStep(4)}
                    />
                )
            case 4:
                return (
                    <YouTubeMetadataForm
                        metadata={metadata}
                        onMetadataChange={setMetadata}
                        videoFile={videoFile}
                        onVideoFileChange={setVideoFile}
                        onBack={() => setCurrentStep(3)}
                        onNext={handleStartPublish}
                    />
                )
            case 5:
                return (
                    <ProcessingStep
                        processing={processing}
                        onRetry={handleRetry}
                        onClose={onClose}
                        onGoToDashboard={onClose}
                    />
                )
            default:
                return null
        }
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span>{t("wizard.title")}</span>
                        {currentStep <= totalSteps && (
                            <span className="text-sm font-normal text-gray-500">
                                {t("wizard.step", {
                                    current: currentStep,
                                    total: totalSteps,
                                })}
                            </span>
                        )}
                    </DialogTitle>
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </DialogHeader>

                {/* Step progress indicator */}
                {currentStep <= 4 && (
                    <div className="flex items-center gap-1 px-1">
                        {[1, 2, 3, 4].map(step => (
                            <div key={step} className="flex-1">
                                <div
                                    className={`h-1.5 rounded-full transition-colors ${
                                        step <= currentStep
                                            ? "bg-blue-500"
                                            : "bg-gray-200 dark:bg-gray-700"
                                    }`}
                                />
                                <p
                                    className={`mt-1 text-xs ${
                                        step === currentStep
                                            ? "font-medium text-blue-600 dark:text-blue-400"
                                            : "text-gray-400"
                                    }`}
                                >
                                    {stepTitles[step - 1]}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-4">{renderStep()}</div>
            </DialogContent>
        </Dialog>
    )
}
