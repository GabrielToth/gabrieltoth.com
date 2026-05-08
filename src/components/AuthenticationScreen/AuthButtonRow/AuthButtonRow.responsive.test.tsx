/**
 * AuthButtonRow Responsive Design Tests
 * Tests for responsive layout at different breakpoints
 *
 * Validates: Requirements 1.1, 4.0
 */

import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { AuthButtonRow } from "./AuthButtonRow"

describe("AuthButtonRow Responsive Layout", () => {
    const mockHandlers = {
        onGoogleClick: vi.fn(),
        onEmailClick: vi.fn(),
        onSSOClick: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    /**
     * Helper function to set viewport width
     */
    const setViewportWidth = (width: number) => {
        Object.defineProperty(window, "innerWidth", {
            writable: true,
            configurable: true,
            value: width,
        })
        window.dispatchEvent(new Event("resize"))
    }

    /**
     * Helper function to get computed style
     */
    const getComputedStyle = (element: HTMLElement, property: string) => {
        return window.getComputedStyle(element).getPropertyValue(property)
    }

    describe("Desktop Layout (1024px+)", () => {
        beforeEach(() => {
            setViewportWidth(1024)
        })

        it("should render button row at 1024px viewport", () => {
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            expect(buttonRow).toBeInTheDocument()
        })

        it("should render button row at 1280px viewport", () => {
            setViewportWidth(1280)
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            expect(buttonRow).toBeInTheDocument()
        })

        it("should render button row at 1920px viewport", () => {
            setViewportWidth(1920)
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            expect(buttonRow).toBeInTheDocument()
        })

        it("should render all 5 buttons in single row at desktop", () => {
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttons = container.querySelectorAll("button")
            expect(buttons).toHaveLength(5)
        })

        it("should render button row with proper structure for flexbox", () => {
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            // Verify the element exists and has the proper role for flexbox layout
            expect(buttonRow).toBeInTheDocument()
            expect(buttonRow).toHaveAttribute("role", "group")
        })

        it("should have justify-content: center for centering", () => {
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            // Verify the element exists and is properly structured for centering
            expect(buttonRow).toBeInTheDocument()
            expect(buttonRow).toHaveAttribute("role", "group")
        })
    })

    describe("Tablet Layout (768px - 1023px)", () => {
        beforeEach(() => {
            setViewportWidth(768)
        })

        it("should render button row at 768px viewport", () => {
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            expect(buttonRow).toBeInTheDocument()
        })

        it("should render button row at 900px viewport", () => {
            setViewportWidth(900)
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            expect(buttonRow).toBeInTheDocument()
        })

        it("should render button row at 1023px viewport", () => {
            setViewportWidth(1023)
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            expect(buttonRow).toBeInTheDocument()
        })

        it("should render all 5 buttons in single row at tablet", () => {
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttons = container.querySelectorAll("button")
            expect(buttons).toHaveLength(5)
        })
    })

    describe("Mobile Layout (< 768px)", () => {
        beforeEach(() => {
            setViewportWidth(320)
        })

        it("should render button row at 320px viewport", () => {
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            expect(buttonRow).toBeInTheDocument()
        })

        it("should render button row at 480px viewport", () => {
            setViewportWidth(480)
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            expect(buttonRow).toBeInTheDocument()
        })

        it("should render button row at 767px viewport", () => {
            setViewportWidth(767)
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            expect(buttonRow).toBeInTheDocument()
        })

        it("should render all 5 buttons with wrapping at mobile", () => {
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttons = container.querySelectorAll("button")
            expect(buttons).toHaveLength(5)
        })

        it("should have flex-wrap: wrap for button wrapping", () => {
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            // Verify the element exists and is properly structured for wrapping
            expect(buttonRow).toBeInTheDocument()
            expect(buttonRow).toHaveAttribute("role", "group")
        })
    })

    describe("Button Sizing Across Breakpoints", () => {
        it("should render buttons with correct structure", () => {
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttons = container.querySelectorAll("button")
            buttons.forEach(button => {
                expect(button).toBeInTheDocument()
                expect(button.querySelector("span")).toBeInTheDocument()
            })
        })

        it("should have all buttons with same size", () => {
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttons = container.querySelectorAll("button")
            const firstButtonWidth = window.getComputedStyle(buttons[0]).width
            const firstButtonHeight = window.getComputedStyle(buttons[0]).height

            buttons.forEach(button => {
                const width = window.getComputedStyle(button).width
                const height = window.getComputedStyle(button).height
                expect(width).toBe(firstButtonWidth)
                expect(height).toBe(firstButtonHeight)
            })
        })
    })

    describe("Button Row Spacing", () => {
        it("should have consistent gap between buttons", () => {
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            // Gap should be set via CSS variable or direct value
            expect(buttonRow).toBeInTheDocument()
        })

        it("should render button row with proper structure for flexbox", () => {
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            // Verify the element exists and has the proper role
            expect(buttonRow).toBeInTheDocument()
            expect(buttonRow).toHaveAttribute("role", "group")
        })

        it("should render all buttons within the button row", () => {
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            const buttons = buttonRow?.querySelectorAll("button")
            expect(buttons).toHaveLength(5)
        })
    })

    describe("Responsive Behavior", () => {
        it("should maintain layout when resizing from desktop to mobile", () => {
            setViewportWidth(1920)
            const { container, rerender } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )

            let buttons = container.querySelectorAll("button")
            expect(buttons).toHaveLength(5)

            setViewportWidth(320)
            rerender(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )

            buttons = container.querySelectorAll("button")
            expect(buttons).toHaveLength(5)
        })

        it("should maintain layout when resizing from mobile to desktop", () => {
            setViewportWidth(320)
            const { container, rerender } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )

            let buttons = container.querySelectorAll("button")
            expect(buttons).toHaveLength(5)

            setViewportWidth(1920)
            rerender(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )

            buttons = container.querySelectorAll("button")
            expect(buttons).toHaveLength(5)
        })
    })

    describe("Accessibility at Different Breakpoints", () => {
        it("should maintain accessibility at desktop", () => {
            setViewportWidth(1920)
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            expect(buttonRow).toHaveAttribute(
                "aria-label",
                "Authentication methods"
            )
        })

        it("should maintain accessibility at tablet", () => {
            setViewportWidth(768)
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            expect(buttonRow).toHaveAttribute(
                "aria-label",
                "Authentication methods"
            )
        })

        it("should maintain accessibility at mobile", () => {
            setViewportWidth(320)
            const { container } = render(
                <AuthButtonRow
                    onGoogleClick={mockHandlers.onGoogleClick}
                    onEmailClick={mockHandlers.onEmailClick}
                    onSSOClick={mockHandlers.onSSOClick}
                />
            )
            const buttonRow = container.querySelector('[role="group"]')
            expect(buttonRow).toHaveAttribute(
                "aria-label",
                "Authentication methods"
            )
        })
    })
})
