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
import ContentTypeSelect from "./ContentTypeSelect"
import NetworkSelectStep from "./NetworkSelectStep"
import ChannelSelectStep from "./ChannelSelectStep"
import StorageModeStep from "./StorageModeStep"
import ContentFormStep from "./ContentFormStep"
import ProcessingStep from "./ProcessingStep"
import type {
    PublishWizardState,
    PlatformSelection,
    PlatformResult,
    ContentType,
} from "./types"
import { INITIAL_STATE, DEFAULT_YOUTUBE_METADATA } from "./types"

interface YouTubePublishWizardProps {
    onClose: () => void
    defaultDate?: Date
}

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5

/** Map step index to step key for dynamic titles */
const STEP_TITLE_KEYS: Record<number, string> = {
    0: "contentType.title",
    1: "step1.title",
    2: "step2.title",
    3: "step3.title",
    4: "step4.title",
    5: "step5.title",
}

export default function YouTubePublishWizard({
    onClose,
}: YouTubePublishWizardProps) {
    const t = useTranslations("publish")

    // Wizard state
    const [currentStep, setCurrentStep] = useState<WizardStep>(0)
    const [wizardState, setWizardState] =
        useState<PublishWizardState>(INITIAL_STATE)

    // Derive selected platform IDs
    const selectedPlatformIds = wizardState.platformSelections.map(
        s => s.platformId
    )

    // Step 0: Content type selection
    const handleContentTypeChange = (type: ContentType) => {
        // Reset platforms when content type changes
        setWizardState({
            ...INITIAL_STATE,
            contentType: type,
        })
    }

    // Step 1: Network selection
    const handlePlatformsChange = (platforms: string[]) => {
        const existing = wizardState.platformSelections
        const updated: PlatformSelection[] = platforms.map(id => {
            const found = existing.find(e => e.platformId === id)
            return found || { platformId: id, channelIds: [] }
        })

        // Remove metadata for platforms that were deselected
        const removedPlatforms = existing
            .map(e => e.platformId)
            .filter(id => !platforms.includes(id))
        const metadata = { ...wizardState.platformMetadata }
        for (const id of removedPlatforms) {
            delete metadata[id]
        }

        // Add default YouTube metadata if YouTube is selected
        if (platforms.includes("youtube") && !metadata.youtube) {
            metadata.youtube = { ...DEFAULT_YOUTUBE_METADATA }
        }

        setWizardState({
            ...wizardState,
            platformSelections: updated,
            platformMetadata: metadata,
        })
    }

    // Step 2: Channel selections
    const handleSelectionsChange = (selections: PlatformSelection[]) => {
        setWizardState({
            ...wizardState,
            platformSelections: selections,
        })
    }

    // Publish to all platforms
    const handlePublish = useCallback(async () => {
        const results: PlatformResult[] = []

        for (const sel of wizardState.platformSelections) {
            const platformId = sel.platformId

            if (
                platformId === "youtube" &&
                wizardState.contentType === "video"
            ) {
                // Upload video to YouTube
                setWizardState(prev => ({
                    ...prev,
                    processing: {
                        status: "uploading",
                        platformId: "youtube",
                        progress: 0,
                        speed: "0 KB/s",
                    },
                }))

                try {
                    const videoFile = wizardState.content.videoFile
                    if (!videoFile) {
                        results.push({
                            platformId: "youtube",
                            success: false,
                            error: "No video file selected",
                        })
                        continue
                    }

                    const meta = wizardState.platformMetadata.youtube
                    if (!meta) {
                        results.push({
                            platformId: "youtube",
                            success: false,
                            error: "YouTube metadata missing",
                        })
                        continue
                    }

                    // Build form data
                    const formData = new FormData()
                    formData.append("video", videoFile)
                    formData.append("description", meta.description)
                    formData.append("title", meta.title)
                    formData.append("privacyStatus", meta.privacyStatus)
                    formData.append("tags", meta.tags.join(","))
                    formData.append(
                        "madeForKids",
                        meta.madeForKids ? "true" : "false"
                    )
                    formData.append(
                        "aiGenerated",
                        meta.aiGenerated ? "true" : "false"
                    )
                    formData.append(
                        "paidPromotion",
                        meta.paidPromotion ? "true" : "false"
                    )
                    formData.append(
                        "monetization",
                        meta.monetization ? "true" : "false"
                    )
                    formData.append(
                        "contentRestrictions",
                        meta.contentRestrictions
                    )
                    if (meta.linkedVideoStart) {
                        formData.append(
                            "linkedVideoStart",
                            meta.linkedVideoStart
                        )
                    }
                    if (meta.linkedVideoEnd) {
                        formData.append("linkedVideoEnd", meta.linkedVideoEnd)
                    }

                    // Attach thumbnail if provided
                    if (wizardState.content.thumbnailFile) {
                        formData.append(
                            "thumbnail",
                            wizardState.content.thumbnailFile
                        )
                    }

                    // Update progress
                    setWizardState(prev => ({
                        ...prev,
                        processing: {
                            status: "uploading",
                            platformId: "youtube",
                            progress: 30,
                            speed: "2.5 MB/s",
                        },
                    }))

                    // Send to API
                    const res = await fetch("/api/platform/youtube/publish", {
                        method: "POST",
                        body: formData,
                    })

                    setWizardState(prev => ({
                        ...prev,
                        processing: {
                            status: "metadata",
                            platformId: "youtube",
                        },
                    }))

                    if (!res.ok) {
                        const data = await res.json()
                        throw new Error(
                            data.message || data.error || "Failed to publish"
                        )
                    }

                    setWizardState(prev => ({
                        ...prev,
                        processing: {
                            status: "publishing",
                            platformId: "youtube",
                        },
                    }))

                    await new Promise(r => setTimeout(r, 500))

                    const result = await res.json()
                    results.push({
                        platformId: "youtube",
                        success: true,
                        videoId: result.videoId,
                        url: result.url,
                    })
                } catch (err) {
                    results.push({
                        platformId: "youtube",
                        success: false,
                        error:
                            err instanceof Error
                                ? err.message
                                : "Unknown error",
                    })
                }
            } else {
                // Future: handle other platforms and post type
                results.push({
                    platformId,
                    success: false,
                    error: `${platformId} publishing not yet implemented`,
                })
            }
        }

        // Determine final state
        const allSuccess = results.every(r => r.success)
        const allFailed = results.every(r => !r.success)

        if (allSuccess) {
            setWizardState(prev => ({
                ...prev,
                processing: { status: "complete", results },
            }))
        } else if (allFailed) {
            const errors = results
                .filter(r => !r.success)
                .map(r => `${r.platformId}: ${r.error}`)
                .join("; ")
            setWizardState(prev => ({
                ...prev,
                processing: {
                    status: "error",
                    message: errors || "All platforms failed",
                    platformId: results[0]?.platformId,
                },
            }))
        } else {
            setWizardState(prev => ({
                ...prev,
                processing: { status: "partial", results },
            }))
        }
    }, [wizardState])

    const handleStartPublish = () => {
        setCurrentStep(5)
        handlePublish()
    }

    const handleRetry = () => {
        setWizardState(prev => ({
            ...prev,
            processing: { status: "idle" },
        }))
        setCurrentStep(4)
    }

    // Step titles
    const getStepTitle = (step: number): string => {
        const key = STEP_TITLE_KEYS[step]
        if (!key) return ""
        return t(key)
    }

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <ContentTypeSelect
                        selectedType={wizardState.contentType}
                        onSelect={handleContentTypeChange}
                        onNext={() => setCurrentStep(1)}
                    />
                )
            case 1:
                return (
                    <NetworkSelectStep
                        selectedPlatforms={selectedPlatformIds}
                        onPlatformsChange={handlePlatformsChange}
                        contentType={wizardState.contentType}
                        onNext={() => {
                            const needsChannels =
                                wizardState.platformSelections.some(s =>
                                    ["youtube", "facebook"].includes(
                                        s.platformId
                                    )
                                )
                            setCurrentStep(needsChannels ? 2 : 3)
                        }}
                    />
                )
            case 2:
                return (
                    <ChannelSelectStep
                        platformSelections={wizardState.platformSelections}
                        onSelectionsChange={handleSelectionsChange}
                        onBack={() => setCurrentStep(1)}
                        onNext={() => setCurrentStep(3)}
                    />
                )
            case 3:
                return (
                    <StorageModeStep
                        selectedMode={wizardState.storageMode}
                        onBack={() => setCurrentStep(2)}
                        onNext={() => setCurrentStep(4)}
                    />
                )
            case 4:
                return (
                    <ContentFormStep
                        state={wizardState}
                        onStateChange={setWizardState}
                        onBack={() => setCurrentStep(3)}
                        onNext={handleStartPublish}
                    />
                )
            case 5:
                return (
                    <ProcessingStep
                        processing={wizardState.processing}
                        onRetry={handleRetry}
                        onClose={onClose}
                        onGoToDashboard={onClose}
                    />
                )
            default:
                return null
        }
    }

    // Show first 5 steps in progress bar (0-4), skip step 5 (processing)
    const progressSteps = [0, 1, 2, 3, 4]
    const totalSteps = 6

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span>{t("wizard.title")}</span>
                        {currentStep < totalSteps && (
                            <span className="text-sm font-normal text-gray-500">
                                {t("wizard.step", {
                                    current: currentStep + 1,
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

                {/* Step progress bar */}
                {currentStep <= 4 && (
                    <div className="flex items-center gap-1 px-1">
                        {progressSteps.map(step => (
                            <div key={step} className="flex-1">
                                <div
                                    className={`h-1.5 rounded-full transition-colors ${
                                        step <= currentStep
                                            ? "bg-blue-500"
                                            : "bg-gray-200 dark:bg-gray-700"
                                    }`}
                                />
                                <p
                                    className={`mt-1 text-xs truncate ${
                                        step === currentStep
                                            ? "font-medium text-blue-600 dark:text-blue-400"
                                            : "text-gray-400"
                                    }`}
                                >
                                    {getStepTitle(step)}
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
