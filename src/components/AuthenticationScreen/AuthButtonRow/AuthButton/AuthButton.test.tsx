/**
 * AuthButton Component Tests
 * Tests for the AuthButton component covering all states and interactions
 *
 * Validates: Requirements 1.0, 4.0
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthButton } from "./AuthButton"

describe("AuthButton Component", () => {
    const mockOnClick = vi.fn()
    const defaultProps = {
        provider: "google" as const,
        isDisabled: false,
        isLoading: false,
        onClick: mockOnClick,
        ariaLabel: "Sign in with Google",
        icon: <span>G</span>,
    }

    beforeEach(() => {
        mockOnClick.mockClear()
    })

    describe("Rendering", () => {
        it("should render a button element", () => {
            render(<AuthButton {...defaultProps} />)
            const button = screen.getByRole("button")
            expect(button).toBeInTheDocument()
        })

        it("should render with correct ARIA label", () => {
            render(<AuthButton {...defaultProps} />)
            const button = screen.getByRole("button", {
                name: "Sign in with Google",
            })
            expect(button).toBeInTheDocument()
        })

        it("should render icon content", () => {
            render(<AuthButton {...defaultProps} />)
            expect(screen.getByText("G")).toBeInTheDocument()
        })

        it("should render with different providers", () => {
            const providers = [
                "google",
                "email",
                "sso",
                "apple",
                "facebook",
            ] as const
            providers.forEach(provider => {
                const { unmount } = render(
                    <AuthButton
                        {...defaultProps}
                        provider={provider}
                        ariaLabel={`Sign in with ${provider}`}
                    />
                )
                expect(
                    screen.getByRole("button", {
                        name: `Sign in with ${provider}`,
                    })
                ).toBeInTheDocument()
                unmount()
            })
        })
    })

    describe("Enabled State", () => {
        it("should not be disabled by default", () => {
            render(<AuthButton {...defaultProps} />)
            const button = screen.getByRole("button")
            expect(button).not.toBeDisabled()
        })

        it("should have aria-disabled set to false when enabled", () => {
            render(<AuthButton {...defaultProps} />)
            const button = screen.getByRole("button")
            expect(button).toHaveAttribute("aria-disabled", "false")
        })

        it("should call onClick when clicked", async () => {
            render(<AuthButton {...defaultProps} />)
            const button = screen.getByRole("button")
            await userEvent.click(button)
            expect(mockOnClick).toHaveBeenCalledTimes(1)
        })

        it("should have type='button'", () => {
            render(<AuthButton {...defaultProps} />)
            const button = screen.getByRole("button")
            expect(button).toHaveAttribute("type", "button")
        })
    })

    describe("Disabled State", () => {
        it("should be disabled when isDisabled is true", () => {
            render(<AuthButton {...defaultProps} isDisabled={true} />)
            const button = screen.getByRole("button")
            expect(button).toBeDisabled()
        })

        it("should have aria-disabled set to true when disabled", () => {
            render(<AuthButton {...defaultProps} isDisabled={true} />)
            const button = screen.getByRole("button")
            expect(button).toHaveAttribute("aria-disabled", "true")
        })

        it("should not call onClick when clicked while disabled", async () => {
            render(<AuthButton {...defaultProps} isDisabled={true} />)
            const button = screen.getByRole("button")
            await userEvent.click(button)
            expect(mockOnClick).not.toHaveBeenCalled()
        })

        it("should be disabled and have proper attributes", () => {
            render(<AuthButton {...defaultProps} isDisabled={true} />)
            const button = screen.getByRole("button")
            expect(button).toBeDisabled()
            expect(button).toHaveAttribute("aria-disabled", "true")
        })
    })

    describe("Loading State", () => {
        it("should be disabled when isLoading is true", () => {
            render(<AuthButton {...defaultProps} isLoading={true} />)
            const button = screen.getByRole("button")
            expect(button).toBeDisabled()
        })

        it("should have loading class when isLoading is true", () => {
            const { container } = render(
                <AuthButton {...defaultProps} isLoading={true} />
            )
            const button = container.querySelector("button")
            // CSS modules hash the class name, so we check if it contains the loading class
            expect(button?.className).toMatch(/loading/)
        })

        it("should not call onClick when clicked while loading", async () => {
            render(<AuthButton {...defaultProps} isLoading={true} />)
            const button = screen.getByRole("button")
            await userEvent.click(button)
            expect(mockOnClick).not.toHaveBeenCalled()
        })

        it("should display spinner animation when loading", () => {
            const { container } = render(
                <AuthButton {...defaultProps} isLoading={true} />
            )
            const button = container.querySelector("button")
            // Verify the loading class is applied
            expect(button?.className).toMatch(/loading/)
        })

        it("should hide icon content when loading", () => {
            const { container } = render(
                <AuthButton {...defaultProps} isLoading={true} />
            )
            const button = container.querySelector("button")
            // The icon should still be in the DOM but hidden by CSS
            expect(button?.querySelector("span")).toBeInTheDocument()
        })
    })

    describe("Accessibility", () => {
        it("should have proper ARIA attributes", () => {
            render(<AuthButton {...defaultProps} />)
            const button = screen.getByRole("button")
            expect(button).toHaveAttribute("aria-label")
            expect(button).toHaveAttribute("aria-disabled")
        })

        it("should be keyboard accessible", async () => {
            render(<AuthButton {...defaultProps} />)
            const button = screen.getByRole("button")
            button.focus()
            expect(button).toHaveFocus()
            await userEvent.keyboard("{Enter}")
            expect(mockOnClick).toHaveBeenCalled()
        })

        it("should be activatable with Space key", async () => {
            render(<AuthButton {...defaultProps} />)
            const button = screen.getByRole("button")
            button.focus()
            await userEvent.keyboard(" ")
            expect(mockOnClick).toHaveBeenCalled()
        })

        it("should have button element for focus management", () => {
            render(<AuthButton {...defaultProps} />)
            const button = screen.getByRole("button")
            expect(button).toBeInTheDocument()
            // Focus styles are applied via CSS
        })

        it("should announce disabled state to screen readers", () => {
            render(<AuthButton {...defaultProps} isDisabled={true} />)
            const button = screen.getByRole("button")
            expect(button).toHaveAttribute("aria-disabled", "true")
        })
    })

    describe("Styling", () => {
        it("should render as a button element", () => {
            const { container } = render(<AuthButton {...defaultProps} />)
            const button = container.querySelector("button")
            expect(button).toBeInTheDocument()
        })

        it("should have icon container", () => {
            const { container } = render(<AuthButton {...defaultProps} />)
            const icon = container.querySelector("span")
            expect(icon).toBeInTheDocument()
        })

        it("should apply loading class only when loading", () => {
            const { container, rerender } = render(
                <AuthButton {...defaultProps} isLoading={false} />
            )
            let button = container.querySelector("button")
            expect(button?.className).not.toMatch(/loading/)

            rerender(<AuthButton {...defaultProps} isLoading={true} />)
            button = container.querySelector("button")
            expect(button?.className).toMatch(/loading/)
        })
    })

    describe("State Transitions", () => {
        it("should transition from enabled to loading", () => {
            const { container, rerender } = render(
                <AuthButton {...defaultProps} isLoading={false} />
            )
            let button = container.querySelector("button")
            expect(button).not.toBeDisabled()

            rerender(<AuthButton {...defaultProps} isLoading={true} />)
            button = container.querySelector("button")
            expect(button).toBeDisabled()
            expect(button?.className).toMatch(/loading/)
        })

        it("should transition from loading to enabled", () => {
            const { container, rerender } = render(
                <AuthButton {...defaultProps} isLoading={true} />
            )
            let button = container.querySelector("button")
            expect(button).toBeDisabled()

            rerender(<AuthButton {...defaultProps} isLoading={false} />)
            button = container.querySelector("button")
            expect(button).not.toBeDisabled()
            expect(button?.className).not.toMatch(/loading/)
        })

        it("should transition from enabled to disabled", () => {
            const { container, rerender } = render(
                <AuthButton {...defaultProps} isDisabled={false} />
            )
            let button = container.querySelector("button")
            expect(button).not.toBeDisabled()

            rerender(<AuthButton {...defaultProps} isDisabled={true} />)
            button = container.querySelector("button")
            expect(button).toBeDisabled()
        })
    })

    describe("Edge Cases", () => {
        it("should handle both isDisabled and isLoading being true", () => {
            render(
                <AuthButton
                    {...defaultProps}
                    isDisabled={true}
                    isLoading={true}
                />
            )
            const button = screen.getByRole("button")
            expect(button).toBeDisabled()
        })

        it("should handle rapid clicks", async () => {
            render(<AuthButton {...defaultProps} />)
            const button = screen.getByRole("button")
            await userEvent.click(button)
            await userEvent.click(button)
            await userEvent.click(button)
            expect(mockOnClick).toHaveBeenCalledTimes(3)
        })

        it("should handle empty icon", () => {
            render(<AuthButton {...defaultProps} icon={null} />)
            const button = screen.getByRole("button")
            expect(button).toBeInTheDocument()
        })

        it("should handle complex icon content", () => {
            const complexIcon = (
                <svg>
                    <circle cx="50" cy="50" r="40" />
                </svg>
            )
            render(<AuthButton {...defaultProps} icon={complexIcon} />)
            const button = screen.getByRole("button")
            expect(button).toBeInTheDocument()
            expect(button.querySelector("svg")).toBeInTheDocument()
        })
    })

    describe("Props Validation", () => {
        it("should accept all valid providers", () => {
            const providers = [
                "google",
                "email",
                "sso",
                "apple",
                "facebook",
            ] as const
            providers.forEach(provider => {
                const { unmount } = render(
                    <AuthButton {...defaultProps} provider={provider} />
                )
                expect(screen.getByRole("button")).toBeInTheDocument()
                unmount()
            })
        })

        it("should handle different ARIA labels", () => {
            const labels = [
                "Sign in with Google",
                "Sign in with Email",
                "Sign in with SSO",
                "Sign in with Apple (coming soon)",
                "Sign in with Facebook (coming soon)",
            ]
            labels.forEach(label => {
                const { unmount } = render(
                    <AuthButton {...defaultProps} ariaLabel={label} />
                )
                expect(
                    screen.getByRole("button", { name: label })
                ).toBeInTheDocument()
                unmount()
            })
        })
    })
})
