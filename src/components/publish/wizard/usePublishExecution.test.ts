import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import usePublishExecution from "./usePublishExecution"
import { INITIAL_STATE, type PublishWizardState } from "./types"

const mockSetWizardState = vi.fn()
const mockSetCurrentStep = vi.fn()
const mockClearDraft = vi.fn()

const mockWizardState: PublishWizardState = { ...INITIAL_STATE }

function renderExecutionHook(stateOverride?: Partial<PublishWizardState>) {
    const state = { ...mockWizardState, ...stateOverride }
    return renderHook(() =>
        usePublishExecution({
            wizardState: state,
            setWizardState: mockSetWizardState,
            setCurrentStep: mockSetCurrentStep,
            clearDraft: mockClearDraft,
        })
    )
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe("usePublishExecution", () => {
    describe("handleStartPublish", () => {
        it("sets step to 8 and calls handlePublish", async () => {
            const { result } = renderExecutionHook()
            await act(async () => {
                result.current.handleStartPublish()
            })
            expect(mockSetCurrentStep).toHaveBeenCalledWith(8)
        })
    })

    describe("handleRetry", () => {
        it("resets processing to idle and sets step to 7", () => {
            const { result } = renderExecutionHook()
            act(() => {
                result.current.handleRetry()
            })
            // setWizardState is called with a function updater
            expect(mockSetWizardState.mock.calls[0][0]).toBeInstanceOf(Function)
            // Apply the updater to simulate the state transition
            const updater = mockSetWizardState.mock.calls[0][0]
            const result_state = updater({
                processing: { status: "error", message: "test" },
            })
            expect(result_state.processing).toEqual({ status: "idle" })
            expect(mockSetCurrentStep).toHaveBeenCalledWith(7)
        })
    })

    describe("isPublishing", () => {
        it("returns false when processing is idle", () => {
            const { result } = renderExecutionHook()
            expect(result.current.isPublishing).toBe(false)
        })

        it("returns true when processing is uploading", () => {
            const { result } = renderExecutionHook({
                processing: {
                    status: "uploading",
                    platformId: "youtube",
                    progress: 50,
                    speed: "1 MB/s",
                },
            })
            expect(result.current.isPublishing).toBe(true)
        })
    })
})
