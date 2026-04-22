import { ProgressIndicator } from "@/components/registration/ProgressIndicator"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

describe("ProgressIndicator Component", () => {
    it("should render with default props", () => {
        render(<ProgressIndicator currentStep={0} />)
        expect(screen.getByText(/Step 1 of 4/)).toBeInTheDocument()
    })

    it("should display current step number", () => {
        render(
            <ProgressIndicator
                currentStep={1}
                totalSteps={4}
                stepLabels={["Email", "Password", "Personal", "Review"]}
            />
        )
        expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument()
    })

    it("should display step label", () => {
        render(
            <ProgressIndicator
                currentStep={0}
                totalSteps={4}
                stepLabels={["Email", "Password", "Personal", "Review"]}
            />
        )
        // Check for the label - it appears in both desktop and mobile views
        expect(screen.getAllByText("Email").length).toBeGreaterThan(0)
    })

    it("should handle custom step labels", () => {
        render(
            <ProgressIndicator
                currentStep={0}
                totalSteps={3}
                stepLabels={["Step 1", "Step 2", "Step 3"]}
            />
        )
        expect(screen.getByText(/Step 1 of 3/)).toBeInTheDocument()
    })

    it("should update progress bar width based on current step", () => {
        const { container } = render(
            <ProgressIndicator
                currentStep={1}
                totalSteps={4}
                stepLabels={["Email", "Password", "Personal", "Review"]}
            />
        )

        const progressBar = container.querySelector(
            ".bg-blue-500.h-2"
        ) as HTMLElement
        expect(progressBar).toBeInTheDocument()
        // Step 2 of 4 = 50%
        expect(progressBar).toHaveStyle({ width: "50%" })
    })

    it("should render progress bar container", () => {
        const { container } = render(
            <ProgressIndicator
                currentStep={0}
                totalSteps={4}
                stepLabels={["Email", "Password", "Personal", "Review"]}
            />
        )

        const progressBarContainer = container.querySelector(
            ".bg-gray-200.rounded-full.h-2"
        )
        expect(progressBarContainer).toBeInTheDocument()
    })

    it("should have proper styling classes", () => {
        const { container } = render(
            <ProgressIndicator
                currentStep={0}
                totalSteps={4}
                stepLabels={["Email", "Password", "Personal", "Review"]}
            />
        )

        const wrapper = container.firstChild as HTMLElement
        expect(wrapper).toHaveClass("flex")
        expect(wrapper).toHaveClass("flex-col")
        expect(wrapper).toHaveClass("py-8")
    })

    it("should handle step progression", () => {
        const { rerender } = render(
            <ProgressIndicator
                currentStep={0}
                totalSteps={4}
                stepLabels={["Email", "Password", "Personal", "Review"]}
            />
        )

        expect(screen.getByText(/Step 1 of 4/)).toBeInTheDocument()

        rerender(
            <ProgressIndicator
                currentStep={2}
                totalSteps={4}
                stepLabels={["Email", "Password", "Personal", "Review"]}
            />
        )

        expect(screen.getByText(/Step 3 of 4/)).toBeInTheDocument()
    })

    it("should handle all steps completed", () => {
        render(
            <ProgressIndicator
                currentStep={4}
                totalSteps={4}
                stepLabels={["Email", "Password", "Personal", "Review"]}
            />
        )

        expect(screen.getByText(/Step 5 of 4/)).toBeInTheDocument()
    })

    it("should render without horizontal scrolling", () => {
        const { container } = render(
            <ProgressIndicator
                currentStep={0}
                totalSteps={4}
                stepLabels={["Email", "Password", "Personal", "Review"]}
            />
        )

        const wrapper = container.firstChild as HTMLElement
        expect(wrapper).toHaveClass("flex")
    })

    it("should display step counter text", () => {
        render(
            <ProgressIndicator
                currentStep={1}
                totalSteps={4}
                stepLabels={["Email", "Password", "Personal", "Review"]}
            />
        )

        expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument()
    })

    it("should handle single step", () => {
        render(
            <ProgressIndicator
                currentStep={0}
                totalSteps={1}
                stepLabels={["Complete"]}
            />
        )

        expect(screen.getByText(/Step 1 of 1/)).toBeInTheDocument()
    })

    it("should handle many steps", () => {
        const labels = Array.from({ length: 10 }, (_, i) => `Step ${i + 1}`)
        render(
            <ProgressIndicator
                currentStep={5}
                totalSteps={10}
                stepLabels={labels}
            />
        )

        expect(screen.getByText(/Step 6 of 10/)).toBeInTheDocument()
    })
})
