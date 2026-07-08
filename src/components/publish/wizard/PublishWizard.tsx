"use client"

import { useCallback, useState } from "react"
import { useTranslations } from "next-intl"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { X, Save, ArrowLeft, Trash2 } from "lucide-react"
import ContentTypeSelect from "./ContentTypeSelect"
import NetworkSelectStep from "./NetworkSelectStep"
import ChannelSelectStep from "./ChannelSelectStep"
import StorageModeStep from "./StorageModeStep"
import VideoUploadStep from "./VideoUploadStep"
import ContentFormStep from "./ContentFormStep"
import AdSuitabilityStep from "./AdSuitabilityStep"
import VisibilityStep from "./VisibilityStep"
import ProcessingStep from "./ProcessingStep"
import {
    type PublishWizardState,
    type PlatformSelection,
    type PlatformResult,
    type ContentType,
    type YouTubeMetadata,
} from "./types"
import { INITIAL_STATE, DEFAULT_YOUTUBE_METADATA } from "./types"

/** localStorage key for saving drafts */
const DRAFT_STORAGE_KEY = "publish_wizard_draft"

interface PublishWizardProps {
    onClose: () => void
    defaultDate?: Date
}

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

/** Map step index to step key for dynamic titles */
const STEP_TITLE_KEYS: Record<number, string> = {
    0: "contentType.title",
    1: "videoUpload.title",
    2: "step1.title",
    3: "step2.title",
    4: "step3.title",
    5: "step4.title",
    6: "step5.title",
    7: "step6.title",
    8: "step7.title",
}

