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
import VideoUploadStep from "./VideoUploadStep"
import ContentFormStep from "./ContentFormStep"
import AdSuitabilityStep from "./AdSuitabilityStep"
import VisibilityStep from "./VisibilityStep"
import ProcessingStep from "./ProcessingStep"
import { type PublishWizardState, type ContentType } from "./types"
import { INITIAL_STATE, DEFAULT_YOUTUBE_METADATA } from "./types"
import usePublishDraft from "./usePublishDraft"
import usePublishExecution from "./usePublishExecution"
import CloseConfirmDialog from "./CloseConfirmDialog"
import StepProgressBar from "./StepProgressBar"

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

// Show first 8 steps in progress bar (0-7), skip step 8 (processing)
const PROGRESS_STEPS = [0, 1, 2, 3, 4, 5, 6, 7]
const TOTAL_STEPS = 9

export default function PublishWizard({ onClose }: PublishWizardProps) {
    const t = useTranslations("publish")

    // Wizard state
    const [currentStep, setCurrentStep] = useState<WizardStep>(0)
    const [wizardState, setWizardState] =
        useState<PublishWizardState>(INITIAL_STATE)

    // Draft management + close confirmation
    const {
        handleCloseAttempt,
        handleSaveDraftAndClose,
        handleDiscardAndClose,
        handleBackToEditing,
        showCloseConfirm,
        setShowCloseConfirm,
        clearDraft,
    } = usePublishDraft({
        wizardState,
        setWizardState,
        currentStep,
        setCurrentStep,
        onClose,
    })

    // Publish orchestration
    const { handlePublish, handleStartPublish, handleRetry } =
        usePublishExecution({
            wizardState,
            setWizardState,
            setCurrentStep,
            clearDraft,
        })

    // Derive selected platform IDs
    const selectedPlatformIds = wizardState.platformSelections.map(
        s => s.platformId
    )

    // Step 0: Content type selection
    const handleContentTypeChange = useCallback((type: ContentType) => {
        setWizardState({
            ...INITIAL_STATE,
            contentType: type,
        })
    }, [])

    // Step 2: Network selection
    const handlePlatformsChange = useCallback(
        (platforms: string[]) => {
            const existing = wizardState.platformSelections
            const updated = platforms.map(id => {
                const found = existing.find(e => e.platformId === id)
                return found || { platformId: id, channelIds: [] }
            })

            const removedPlatforms = existing
                .map(e => e.platformId)
                .filter(id => !platforms.includes(id))
            const metadata = { ...wizardState.platformMetadata }
            for (const id of removedPlatforms) {
                delete metadata[id]
            }

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
        },
        [wizardState]
    )

    // Step 3: Channel selections
    const handleSelectionsChange = useCallback(
        (selections: typeof wizardState.platformSelections) => {
            setWizardState({
                ...wizardState,
                platformSelections: selections,
            })
        },
        [wizardState]
    )

    // Step titles
    const getStepTitle = useCallback(
        (step: number): string => {
            const key = STEP_TITLE_KEYS[step]
            if (!key) return ""
            return t(key)
        },
        [t]
    )

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

    return (
        <>
            <Dialog open={true} onOpenChange={handleCloseAttempt}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <span>{t("wizard.title")}</span>
                            {currentStep < TOTAL_STEPS && (
                                <span className="text-sm font-normal text-muted-foreground">
                                    {t("wizard.step", {
                                        current: currentStep + 1,
                                        total: TOTAL_STEPS,
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

                    {/* Step progress bar */}
                    {currentStep <= 7 && (
                        <StepProgressBar
                            currentStep={currentStep}
                            progressSteps={PROGRESS_STEPS}
                            getStepTitle={getStepTitle}
                        />
                    )}

                    {/* Scrollable step content */}
                    <div className="flex-1 min-h-0 overflow-y-auto mt-4">
                        {renderStep()}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Close confirmation dialog */}
            <CloseConfirmDialog
                open={showCloseConfirm}
                onOpenChange={setShowCloseConfirm}
                onBackToEditing={handleBackToEditing}
                onSaveDraftAndClose={handleSaveDraftAndClose}
                onDiscardAndClose={handleDiscardAndClose}
            />
        </>
    )
}
