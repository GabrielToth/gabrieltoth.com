import { ErrorDisplay } from "@/components/registration/ErrorDisplay"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

describe("ErrorDisplay Component", () => {
    describe("Rendering", () => {
        it("should not render when no errors are present", () => {
            const { container } = render(
                <ErrorDisplay error={null} fieldError={null} />
            )

            expect(container.firstChild).toBeEmptyDOMElement()
        })

        it("should render general error message", () => {
            render(
                <ErrorDisplay
                    error="An error occurred while creating your account"
                    fieldError={null}
                />
            )

            expect(
                screen.getByText(
                    "An error occurred while creating your account"
                )
            ).toBeInTheDocument()
        })

        it("should render field error message", () => {
            render(
                <ErrorDisplay
                    error={null}
                    fieldError="This field is required"
                />
            )

            expect(
                screen.getByText("This field is required")
            ).toBeInTheDocument()
        })

        it("should render both general and field errors", () => {
            render(
                <ErrorDisplay
                    error="Registration failed"
                    fieldError="Email is already registered"
                />
            )

            expect(screen.getByText("Registration failed")).toBeInTheDocument()
            expect(
                screen.getByText("Email is already registered")
            ).toBeInTheDocument()
        })
    })

    describe("Error Types", () => {
        it("should display email validation error", () => {
            render(
                <ErrorDisplay
                    error={null}
                    fieldError="Please enter a valid email address"
                />
            )

            expect(
                screen.getByText("Please enter a valid email address")
            ).toBeInTheDocument()
        })

        it("should display email already registered error", () => {
            render(
                <ErrorDisplay
                    error={null}
                    fieldError="This email is already registered"
                />
            )

            expect(
                screen.getByText("This email is already registered")
            ).toBeInTheDocument()
        })

        it("should display password mismatch error", () => {
            render(
                <ErrorDisplay
                    error={null}
                    fieldError="Passwords do not match"
                />
            )

            expect(
                screen.getByText("Passwords do not match")
            ).toBeInTheDocument()
        })

        it("should display invalid phone number error", () => {
            render(
                <ErrorDisplay
                    error={null}
                    fieldError="Please enter a valid phone number"
                />
            )

            expect(
                screen.getByText("Please enter a valid phone number")
            ).toBeInTheDocument()
        })

        it("should display network error", () => {
            render(
                <ErrorDisplay
                    error="Connection failed. Please check your internet connection and try again."
                    fieldError={null}
                />
            )

            expect(
                screen.getByText(/Connection failed.*internet connection/)
            ).toBeInTheDocument()
        })

        it("should display server error", () => {
            render(
                <ErrorDisplay
                    error="Server error. Please try again later."
                    fieldError={null}
                />
            )

            expect(
                screen.getByText("Server error. Please try again later.")
            ).toBeInTheDocument()
        })

        it("should display session expired error", () => {
            render(
                <ErrorDisplay
                    error="Your registration session has expired. Please start over."
                    fieldError={null}
                />
            )

            expect(
                screen.getByText(/Your registration session has expired/)
            ).toBeInTheDocument()
        })
    })

    describe("Dismiss Functionality", () => {
        it("should display dismiss button when onDismiss is provided", () => {
            render(
                <ErrorDisplay
                    error="An error occurred"
                    fieldError={null}
                    onDismiss={() => {}}
                />
            )

            const dismissButton = screen.getByLabelText("Dismiss error")
            expect(dismissButton).toBeInTheDocument()
        })

        it("should not display dismiss button when onDismiss is not provided", () => {
            render(<ErrorDisplay error="An error occurred" fieldError={null} />)

            const dismissButton = screen.queryByLabelText("Dismiss error")
            expect(dismissButton).not.toBeInTheDocument()
        })

        it("should call onDismiss when dismiss button is clicked", () => {
            const onDismiss = vi.fn()
            render(
                <ErrorDisplay
                    error="An error occurred"
                    fieldError={null}
                    onDismiss={onDismiss}
                />
            )

            const dismissButton = screen.getByLabelText("Dismiss error")
            fireEvent.click(dismissButton)

            expect(onDismiss).toHaveBeenCalledTimes(1)
        })

        it("should not display dismiss button for field errors", () => {
            render(
                <ErrorDisplay
                    error={null}
                    fieldError="This field is required"
                    onDismiss={() => {}}
                />
            )

            const dismissButton = screen.queryByLabelText("Dismiss error")
            expect(dismissButton).not.toBeInTheDocument()
        })
    })

    describe("Styling", () => {
        it("should apply error styling to general error", () => {
            const { container } = render(
                <ErrorDisplay error="An error occurred" fieldError={null} />
            )

            const errorContainer = container.querySelector(".bg-red-50")
            expect(errorContainer).toBeInTheDocument()
            expect(errorContainer).toHaveClass("border-red-200")
        })

        it("should apply error styling to field error", () => {
            const { container } = render(
                <ErrorDisplay
                    error={null}
                    fieldError="This field is required"
                />
            )

            const fieldErrorContainer = container.querySelector(".bg-red-50")
            expect(fieldErrorContainer).toBeInTheDocument()
        })

        it("should display error icon", () => {
            const { container } = render(
                <ErrorDisplay error="An error occurred" fieldError={null} />
            )

            const icon = container.querySelector(".text-red-600")
            expect(icon).toBeInTheDocument()
        })
    })

    describe("Accessibility", () => {
        it("should have proper ARIA attributes for general error", () => {
            const { container } = render(
                <ErrorDisplay error="An error occurred" fieldError={null} />
            )

            const errorContainer = container.querySelector(".bg-red-50")
            expect(errorContainer).toBeInTheDocument()
        })

        it("should have accessible dismiss button", () => {
            render(
                <ErrorDisplay
                    error="An error occurred"
                    fieldError={null}
                    onDismiss={() => {}}
                />
            )

            const dismissButton = screen.getByLabelText("Dismiss error")
            expect(dismissButton).toHaveAttribute("aria-label")
        })

        it("should display error text in user-friendly language", () => {
            render(
                <ErrorDisplay
                    error="Please check your information and try again"
                    fieldError={null}
                />
            )

            expect(
                screen.getByText("Please check your information and try again")
            ).toBeInTheDocument()
        })
    })

    describe("Multiple Errors", () => {
        it("should display both errors with proper spacing", () => {
            const { container } = render(
                <ErrorDisplay
                    error="Registration failed"
                    fieldError="Email is already registered"
                />
            )

            const errors = container.querySelectorAll(".bg-red-50")
            expect(errors.length).toBeGreaterThanOrEqual(1)
        })

        it("should maintain error order", () => {
            const { container } = render(
                <ErrorDisplay error="General error" fieldError="Field error" />
            )

            const errorTexts = container.textContent
            expect(errorTexts).toContain("General error")
            expect(errorTexts).toContain("Field error")
        })
    })

    describe("Edge Cases", () => {
        it("should handle empty string errors", () => {
            const { container } = render(
                <ErrorDisplay error="" fieldError={null} />
            )

            expect(container.firstChild).toBeEmptyDOMElement()
        })

        it("should handle very long error messages", () => {
            const longError =
                "This is a very long error message that explains in detail what went wrong and how to fix it. " +
                "It contains multiple sentences and provides comprehensive information about the error."

            render(<ErrorDisplay error={longError} fieldError={null} />)

            expect(screen.getByText(longError)).toBeInTheDocument()
        })

        it("should handle special characters in error messages", () => {
            const errorWithSpecialChars =
                "Error: Invalid input! Please use @, #, or $ characters."

            render(
                <ErrorDisplay error={errorWithSpecialChars} fieldError={null} />
            )

            expect(screen.getByText(errorWithSpecialChars)).toBeInTheDocument()
        })
    })

    describe("State Management", () => {
        it("should update when error prop changes", () => {
            const { rerender } = render(
                <ErrorDisplay error={null} fieldError={null} />
            )

            expect(screen.queryByText("Error 1")).not.toBeInTheDocument()

            rerender(<ErrorDisplay error="Error 1" fieldError={null} />)

            expect(screen.getByText("Error 1")).toBeInTheDocument()

            rerender(<ErrorDisplay error="Error 2" fieldError={null} />)

            expect(screen.queryByText("Error 1")).not.toBeInTheDocument()
            expect(screen.getByText("Error 2")).toBeInTheDocument()
        })

        it("should update when fieldError prop changes", () => {
            const { rerender } = render(
                <ErrorDisplay error={null} fieldError={null} />
            )

            expect(screen.queryByText("Field error")).not.toBeInTheDocument()

            rerender(<ErrorDisplay error={null} fieldError="Field error" />)

            expect(screen.getByText("Field error")).toBeInTheDocument()
        })
    })
})
