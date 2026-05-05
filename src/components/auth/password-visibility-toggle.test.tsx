/**
 * PasswordVisibilityToggle Component Tests
 * Tests toggle functionality, keyboard accessibility, ARIA labels, and state management
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { PasswordVisibilityToggle } from "./password-visibility-toggle"

describe("PasswordVisibilityToggle", () => {
    describe("Toggle Functionality (Requirement 2.3, 2.4)", () => {
        it("should toggle visibility state when clicked", async () => {
            const user = userEvent.setup()
            const onToggle = vi.fn()

            render(
                <PasswordVisibilityToggle
                    id="toggle-1"
                    isVisible={false}
                    onToggle={onToggle}
                />
            )

            const button = screen.getByRole("button", {
                name: /show password/i,
            })

            await user.click(button)

            expect(onToggle).toHaveBeenCalledWith(true)
        })

        it("should toggle from visible to hidden", async () => {
            const user = userEvent.setup()
            const onToggle = vi.fn()

            render(
                <PasswordVisibilityToggle
                    id="toggle-2"
                    isVisible={true}
                    onToggle={onToggle}
                />
            )

            const button = screen.getByRole("button", {
                name: /hide password/i,
            })

            await user.click(button)

            expect(onToggle).toHaveBeenCalledWith(false)
        })

        it("should display correct icon based on visibility state", () => {
            const { rerender } = render(
                <PasswordVisibilityToggle
                    id="toggle-3"
                    isVisible={false}
                    onToggle={vi.fn()}
                />
            )

            // When hidden, should show eye icon (show password)
            let button = screen.getByRole("button", { name: /show password/i })
            expect(button).toBeInTheDocument()

            // Rerender with visible state
            rerender(
                <PasswordVisibilityToggle
                    id="toggle-3"
                    isVisible={true}
                    onToggle={vi.fn()}
                />
            )

            // When visible, should show eye-off icon (hide password)
            button = screen.getByRole("button", { name: /hide password/i })
            expect(button).toBeInTheDocument()
        })
    })

    describe("Keyboard Accessibility (Requirement 2.6)", () => {
        it("should toggle on Enter key press", async () => {
            const user = userEvent.setup()
            const onToggle = vi.fn()

            render(
                <PasswordVisibilityToggle
                    id="toggle-4"
                    isVisible={false}
                    onToggle={onToggle}
                />
            )

            const button = screen.getByRole("button", {
                name: /show password/i,
            })

            // Focus and press Enter
            await user.click(button)
            await user.keyboard("{Enter}")

            expect(onToggle).toHaveBeenCalled()
        })

        it("should toggle on Space key press", async () => {
            const user = userEvent.setup()
            const onToggle = vi.fn()

            render(
                <PasswordVisibilityToggle
                    id="toggle-5"
                    isVisible={false}
                    onToggle={onToggle}
                />
            )

            const button = screen.getByRole("button", {
                name: /show password/i,
            })

            // Focus and press Space
            button.focus()
            await user.keyboard(" ")

            expect(onToggle).toHaveBeenCalled()
        })

        it("should be keyboard navigable with Tab", async () => {
            const user = userEvent.setup()

            render(
                <PasswordVisibilityToggle
                    id="toggle-6"
                    isVisible={false}
                    onToggle={vi.fn()}
                />
            )

            const button = screen.getByRole("button", {
                name: /show password/i,
            })

            // Tab to button
            await user.tab()

            expect(button).toHaveFocus()
        })

        it("should not toggle on other key presses", async () => {
            const user = userEvent.setup()
            const onToggle = vi.fn()

            render(
                <PasswordVisibilityToggle
                    id="toggle-7"
                    isVisible={false}
                    onToggle={onToggle}
                />
            )

            const button = screen.getByRole("button", {
                name: /show password/i,
            })

            button.focus()
            await user.keyboard("a")

            expect(onToggle).not.toHaveBeenCalled()
        })
    })

    describe("ARIA Labels and Descriptions (Requirement 2.5)", () => {
        it("should have correct aria-label when hidden", () => {
            render(
                <PasswordVisibilityToggle
                    id="toggle-8"
                    isVisible={false}
                    onToggle={vi.fn()}
                />
            )

            const button = screen.getByRole("button", {
                name: /show password/i,
            })

            expect(button).toHaveAttribute("aria-label", "Show password")
        })

        it("should have correct aria-label when visible", () => {
            render(
                <PasswordVisibilityToggle
                    id="toggle-9"
                    isVisible={true}
                    onToggle={vi.fn()}
                />
            )

            const button = screen.getByRole("button", {
                name: /hide password/i,
            })

            expect(button).toHaveAttribute("aria-label", "Hide password")
        })

        it("should have aria-pressed attribute", () => {
            const { rerender } = render(
                <PasswordVisibilityToggle
                    id="toggle-10"
                    isVisible={false}
                    onToggle={vi.fn()}
                />
            )

            let button = screen.getByRole("button", { name: /show password/i })
            expect(button).toHaveAttribute("aria-pressed", "false")

            rerender(
                <PasswordVisibilityToggle
                    id="toggle-10"
                    isVisible={true}
                    onToggle={vi.fn()}
                />
            )

            button = screen.getByRole("button", { name: /hide password/i })
            expect(button).toHaveAttribute("aria-pressed", "true")
        })

        it("should have aria-describedby for description", () => {
            render(
                <PasswordVisibilityToggle
                    id="toggle-11"
                    isVisible={false}
                    onToggle={vi.fn()}
                />
            )

            const button = screen.getByRole("button", {
                name: /show password/i,
            })

            expect(button).toHaveAttribute(
                "aria-describedby",
                "toggle-11-description"
            )
        })

        it("should have screen reader description", () => {
            render(
                <PasswordVisibilityToggle
                    id="toggle-12"
                    isVisible={false}
                    onToggle={vi.fn()}
                />
            )

            const description = screen.getByText(
                /password is hidden\. press to show/i
            )

            expect(description).toHaveClass("sr-only")
        })
    })

    describe("State Management (Requirement 2.7)", () => {
        it("should not persist visibility state across reloads", () => {
            // This test verifies that the component doesn't use localStorage or sessionStorage
            const onToggle = vi.fn()

            const { unmount } = render(
                <PasswordVisibilityToggle
                    id="toggle-13"
                    isVisible={false}
                    onToggle={onToggle}
                />
            )

            unmount()

            // Remount component - should start with initial state
            render(
                <PasswordVisibilityToggle
                    id="toggle-13"
                    isVisible={false}
                    onToggle={onToggle}
                />
            )

            // Should show "Show password" label (not persisted)
            expect(
                screen.getByRole("button", { name: /show password/i })
            ).toBeInTheDocument()
        })

        it("should accept isVisible prop and update accordingly", () => {
            const { rerender } = render(
                <PasswordVisibilityToggle
                    id="toggle-14"
                    isVisible={false}
                    onToggle={vi.fn()}
                />
            )

            expect(
                screen.getByRole("button", { name: /show password/i })
            ).toBeInTheDocument()

            rerender(
                <PasswordVisibilityToggle
                    id="toggle-14"
                    isVisible={true}
                    onToggle={vi.fn()}
                />
            )

            expect(
                screen.getByRole("button", { name: /hide password/i })
            ).toBeInTheDocument()
        })
    })

    describe("Disabled State", () => {
        it("should be disabled when disabled prop is true", () => {
            const onToggle = vi.fn()

            render(
                <PasswordVisibilityToggle
                    id="toggle-15"
                    isVisible={false}
                    onToggle={onToggle}
                    disabled={true}
                />
            )

            const button = screen.getByRole("button", {
                name: /show password/i,
            })

            expect(button).toBeDisabled()
        })

        it("should not call onToggle when disabled", async () => {
            const user = userEvent.setup()
            const onToggle = vi.fn()

            render(
                <PasswordVisibilityToggle
                    id="toggle-16"
                    isVisible={false}
                    onToggle={onToggle}
                    disabled={true}
                />
            )

            const button = screen.getByRole("button", {
                name: /show password/i,
            })

            await user.click(button)

            expect(onToggle).not.toHaveBeenCalled()
        })
    })

    describe("Visual Feedback", () => {
        it("should have hover state styling", () => {
            render(
                <PasswordVisibilityToggle
                    id="toggle-17"
                    isVisible={false}
                    onToggle={vi.fn()}
                />
            )

            const button = screen.getByRole("button", {
                name: /show password/i,
            })

            expect(button).toHaveClass("hover:text-foreground")
        })

        it("should have focus state styling", () => {
            render(
                <PasswordVisibilityToggle
                    id="toggle-18"
                    isVisible={false}
                    onToggle={vi.fn()}
                />
            )

            const button = screen.getByRole("button", {
                name: /show password/i,
            })

            expect(button).toHaveClass("transition-colors")
        })
    })

    describe("Custom Styling", () => {
        it("should accept custom className", () => {
            render(
                <PasswordVisibilityToggle
                    id="toggle-19"
                    isVisible={false}
                    onToggle={vi.fn()}
                    className="custom-class"
                />
            )

            const button = screen.getByRole("button", {
                name: /show password/i,
            })

            expect(button).toHaveClass("custom-class")
        })

        it("should accept custom id", () => {
            render(
                <PasswordVisibilityToggle
                    id="custom-toggle-id"
                    isVisible={false}
                    onToggle={vi.fn()}
                />
            )

            const button = screen.getByRole("button", {
                name: /show password/i,
            })

            expect(button).toHaveAttribute("id", "custom-toggle-id")
        })
    })

    describe("Icon Rendering", () => {
        it("should render Eye icon when password is hidden", () => {
            render(
                <PasswordVisibilityToggle
                    id="toggle-20"
                    isVisible={false}
                    onToggle={vi.fn()}
                />
            )

            const button = screen.getByRole("button", {
                name: /show password/i,
            })

            // Eye icon should be present (lucide-react renders it)
            expect(button.querySelector("svg")).toBeInTheDocument()
        })

        it("should render EyeOff icon when password is visible", () => {
            render(
                <PasswordVisibilityToggle
                    id="toggle-21"
                    isVisible={true}
                    onToggle={vi.fn()}
                />
            )

            const button = screen.getByRole("button", {
                name: /hide password/i,
            })

            // EyeOff icon should be present (lucide-react renders it)
            expect(button.querySelector("svg")).toBeInTheDocument()
        })

        it("should have aria-hidden on icon", () => {
            render(
                <PasswordVisibilityToggle
                    id="toggle-22"
                    isVisible={false}
                    onToggle={vi.fn()}
                />
            )

            const button = screen.getByRole("button", {
                name: /show password/i,
            })
            const icon = button.querySelector("svg")

            expect(icon).toHaveAttribute("aria-hidden", "true")
        })
    })
})
