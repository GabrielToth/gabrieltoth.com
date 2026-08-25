import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { InsightsContainer } from "./InsightsContainer"

// Mock the API
vi.mock("@/lib/api", () => ({
    fetchChannels: vi.fn(() => Promise.resolve([])),
}))

describe("InsightsContainer", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders the Insights header", () => {
        render(<InsightsContainer />)
        expect(
            screen.getByText("Insights & Social Analytics")
        ).toBeInTheDocument()
        expect(
            screen.getByText(
                "Unified metrics across all connected platforms & channel groups"
            )
        ).toBeInTheDocument()
    })

    it("renders children when provided", () => {
        render(
            <InsightsContainer>
                <div>Custom Content</div>
            </InsightsContainer>
        )
        expect(screen.getByText("Custom Content")).toBeInTheDocument()
    })

    it("renders loading state initially", () => {
        render(<InsightsContainer />)
        // Check for loading skeletons
        const skeletons = screen.getAllByRole("generic")
        expect(skeletons.length).toBeGreaterThan(0)
    })
})
