import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import PublishWizard from "./PublishWizard"

// Mock child components to simplify testing
vi.mock("./ContentTypeSelect", () => ({
    default: ({ onNext }: { onNext: () => void }) => (
        <div>
            ContentTypeSelect
            <button onClick={onNext}>Next</button>
        </div>
    ),
}))

vi.mock("./NetworkSelectStep", () => ({
    default: () => <div>NetworkSelectStep</div>,
}))

vi.mock("./ChannelSelectStep", () => ({
    default: () => <div>ChannelSelectStep</div>,
}))

vi.mock("./StorageModeStep", () => ({
    default: () => <div>StorageModeStep</div>,
}))

vi.mock("./VideoUploadStep", () => ({
    default: () => <div>VideoUploadStep</div>,
}))

vi.mock("./ContentFormStep", () => ({
    default: () => <div>ContentFormStep</div>,
}))

vi.mock("./AdSuitabilityStep", () => ({
    default: () => <div>AdSuitabilityStep</div>,
}))

vi.mock("./VisibilityStep", () => ({
    default: () => <div>VisibilityStep</div>,
}))

vi.mock("./ProcessingStep", () => ({
    default: () => <div>ProcessingStep</div>,
}))

const mockOnClose = vi.fn()

beforeEach(() => {
    vi.clearAllMocks()
})

describe("PublishWizard", () => {
    it("renders the wizard dialog with title", () => {
        render(<PublishWizard onClose={mockOnClose} />)
        expect(screen.getByText("Publish")).toBeInTheDocument()
    })

    it("renders step 0 (ContentTypeSelect) by default", () => {
        render(<PublishWizard onClose={mockOnClose} />)
        expect(screen.getByText("ContentTypeSelect")).toBeInTheDocument()
    })

    it("shows step counter", () => {
        render(<PublishWizard onClose={mockOnClose} />)
        expect(screen.getByText("Step 1 of 9")).toBeInTheDocument()
    })

    it("closes without confirmation when no content", () => {
        render(<PublishWizard onClose={mockOnClose} />)
        const closeButton = screen.getByLabelText("Close")
        fireEvent.click(closeButton)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
})