export default function PublishWizard({ onClose }: PublishWizardProps) {
    const t = useTranslations("publish")

    // Wizard state
    const [currentStep, setCurrentStep] = useState<WizardStep>(0)
    const [wizardState, setWizardState] =
        useState<PublishWizardState>(INITIAL_STATE)

    // Close confirmation dialog
    const [showCloseConfirm, setShowCloseConfirm] = useState(false)

    // Derive selected platform IDs
    const selectedPlatformIds = wizardState.platformSelections.map(
        s => s.platformId
    )

    /** Check if the wizard has any meaningful content the user might lose */
    const hasContent = (): boolean => {
        const c = wizardState.content
        const meta = wizardState.platformMetadata.youtube as
            YouTubeMetadata | undefined

        // Has a file uploaded
        if (c.videoFile || c.thumbnailFile || c.images.length > 0) return true

        // Has text content
        if (c.text.trim().length > 0) return true

        // Has YouTube metadata filled in
        if (meta) {
            if (meta.title.trim().length > 0) return true
            if (meta.description.trim().length > 0) return true
            if (meta.tags.length > 0) return true
        }

        // Has platforms selected (beyond initial state)
        if (wizardState.platformSelections.length > 0) return true

        return false
    }

    /** Save a draft of the current state to localStorage */
    const saveDraft = () => {
        try {
            const draft = {
                contentType: wizardState.contentType,
                platformSelections: wizardState.platformSelections,
                storageMode: wizardState.storageMode,
                text: wizardState.content.text,
                platformMetadata: wizardState.platformMetadata,
                currentStep,
                savedAt: new Date().toISOString(),
            }
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
        } catch {
            // localStorage might be full — silently ignore
        }
    }

    /** Try to restore a previously saved draft */
    const restoreDraft = (): Partial<PublishWizardState> | null => {
        try {
            const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
            if (!raw) return null
            const data = JSON.parse(raw)
            // Only restore if saved within the last 24 hours
            const savedAt = new Date(data.savedAt)
            const now = new Date()
            const hoursDiff =
                (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60)
            if (hoursDiff > 24) {
                localStorage.removeItem(DRAFT_STORAGE_KEY)
                return null
            }
            return data
        } catch {
            return null
        }
    }

    /** Clear the saved draft */
    const clearDraft = () => {
        try {
            localStorage.removeItem(DRAFT_STORAGE_KEY)
        } catch {
            // ignore
        }
    }

    /** Attempt to close — checks for content first */
    const handleCloseAttempt = () => {
        if (hasContent()) {
            setShowCloseConfirm(true)
        } else {
            onClose()
        }
    }

    /** Save as draft and close */
    const handleSaveDraftAndClose = () => {
        saveDraft()
        setShowCloseConfirm(false)
        onClose()
    }

    /** Discard everything and close */
    const handleDiscardAndClose = () => {
        clearDraft()
        setShowCloseConfirm(false)
        onClose()
    }

    /** Go back to editing (just dismiss the confirmation) */
    const handleBackToEditing = () => {
        setShowCloseConfirm(false)
    }

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
            metadata.youtube = {
                ...DEFAULT_YOUTUBE_METADATA,
                title: wizardState.content.autoFillTitle || "",
            }
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

                    const meta = wizardState.platformMetadata.youtube as
                        YouTubeMetadata | undefined
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
                        "adSuitability",
                        JSON.stringify(meta.adSuitability)
                    )
                    formData.append(
                        "membersOnly",
                        meta.membersOnly ? "true" : "false"
                    )

                    // Compute publishAt from scheduledDate + scheduledTime
                    if (meta.scheduledDate && meta.scheduledTime) {
                        const scheduledDateTime = new Date(meta.scheduledDate)
                        const [hours, minutes] = meta.scheduledTime
                            .split(":")
                            .map(Number)
                        if (!isNaN(hours) && !isNaN(minutes)) {
                            scheduledDateTime.setHours(hours, minutes, 0, 0)
                            formData.append(
                                "publishAt",
                                scheduledDateTime.toISOString()
                            )
                        }
                    }

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
            } else if (platformId === "facebook") {
                // Post text to Facebook page feed
                setWizardState(prev => ({
                    ...prev,
                    processing: {
                        status: "uploading",
                        platformId: "facebook",
                        progress: 0,
                        speed: "0 KB/s",
                    },
                }))

                try {
                    const pageId = sel.channelIds[0]
                    if (!pageId) {
                        results.push({
                            platformId: "facebook",
                            success: false,
                            error: "No Facebook page selected",
                        })
                        continue
                    }

                    const message = wizardState.content.text
                    if (!message.trim()) {
                        results.push({
                            platformId: "facebook",
                            success: false,
                            error: "No message content",
                        })
                        continue
                    }

                    setWizardState(prev => ({
                        ...prev,
                        processing: {
                            status: "publishing",
                            platformId: "facebook",
                        },
                    }))

                    const res = await fetch("/api/platform/facebook/publish", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            pageId,
                            message,
                        }),
                    })

                    if (!res.ok) {
                        const data = await res.json()
                        throw new Error(
                            data.message ||
                                data.error ||
                                "Failed to publish to Facebook"
                        )
                    }

                    const result = await res.json()
                    results.push({
                        platformId: "facebook",
                        success: true,
                        url: result.url,
                    })
                } catch (err) {
                    results.push({
                        platformId: "facebook",
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
        setCurrentStep(8)
        handlePublish()
    }

    const handleRetry = () => {
        setWizardState(prev => ({
            ...prev,
            processing: { status: "idle" },
        }))
        setCurrentStep(7)
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
                        onNext={() =>
                            setCurrentStep(
                                wizardState.contentType === "video" ? 1 : 2
                            )
                        }
                    />
                )
            case 1:
                return (
                    <VideoUploadStep
                        state={wizardState}
                        onStateChange={setWizardState}
                        onBack={() => setCurrentStep(0)}
                        onNext={() => setCurrentStep(2)}
                    />
                )
            case 2:
                return (
                    <NetworkSelectStep
                        selectedPlatforms={selectedPlatformIds}
                        onPlatformsChange={handlePlatformsChange}
                        contentType={wizardState.contentType}
                        onBack={() =>
                            setCurrentStep(
                                wizardState.contentType === "video" ? 1 : 0
                            )
                        }
                        onNext={() => {
                            const needsChannels =
                                wizardState.platformSelections.some(s =>
                                    ["youtube", "facebook"].includes(
                                        s.platformId
                                    )
                                )
                            setCurrentStep(needsChannels ? 3 : 4)
                        }}
                    />
                )
            case 3:
                return (
                    <ChannelSelectStep
                        platformSelections={wizardState.platformSelections}
                        onSelectionsChange={handleSelectionsChange}
                        onBack={() => setCurrentStep(2)}
                        onNext={() => setCurrentStep(4)}
                    />
                )
            case 4:
                return (
                    <StorageModeStep
                        selectedMode={wizardState.storageMode}
                        onBack={() => setCurrentStep(3)}
                        onNext={() => setCurrentStep(5)}
                    />
                )
            case 5:
                return (
                    <ContentFormStep
                        state={wizardState}
                        onStateChange={setWizardState}
                        onBack={() => setCurrentStep(4)}
                        onNext={() => setCurrentStep(6)}
                    />
                )
            case 6:
                return (
                    <AdSuitabilityStep
                        state={wizardState}
                        onStateChange={setWizardState}
                        onBack={() => setCurrentStep(5)}
                        onNext={() => setCurrentStep(7)}
                    />
                )
            case 7:
                return (
                    <VisibilityStep
                        state={wizardState}
                        onStateChange={setWizardState}
                        onBack={() => setCurrentStep(6)}
                        onNext={handleStartPublish}
                    />
                )
            case 8:
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

    // Show first 8 steps in progress bar (0-7), skip step 8 (processing)
    const progressSteps = [0, 1, 2, 3, 4, 5, 6, 7]
    const totalSteps = 9

    return (
        <>
            <Dialog open={true} onOpenChange={handleCloseAttempt}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
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
                            onClick={handleCloseAttempt}
                            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </DialogHeader>

                    {/* Step progress bar — only shows title for current step */}
                    {currentStep <= 7 && (
                        <div className="flex items-center gap-1 px-1 flex-shrink-0">
                            {progressSteps.map(step => (
                                <div key={step} className="flex-1">
                                    <div
                                        className={`h-1.5 rounded-full transition-colors ${
                                            step <= currentStep
                                                ? "bg-blue-500"
                                                : "bg-gray-200 dark:bg-gray-700"
                                        }`}
                                    />
                                    {step === currentStep && (
                                        <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400 truncate">
                                            {getStepTitle(step)}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Scrollable step content — header and progress bar stay fixed */}
                    <div className="flex-1 min-h-0 overflow-y-auto mt-4">
                        {renderStep()}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Close confirmation dialog */}
            <AlertDialog
                open={showCloseConfirm}
                onOpenChange={setShowCloseConfirm}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t("closeConfirm.title")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("closeConfirm.description")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                        <AlertDialogCancel
                            onClick={handleBackToEditing}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t("closeConfirm.backToEditing")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSaveDraftAndClose}
                            className="gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {t("closeConfirm.saveDraft")}
                        </AlertDialogAction>
                        <AlertDialogAction
                            onClick={handleDiscardAndClose}
                            className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                        >
                            <Trash2 className="h-4 w-4" />
                            {t("closeConfirm.discard")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
