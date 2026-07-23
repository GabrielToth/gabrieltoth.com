"use client"

import { useCallback } from "react"
import {
    type PublishWizardState,
    type PlatformResult,
    type YouTubeMetadata,
    type MetaPublishMetadata,
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
            } else if (
                platformId === "facebook" ||
                platformId === "instagram"
            ) {
                setWizardState(prev => ({
                    ...prev,
                    processing: {
                        status: "uploading",
                        platformId,
                        progress: 0,
                        speed: "0 KB/s",
                    },
                }))

                try {
                    const metaMeta = wizardState.platformMetadata[
                        "meta"
                    ] as MetaPublishMetadata | undefined

                    const description =
                        wizardState.content.text || metaMeta?.description || ""
                    const tags = metaMeta?.tags || []
                    const videoSource = wizardState.metaVideoSource || "upload"
                    const videoPath = wizardState.metaVideoPath || ""

                    if (!description.trim() && !wizardState.content.videoFile) {
                        results.push({
                            platformId,
                            success: false,
                            error: "No content or video provided",
                        })
                        continue
                    }

                    // Collect all meta target platforms
                    const metaPlatforms = wizardState.platformSelections
                        .filter(
                            s =>
                                s.platformId === "facebook" ||
                                s.platformId === "instagram"
                        )
                        .map(s => s.platformId as "facebook" | "instagram")

                    // Create the task in Supabase
                    const payload = {
                        title: wizardState.content.autoFillTitle || "",
                        description,
                        hashtags: tags,
                        platforms: metaPlatforms,
                        channelIds: sel.channelIds,
                        scheduleTime: null,
                    }

                    const taskRes = await fetch("/api/meta/publish", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            taskType:
                                wizardState.contentType === "video"
                                    ? "video"
                                    : "post",
                            videoSource,
                            videoPath: videoSource === "smb" ? videoPath : null,
                            videoOriginalName:
                                wizardState.content.videoFile?.name || null,
                            payload,
                        }),
                    })

                    if (!taskRes.ok) {
                        const data = await taskRes.json()
                        throw new Error(
                            data.error || "Failed to create publish task"
                        )
                    }

                    const { task } = await taskRes.json() as { task: { id: string; status: string } }

                    // If video source is 'upload', upload the video via tus
                    if (
                        videoSource === "upload" &&
                        wizardState.content.videoFile
                    ) {
                        setWizardState(prev => ({
                            ...prev,
                            processing: {
                                status: "uploading",
                                platformId,
                                progress: 10,
                                speed: "0 KB/s",
                            },
                        }))

                        await uploadViaTus(
                            wizardState.content.videoFile,
                            task.id
                        )
                    }

                    setWizardState(prev => ({
                        ...prev,
                        processing: {
                            status: "publishing",
                            platformId,
                        },
                    }))

                    // Poll until task is completed or failed
                    const finalTask = await pollTaskResult(task.id)

                    if (finalTask.status === "completed") {
                        const r = finalTask.result as Record<string, string> | undefined
                        results.push({
                            platformId,
                            success: true,
                            url: r?.facebook_url || r?.instagram_url,
                        })
                    } else {
                        throw new Error(
                            finalTask.error_message || "Publishing failed"
                        )
                    }
                } catch (err) {
                    results.push({
                        platformId,
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

async function uploadViaTus(file: File, taskId: string): Promise<void> {
    const TUS_ENDPOINT =
        process.env.NEXT_PUBLIC_META_TUS_ENDPOINT ||
        "https://pub.gabrieltoth.com/upload"

    return new Promise((resolve, reject) => {
        const { Upload } = require("tus-js-client") as {
            Upload: new (file: File, opts: Record<string, unknown>) => {
                start: () => void
                abort: () => void
            }
        }

        const upload = new Upload(file, {
            endpoint: TUS_ENDPOINT,
            headers: {
                Authorization: `Bearer ${taskId}`,
            },
            metadata: {
                filename: file.name,
                filetype: file.type,
                taskId,
            },
            chunkSize: 5 * 1024 * 1024,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            onError: (err: Error) => {
                reject(err)
            },
            onProgress: (_bytesSent: number, _bytesTotal: number) => {
                // could update progress via callback
            },
            onSuccess: () => {
                resolve()
            },
        })

        upload.start()
    })
}

async function pollTaskResult(
    taskId: string,
    maxAttempts = 120,
    intervalMs = 2000
): Promise<{ status: string; result?: unknown; error_message?: string }> {
    for (let i = 0; i < maxAttempts; i++) {
        const res = await fetch(`/api/meta/publish?id=${taskId}`)
        const { tasks } = await res.json()
        const task = tasks?.[0]

        if (!task) {
            await new Promise(r => setTimeout(r, intervalMs))
            continue
        }

        if (task.status === "completed") {
            return { status: "completed", result: task.result }
        }

        if (task.status === "failed") {
            return { status: "failed", error_message: task.error_message }
        }

        await new Promise(r => setTimeout(r, intervalMs))
    }

    return { status: "failed", error_message: "Timed out waiting for publish" }
}
