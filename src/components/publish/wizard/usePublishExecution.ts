"use client"

import { useCallback } from "react"
import {
    type PublishWizardState,
    type PlatformResult,
    type YouTubeMetadata,
    type WizardStep,
} from "./types"

export interface UsePublishExecutionProps {
    wizardState: PublishWizardState
    setWizardState: React.Dispatch<React.SetStateAction<PublishWizardState>>
    setCurrentStep: React.Dispatch<React.SetStateAction<WizardStep>>
    clearDraft: () => Promise<void>
}

export interface UsePublishExecutionReturn {
    handlePublish: () => Promise<void>
    handleStartPublish: () => void
    handleRetry: () => void
    isPublishing: boolean
}

export default function usePublishExecution({
    wizardState,
    setWizardState,
    setCurrentStep,
    clearDraft,
}: UsePublishExecutionProps): UsePublishExecutionReturn {
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
            // Clear draft on successful publish
            await clearDraft()
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
    }, [wizardState, setWizardState, clearDraft])

    const handleStartPublish = useCallback(() => {
        setCurrentStep(8)
        handlePublish()
    }, [setCurrentStep, handlePublish])

    const handleRetry = useCallback(() => {
        setWizardState(prev => ({
            ...prev,
            processing: { status: "idle" },
        }))
        setCurrentStep(7)
    }, [setWizardState, setCurrentStep])

    return {
        handlePublish,
        handleStartPublish,
        handleRetry,
        isPublishing: wizardState.processing.status !== "idle",
    }
}
