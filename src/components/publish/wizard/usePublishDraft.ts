"use client"

import { useCallback, useEffect, useState } from "react"
import {
    type PublishWizardState,
    type WizardStep,
    type YouTubeMetadata,
} from "./types"

const DRAFT_STORAGE_KEY = "publish_wizard_draft"

export interface UsePublishDraftProps {
    wizardState: PublishWizardState
    setWizardState: React.Dispatch<React.SetStateAction<PublishWizardState>>
    currentStep: WizardStep
    setCurrentStep: React.Dispatch<React.SetStateAction<WizardStep>>
    onClose: () => void
}

export interface UsePublishDraftReturn {
    draftId: string | null
    hasContent: () => boolean
    saveDraft: () => Promise<void>
    restoreDraft: () => Promise<Record<string, unknown> | null>
    clearDraft: () => Promise<void>
    handleCloseAttempt: () => void
    handleSaveDraftAndClose: () => Promise<void>
    handleDiscardAndClose: () => Promise<void>
    handleBackToEditing: () => void
    showCloseConfirm: boolean
    setShowCloseConfirm: React.Dispatch<React.SetStateAction<boolean>>
}

export default function usePublishDraft({
    wizardState,
    setWizardState,
    currentStep,
    setCurrentStep,
    onClose,
}: UsePublishDraftProps): UsePublishDraftReturn {
    const [draftId, setDraftId] = useState<string | null>(null)
    const [draftRestored, setDraftRestored] = useState(false)
    const [showCloseConfirm, setShowCloseConfirm] = useState(false)

    const hasContent = useCallback((): boolean => {
        const c = wizardState.content
        const meta = wizardState.platformMetadata.youtube as
            YouTubeMetadata | undefined

        if (c.videoFile || c.thumbnailFile || c.images.length > 0) return true
        if (c.text.trim().length > 0) return true

        if (meta) {
            if (meta.title.trim().length > 0) return true
            if (meta.description.trim().length > 0) return true
            if (meta.tags.length > 0) return true
        }

        if (wizardState.platformSelections.length > 0) return true

        return false
    }, [wizardState])

    const saveDraft = useCallback(async () => {
        try {
            const platforms = wizardState.platformSelections.map(
                s => s.platformId
            )
            const body = {
                content: wizardState.content.text || "",
                scheduledTime: Date.now() + 86400000,
                platforms: platforms.length > 0 ? platforms : ["youtube"],
                mediaType:
                    wizardState.contentType === "video" ? "video" : "text",
                status: "draft",
            }

            if (draftId) {
                await fetch(`/api/posts/${draftId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: body.content,
                        status: "draft",
                    }),
                })
            } else {
                const res = await fetch("/api/posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                })
                if (res.ok) {
                    const data = await res.json()
                    if (data.post?.id) {
                        setDraftId(data.post.id)
                    }
                }
            }
        } catch {
            // API failed — fallback will handle it
        }

        try {
            const draft = {
                contentType: wizardState.contentType,
                platformSelections: wizardState.platformSelections,
                storageMode: wizardState.storageMode,
                text: wizardState.content.text,
                platformMetadata: wizardState.platformMetadata,
                currentStep,
                draftId,
                savedAt: new Date().toISOString(),
            }
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
        } catch {
            // localStorage might be full — silently ignore
        }
    }, [wizardState, currentStep, draftId])

    const restoreDraft =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useCallback(async (): Promise<any> => {
            // Try API first: fetch most recent draft from server
            try {
                const res = await fetch("/api/posts")
                if (res.ok) {
                    const data = await res.json()
                    const draftPosts = (data.posts || []).filter(
                        (p: { status: string }) => p.status === "draft"
                    )
                    if (draftPosts.length > 0) {
                        // Sort by createdAt descending, take the latest
                        draftPosts.sort(
                            (
                                a: { createdAt: string },
                                b: { createdAt: string }
                            ) =>
                                new Date(b.createdAt).getTime() -
                                new Date(a.createdAt).getTime()
                        )
                        const latestDraft = draftPosts[0]
                        setDraftId(latestDraft.id)
                        return {
                            text: latestDraft.content || "",
                        }
                    }
                }
            } catch {
                // API failed — fallback to localStorage
            }

            // localStorage fallback
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
                if (data.draftId) {
                    setDraftId(data.draftId)
                }
                return data
            } catch {
                return null
            }
        }, [])

    const clearDraft = useCallback(async () => {
        if (draftId) {
            try {
                await fetch(`/api/posts/${draftId}`, { method: "DELETE" })
            } catch {
                // Ignore API errors during cleanup
            }
            setDraftId(null)
        }
        try {
            localStorage.removeItem(DRAFT_STORAGE_KEY)
        } catch {
            // ignore
        }
    }, [draftId])

    // Restore draft on mount
    useEffect(() => {
        if (!draftRestored) {
            restoreDraft().then(data => {
                if (data) {
                    setWizardState(prev => ({
                        ...prev,
                        content: {
                            ...prev.content,
                            text: data.text || prev.content.text,
                        },
                    }))
                    if (data.currentStep !== undefined) {
                        setCurrentStep(data.currentStep as WizardStep)
                    }
                }
                setDraftRestored(true)
            })
        }
    }, [draftRestored, restoreDraft, setWizardState, setCurrentStep])

    const handleCloseAttempt = useCallback(() => {
        if (hasContent()) {
            setShowCloseConfirm(true)
        } else {
            onClose()
        }
    }, [hasContent, onClose])

    const handleSaveDraftAndClose = useCallback(async () => {
        await saveDraft()
        setShowCloseConfirm(false)
        onClose()
    }, [saveDraft, onClose])

    const handleDiscardAndClose = useCallback(async () => {
        await clearDraft()
        setShowCloseConfirm(false)
        onClose()
    }, [clearDraft, onClose])

    const handleBackToEditing = useCallback(() => {
        setShowCloseConfirm(false)
    }, [])

    return {
        draftId,
        hasContent,
        saveDraft,
        restoreDraft,
        clearDraft,
        handleCloseAttempt,
        handleSaveDraftAndClose,
        handleDiscardAndClose,
        handleBackToEditing,
        showCloseConfirm,
        setShowCloseConfirm,
    }
}
