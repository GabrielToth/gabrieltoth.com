/**
 * Progress Indicator Component Tests
 *
 * Tests for progress indicator display
 *
 * Validates: Requirements 4.6
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import ProgressIndicator from "./progress-indicator"

// Mock next-intl
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => {
        const translations: Record<string, string> = {
            "completeAccount.step1.title": "Review Your Information",
            "completeAccount.step2.title": "Add Required Information",
            "completeAccount.step3.title": "Verify Your Information",
            "completeAccount.step": "Step",
            "completeAccount.of": "of",
        }
        return translations[key] || key
    },
}))

describe("ProgressIndicator", () => {
    it("should render progress indicator for step 1", () => {
        const { container } = render(
            <ProgressIndicator currentStep={1} totalSteps={3} />
        )

        expect(screen.getByText("Review Your Information")).toBeInTheDocument()
        // Check for step counter text (broken up by whitespace)
        const stepCounter = container.querySelector(
            ".text-center.text-sm"
        ) as HTMLElement
        expect(stepCounter?.textContent?.replace(/\s+/g, " ").trim()).toBe(
            "Step 1 of 3"
        )
    })

    it("should render progress indicator for step 2", () => {
        const { container } = render(
            <ProgressIndicator currentStep={2} totalSteps={3} />
        )

        expect(screen.getByText("Add Required Information")).toBeInTheDocument()
        // Check for step counter text (broken up by whitespace)
        const stepCounter = container.querySelector(
            ".text-center.text-sm"
        ) as HTMLElement
        expect(stepCounter?.textContent?.replace(/\s+/g, " ").trim()).toBe(
            "Step 2 of 3"
        )
    })

    it("should render progress indicator for step 3", () => {
        const { container } = render(
            <ProgressIndicator currentStep={3} totalSteps={3} />
        )

        expect(screen.getByText("Verify Your Information")).toBeInTheDocument()
        // Check for step counter text (broken up by whitespace)
        const stepCounter = container.querySelector(
            ".text-center.text-sm"
        ) as HTMLElement
        expect(stepCounter?.textContent?.replace(/\s+/g, " ").trim()).toBe(
            "Step 3 of 3"
        )
    })

    it("should display correct progress bar width", () => {
        const { container } = render(
            <ProgressIndicator currentStep={2} totalSteps={3} />
        )

        const progressBar = container.querySelector(
            '[role="progressbar"]'
        ) as HTMLElement
        expect(progressBar).toHaveStyle("width: 66.66666666666666%")
    })

    it("should display step indicators", () => {
        const { container } = render(
            <ProgressIndicator currentStep={2} totalSteps={3} />
        )

        const stepIndicators = container.querySelectorAll(
            ".w-10.h-10.rounded-full"
        )
        expect(stepIndicators).toHaveLength(3)
    })

    it("should mark completed steps with checkmark", () => {
        const { container } = render(
            <ProgressIndicator currentStep={3} totalSteps={3} />
        )

        const checkmarks = container.querySelectorAll("svg")
        // Should have 2 checkmarks for completed steps
        expect(checkmarks.length).toBeGreaterThanOrEqual(2)
    })

    it("should have correct aria attributes", () => {
        const { container } = render(
            <ProgressIndicator currentStep={2} totalSteps={3} />
        )

        const progressBar = container.querySelector(
            '[role="progressbar"]'
        ) as HTMLElement
        expect(progressBar).toHaveAttribute("aria-valuenow", "2")
        expect(progressBar).toHaveAttribute("aria-valuemin", "1")
        expect(progressBar).toHaveAttribute("aria-valuemax", "3")
    })
})
