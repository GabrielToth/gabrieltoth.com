import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import usePublishDraft from "./usePublishDraft"
import { INITIAL_STATE, type PublishWizardState } from "./types"

const mockWizardState: PublishWizardState = { ...INITIAL_STATE }
const mockSetWizardState = vi.fn()
const mockOnClose = vi.fn()

function renderDraftHook() {
    return renderHook(() =>
        usePublishDraft({
            wizardState: mockWizardState,
            setWizardState: mockSetWizardState,
            currentStep: 0,
            setCurrentStep: vi.fn(),
            onClose: mockOnClose,
        })
    )
}

beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
})

describe("usePublishDraft", () => {
    describe("hasContent", () => {
        it("returns false for initial state", () => {
            const { result } = renderDraftHook()
            expect(result.current.hasContent()).toBe(false)
        })

        it("returns true when text content exists", () => {
            const state = {
                ...mockWizardState,
                content: { ...mockWizardState.content, text: "Hello" },
            }
            const { result: result2 } = renderHook(() =>
                usePublishDraft({
                    wizardState: state,
                    setWizardState: mockSetWizardState,
                    currentStep: 0,
                    setCurrentStep: vi.fn(),
                    onClose: mockOnClose,
                })
            )
            expect(result2.current.hasContent()).toBe(true)
        })

        it("returns true when platforms are selected", () => {
            const state = {
                ...mockWizardState,
                platformSelections: [{ platformId: "youtube", channelIds: [] }],
            }
            const { result: result2 } = renderHook(() =>
                usePublishDraft({
                    wizardState: state,
                    setWizardState: mockSetWizardState,
                    currentStep: 0,
                    setCurrentStep: vi.fn(),
                    onClose: mockOnClose,
                })
            )
            expect(result2.current.hasContent()).toBe(true)
        })
    })

    describe("handleCloseAttempt", () => {
        it("shows confirmation when hasContent is true", () => {
            const state = {
                ...mockWizardState,
                content: { ...mockWizardState.content, text: "Hello" },
            }
            const { result: result2 } = renderHook(() =>
                usePublishDraft({
                    wizardState: state,
                    setWizardState: mockSetWizardState,
                    currentStep: 0,
                    setCurrentStep: vi.fn(),
                    onClose: mockOnClose,
                })
            )
            act(() => {
                result2.current.handleCloseAttempt()
            })
            expect(result2.current.showCloseConfirm).toBe(true)
            expect(mockOnClose).not.toHaveBeenCalled()
        })

        it("calls onClose when hasContent is false", () => {
            const { result } = renderDraftHook()
            act(() => {
                result.current.handleCloseAttempt()
            })
            expect(result.current.showCloseConfirm).toBe(false)
            expect(mockOnClose).toHaveBeenCalledTimes(1)
        })
    })

    describe("handleBackToEditing", () => {
        it("hides the confirmation dialog", () => {
            const { result } = renderDraftHook()
            act(() => {
                result.current.setShowCloseConfirm(true)
            })
            expect(result.current.showCloseConfirm).toBe(true)
            act(() => {
                result.current.handleBackToEditing()
            })
            expect(result.current.showCloseConfirm).toBe(false)
        })
    })

    describe("saveDraft and clearDraft", () => {
        it("saves to localStorage on saveDraft", async () => {
            const { result } = renderDraftHook()
            await act(async () => {
                await result.current.saveDraft()
            })
            const stored = localStorage.getItem("publish_wizard_draft")
            expect(stored).not.toBeNull()
            const parsed = JSON.parse(stored!)
            expect(parsed.contentType).toBe("post")
        })

        it("clears localStorage on clearDraft", async () => {
            localStorage.setItem(
                "publish_wizard_draft",
                JSON.stringify({ contentType: "post" })
            )
            const { result } = renderDraftHook()
            await act(async () => {
                await result.current.clearDraft()
            })
            const stored = localStorage.getItem("publish_wizard_draft")
            expect(stored).toBeNull()
        })
    })

    describe("handleDiscardAndClose", () => {
        it("clears draft, hides dialog, and calls onClose", async () => {
            const { result } = renderDraftHook()
            await act(async () => {
                await result.current.handleDiscardAndClose()
            })
            expect(localStorage.getItem("publish_wizard_draft")).toBeNull()
            expect(result.current.showCloseConfirm).toBe(false)
            expect(mockOnClose).toHaveBeenCalledTimes(1)
        })
    })

    describe("handleSaveDraftAndClose", () => {
        it("saves draft, hides dialog, and calls onClose", async () => {
            const { result } = renderDraftHook()
            await act(async () => {
                await result.current.handleSaveDraftAndClose()
            })
            const stored = localStorage.getItem("publish_wizard_draft")
            expect(stored).not.toBeNull()
            expect(result.current.showCloseConfirm).toBe(false)
            expect(mockOnClose).toHaveBeenCalledTimes(1)
        })
    })
})
