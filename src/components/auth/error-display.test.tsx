/**
 * Unit Tests for Error Display Components
 * Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import {
    ErrorDisplay,
    FieldError,
    ServerError,
    SuccessMessage,
} from "./error-display"

describe("ErrorDisplay Component", () => {
    describe("Inline Variant", () => {
        it("should render inline error message", () => {
            // Requirement 15.5
            render(<ErrorDisplay error="Invalid email format" />)

            const errorElement = screen.getByRole("alert")
            expect(errorElement).toBeInTheDocument()
            expect(errorElement).toHaveTextContent("Invalid email format")
        })

        it("should not render when error is null", () => {
            const { container } = render(<ErrorDisplay error={null} />)
            expect(container.firstChild).toBeNull()
        })

        it("should not render when error is undefined", () => {
            const { container } = render(<ErrorDisplay error={undefined} />)
            expect(container.firstChild).toBeNull()
        })

        it("should have aria-live attribute for accessibility", () => {
            render(<ErrorDisplay error="Error message" />)

            const errorElement = screen.getByRole("alert")
            expect(errorElement).toHaveAttribute("aria-live", "polite")
        })

        it("should apply custom ID when provided", () => {
            render(<ErrorDisplay error="Error" id="custom-error-id" />)

            const errorElement = screen.getByRole("alert")
            expect(errorElement).toHaveAttribute("id", "custom-error-id")
        })

        it("should apply custom className", () => {
            render(<ErrorDisplay error="Error" className="custom-class" />)

            const errorElement = screen.getByRole("alert")
            expect(errorElement).toHaveClass("custom-class")
        })
    })

    describe("Banner Variant", () => {
        it("should render banner error message", () => {
            // Requirement 15.1
            render(
                <ErrorDisplay
                    error="An error occurred. Please try again later"
                    variant="banner"
                />
            )

            const errorElement = screen.getByRole("alert")
            expect(errorElement).toBeInTheDocument()
            expect(errorElement).toHaveTextContent(
                "An error occurred. Please try again later"
            )
        })

        it("should have different styling than inline variant", () => {
            const { container: inlineContainer } = render(
                <ErrorDisplay error="Error" variant="inline" />
            )
            const { container: bannerContainer } = render(
                <ErrorDisplay error="Error" variant="banner" />
            )

            const inlineElement =
                inlineContainer.querySelector('[role="alert"]')
            const bannerElement =
                bannerContainer.querySelector('[role="alert"]')

            expect(inlineElement?.className).not.toBe(bannerElement?.className)
        })

        it("should display icon in banner variant", () => {
            render(<ErrorDisplay error="Error" variant="banner" />)

            // Check for icon (XCircle component)
            const errorElement = screen.getByRole("alert")
            const icon = errorElement.querySelector("svg")
            expect(icon).toBeInTheDocument()
        })
    })
})

describe("FieldError Component", () => {
    it("should render field error with generated ID", () => {
        // Requirement 15.5
        render(<FieldError error="Invalid email format" fieldName="email" />)

        const errorElement = screen.getByRole("alert")
        expect(errorElement).toHaveAttribute("id", "email-error")
        expect(errorElement).toHaveTextContent("Invalid email format")
    })

    it("should not render when error is null", () => {
        const { container } = render(
            <FieldError error={null} fieldName="email" />
        )
        expect(container.firstChild).toBeNull()
    })

    it("should generate correct ID for different field names", () => {
        const { rerender } = render(
            <FieldError error="Error" fieldName="email" />
        )
        expect(screen.getByRole("alert")).toHaveAttribute("id", "email-error")

        rerender(<FieldError error="Error" fieldName="password" />)
        expect(screen.getByRole("alert")).toHaveAttribute(
            "id",
            "password-error"
        )
    })

    it("should apply custom className", () => {
        render(
            <FieldError
                error="Error"
                fieldName="email"
                className="custom-class"
            />
        )

        const errorElement = screen.getByRole("alert")
        expect(errorElement).toHaveClass("custom-class")
    })
})

describe("ServerError Component", () => {
    it("should render server error message", () => {
        // Requirement 15.1, 15.2, 15.3, 15.4
        render(
            <ServerError error="An error occurred. Please try again later" />
        )

        const errorElement = screen.getByRole("alert")
        expect(errorElement).toBeInTheDocument()
        expect(errorElement).toHaveTextContent(
            "An error occurred. Please try again later"
        )
    })

    it("should not render when error is null", () => {
        const { container } = render(<ServerError error={null} />)
        expect(container.firstChild).toBeNull()
    })

    it("should call onDismiss when dismiss button is clicked", async () => {
        const onDismiss = vi.fn()
        render(<ServerError error="Error message" onDismiss={onDismiss} />)

        const dismissButton = screen.getByRole("button", {
            name: /dismiss error/i,
        })
        await userEvent.click(dismissButton)

        expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it("should not render dismiss button when onDismiss is not provided", () => {
        render(<ServerError error="Error message" />)

        const dismissButton = screen.queryByRole("button", {
            name: /dismiss error/i,
        })
        expect(dismissButton).not.toBeInTheDocument()
    })

    it("should have aria-live attribute for accessibility", () => {
        render(<ServerError error="Error message" />)

        const errorElement = screen.getByRole("alert")
        expect(errorElement).toHaveAttribute("aria-live", "polite")
    })

    it("should apply custom className", () => {
        render(<ServerError error="Error" className="custom-class" />)

        const errorElement = screen.getByRole("alert")
        expect(errorElement).toHaveClass("custom-class")
    })

    it("should display icon", () => {
        render(<ServerError error="Error message" />)

        const errorElement = screen.getByRole("alert")
        const icon = errorElement.querySelector("svg")
        expect(icon).toBeInTheDocument()
    })
})

describe("SuccessMessage Component", () => {
    it("should render success message", () => {
        render(<SuccessMessage message="Operation successful" />)

        const messageElement = screen.getByRole("status")
        expect(messageElement).toBeInTheDocument()
        expect(messageElement).toHaveTextContent("Operation successful")
    })

    it("should not render when message is null", () => {
        const { container } = render(<SuccessMessage message={null} />)
        expect(container.firstChild).toBeNull()
    })

    it("should not render when message is undefined", () => {
        const { container } = render(<SuccessMessage message={undefined} />)
        expect(container.firstChild).toBeNull()
    })

    it("should call onDismiss when dismiss button is clicked", async () => {
        const onDismiss = vi.fn()
        render(
            <SuccessMessage message="Success message" onDismiss={onDismiss} />
        )

        const dismissButton = screen.getByRole("button", {
            name: /dismiss message/i,
        })
        await userEvent.click(dismissButton)

        expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it("should not render dismiss button when onDismiss is not provided", () => {
        render(<SuccessMessage message="Success message" />)

        const dismissButton = screen.queryByRole("button", {
            name: /dismiss message/i,
        })
        expect(dismissButton).not.toBeInTheDocument()
    })

    it("should have aria-live attribute for accessibility", () => {
        render(<SuccessMessage message="Success message" />)

        const messageElement = screen.getByRole("status")
        expect(messageElement).toHaveAttribute("aria-live", "polite")
    })

    it("should apply custom className", () => {
        render(<SuccessMessage message="Success" className="custom-class" />)

        const messageElement = screen.getByRole("status")
        expect(messageElement).toHaveClass("custom-class")
    })

    it("should display icon", () => {
        render(<SuccessMessage message="Success message" />)

        const messageElement = screen.getByRole("status")
        const icon = messageElement.querySelector("svg")
        expect(icon).toBeInTheDocument()
    })
})

describe("Error Display Accessibility", () => {
    it("should have proper ARIA attributes for screen readers", () => {
        render(<ErrorDisplay error="Error message" id="test-error" />)

        const errorElement = screen.getByRole("alert")
        expect(errorElement).toHaveAttribute("role", "alert")
        expect(errorElement).toHaveAttribute("aria-live", "polite")
        expect(errorElement).toHaveAttribute("id", "test-error")
    })

    it("should be linkable via aria-describedby", () => {
        render(
            <div>
                <input aria-describedby="email-error" />
                <FieldError error="Invalid email" fieldName="email" />
            </div>
        )

        const input = screen.getByRole("textbox")
        const error = screen.getByRole("alert")

        expect(input).toHaveAttribute("aria-describedby", "email-error")
        expect(error).toHaveAttribute("id", "email-error")
    })
})

describe("Error Message Content", () => {
    it("should display validation error messages", () => {
        // Requirement 15.5
        const validationErrors = [
            "Invalid email format",
            "Password must be at least 8 characters",
            "Passwords do not match",
            "Name can only contain letters, spaces, hyphens, and apostrophes",
        ]

        validationErrors.forEach(error => {
            const { unmount } = render(<ErrorDisplay error={error} />)
            expect(screen.getByRole("alert")).toHaveTextContent(error)
            unmount()
        })
    })

    it("should display authentication error messages", () => {
        // Requirement 15.2
        const authErrors = [
            "Invalid email or password",
            "Please verify your email before logging in",
            "Your session has expired. Please log in again",
        ]

        authErrors.forEach(error => {
            const { unmount } = render(<ServerError error={error} />)
            expect(screen.getByRole("alert")).toHaveTextContent(error)
            unmount()
        })
    })

    it("should display rate limiting error messages", () => {
        // Requirement 15.3
        const rateLimitErrors = [
            "Too many login attempts. Please try again later",
            "Too many login attempts. Please try again in 15 minutes",
        ]

        rateLimitErrors.forEach(error => {
            const { unmount } = render(<ServerError error={error} />)
            expect(screen.getByRole("alert")).toHaveTextContent(error)
            unmount()
        })
    })

    it("should display generic server error messages", () => {
        // Requirement 15.1
        const serverError = "An error occurred. Please try again later"

        render(<ServerError error={serverError} />)
        expect(screen.getByRole("alert")).toHaveTextContent(serverError)
    })

    it("should display token error messages", () => {
        // Requirement 15.4
        const tokenErrors = [
            "Verification link has expired",
            "Invalid verification token",
        ]

        tokenErrors.forEach(error => {
            const { unmount } = render(<ServerError error={error} />)
            expect(screen.getByRole("alert")).toHaveTextContent(error)
            unmount()
        })
    })
})
