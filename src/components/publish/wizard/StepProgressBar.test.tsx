import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import StepProgressBar from "./StepProgressBar"

describe("StepProgressBar", () => {
    const progressSteps = [0, 1, 2, 3, 4, 5, 6, 7]
    const getStepTitle = (step: number): string => {
        const titles: Record<number, string> = {
            0: "Content Type",
            1: "Video Upload",
            2: "Select Network",
            3: "Select Channels",
            4: "Storage Mode",
            5: "Video Details",
            6: "Ad Suitability",
            7: "Visibility",
        }
        return titles[step] || ""
    }

    it("renders all progress steps", () => {
        render(
            <StepProgressBar
                currentStep={0}
                progressSteps={progressSteps}
                getStepTitle={getStepTitle}
            />
        )
        // All 8 steps should render
        const stepBars = document.querySelectorAll(".flex-1")
        expect(stepBars.length).toBe(8)
    })

    it("shows title for current step only", () => {
        render(
            <StepProgressBar
                currentStep={2}
                progressSteps={progressSteps}
                getStepTitle={getStepTitle}
            />
        )
        expect(screen.getByText("Select Network")).toBeInTheDocument()
        expect(screen.queryByText("Content Type")).not.toBeInTheDocument()
        expect(screen.queryByText("Visibility")).not.toBeInTheDocument()
    })

    it("highlights completed steps with blue color", () => {
        const { container } = render(
            <StepProgressBar
                currentStep={3}
                progressSteps={progressSteps}
                getStepTitle={getStepTitle}
            />
        )
        const bars = container.querySelectorAll(".rounded-full")
        // Steps 0, 1, 2, 3 should be blue (4 bars)
        // Steps 4, 5, 6, 7 should be gray (4 bars)
        const completedBars = container.querySelectorAll(".bg-blue-500")
        expect(completedBars.length).toBe(4)
    })
})
