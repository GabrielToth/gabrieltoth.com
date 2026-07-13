import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import YouTubeMetadataForm from "./YouTubeMetadataForm"
import { DEFAULT_YOUTUBE_METADATA } from "./types"

// Mock child sections to test orchestration
vi.mock("./VideoUploadSection", () => ({
    default: () => <div>VideoUploadSection</div>,
}))

vi.mock("./BasicInfoSection", () => ({
    default: () => <div>BasicInfoSection</div>,
}))

vi.mock("./AudienceSection", () => ({
    default: () => <div>AudienceSection</div>,
}))

vi.mock("./ContentDisclosureSection", () => ({
    default: () => <div>ContentDisclosureSection</div>,
}))

vi.mock("./MonetizationSection", () => ({
    default: () => <div>MonetizationSection</div>,
}))

vi.mock("./CardsEndScreensSection", () => ({
    default: () => <div>CardsEndScreensSection</div>,
}))

vi.mock("./PrivacyScheduleSection", () => ({
    default: () => <div>PrivacyScheduleSection</div>,
}))

describe("YouTubeMetadataForm", () => {
    const defaultProps = {
        metadata: { ...DEFAULT_YOUTUBE_METADATA },
        onMetadataChange: vi.fn(),
        videoFile: null,
        onVideoFileChange: vi.fn(),
        onBack: vi.fn(),
        onNext: vi.fn(),
    }

    it("renders all 7 section components", () => {
        render(<YouTubeMetadataForm {...defaultProps} />)
        expect(screen.getByText("VideoUploadSection")).toBeInTheDocument()
        expect(screen.getByText("BasicInfoSection")).toBeInTheDocument()
        expect(screen.getByText("AudienceSection")).toBeInTheDocument()
        expect(screen.getByText("ContentDisclosureSection")).toBeInTheDocument()
        expect(screen.getByText("MonetizationSection")).toBeInTheDocument()
        expect(screen.getByText("CardsEndScreensSection")).toBeInTheDocument()
        expect(screen.getByText("PrivacyScheduleSection")).toBeInTheDocument()
    })

    it("renders the page title using translations", () => {
        render(<YouTubeMetadataForm {...defaultProps} />)
        expect(screen.getByText("Title")).toBeInTheDocument()
    })

    it("renders the page description using translations", () => {
        render(<YouTubeMetadataForm {...defaultProps} />)
        expect(screen.getByText("Description")).toBeInTheDocument()
    })

    it("calls onBack when back button is clicked", () => {
        render(<YouTubeMetadataForm {...defaultProps} />)
        fireEvent.click(screen.getByText("Back"))
        expect(defaultProps.onBack).toHaveBeenCalledTimes(1)
    })

    it("renders next button", () => {
        render(<YouTubeMetadataForm {...defaultProps} />)
        expect(screen.getByText("Next")).toBeInTheDocument()
    })
})
