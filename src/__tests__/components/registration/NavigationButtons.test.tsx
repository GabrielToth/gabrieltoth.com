import { NavigationButtons } from "@/components/registration/NavigationButtons"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

describe("NavigationButtons Component", () => {
    describe("Rendering", () => {
        it("should render Back button when onBack is provided", () => {
            render(<NavigationButtons onBack={() => {}} onNext={() => {}} />)

            expect(screen.getByText("Back")).toBeInTheDocument()
        })

        it("should render Next button when onNext is provided", () => {
            render(<NavigationButtons onBack={() => {}} onNext={() => {}} />)

            expect(screen.getByText("Next")).toBeInTheDocument()
        })

        it("should render Cancel button by default", () => {
            render(
                <NavigationButtons
                    onBack={() => {}}
                    onNext={() => {}}
                    onCancel={() => {}}
                />
            )

            expect(screen.getByText("Cancel")).toBeInTheDocument()
        })

        it("should not render Cancel button when showCancel is false", () => {
            render(
                <NavigationButtons
                    onBack={() => {}}
                    onNext={() => {}}
                    onCancel={() => {}}
                    showCancel={false}
                />
            )

            expect(screen.queryByText("Cancel")).not.toBeInTheDocument()
        })

        it("should not render Back button when onBack is not provided", () => {
            render(<NavigationButtons onNext={() => {}} />)

            expect(screen.queryByText("Back")).not.toBeInTheDocument()
        })

        it("should not render Next button when onNext is not provided", () => {
            render(<NavigationButtons onBack={() => {}} />)

            expect(screen.queryByText("Next")).not.toBeInTheDocument()
        })

        it("should not render Cancel button when onCancel is not provided", () => {
            render(<NavigationButtons onBack={() => {}} onNext={() => {}} />)

            expect(screen.queryByText("Cancel")).not.toBeInTheDocument()
        })
    })

    describe("Button Labels", () => {
        it("should use default Next label", () => {
            render(<NavigationButtons onNext={() => {}} />)

            expect(screen.getByText("Next")).toBeInTheDocument()
        })

        it("should use custom Next label", () => {
            render(
                <NavigationButtons
                    onNext={() => {}}
                    nextLabel="Create Account"
                />
            )

            expect(screen.getByText("Create Account")).toBeInTheDocument()
        })

        it("should use custom Next label for final step", () => {
            render(
                <NavigationButtons
                    onBack={() => {}}
                    onNext={() => {}}
                    nextLabel="Create Account"
                />
            )

            expect(screen.getByText("Create Account")).toBeInTheDocument()
        })
    })

    describe("Button Callbacks", () => {
        it("should call onBack when Back button is clicked", () => {
            const onBack = vi.fn()
            render(<NavigationButtons onBack={onBack} onNext={() => {}} />)

            const backButton = screen.getByText("Back")
            fireEvent.click(backButton)

            expect(onBack).toHaveBeenCalledTimes(1)
        })

        it("should call onNext when Next button is clicked", () => {
            const onNext = vi.fn()
            render(<NavigationButtons onBack={() => {}} onNext={onNext} />)

            const nextButton = screen.getByText("Next")
            fireEvent.click(nextButton)

            expect(onNext).toHaveBeenCalledTimes(1)
        })

        it("should call onCancel when Cancel button is clicked", () => {
            const onCancel = vi.fn()
            render(
                <NavigationButtons
                    onBack={() => {}}
                    onNext={() => {}}
                    onCancel={onCancel}
                />
            )

            const cancelButton = screen.getByText("Cancel")
            fireEvent.click(cancelButton)

            expect(onCancel).toHaveBeenCalledTimes(1)
        })

        it("should not call callbacks when buttons are disabled", () => {
            const onBack = vi.fn()
            const onNext = vi.fn()

            render(
                <NavigationButtons
                    onBack={onBack}
                    onNext={onNext}
                    backDisabled={true}
                    nextDisabled={true}
                />
            )

            const backButton = screen.getByText("Back")
            const nextButton = screen.getByText("Next")

            fireEvent.click(backButton)
            fireEvent.click(nextButton)

            expect(onBack).not.toHaveBeenCalled()
            expect(onNext).not.toHaveBeenCalled()
        })
    })

    describe("Disabled State", () => {
        it("should disable Back button when backDisabled is true", () => {
            render(
                <NavigationButtons
                    onBack={() => {}}
                    onNext={() => {}}
                    backDisabled={true}
                />
            )

            const backButton = screen.getByText("Back")
            expect(backButton).toBeDisabled()
        })

        it("should disable Next button when nextDisabled is true", () => {
            render(
                <NavigationButtons
                    onBack={() => {}}
                    onNext={() => {}}
                    nextDisabled={true}
                />
            )

            const nextButton = screen.getByText("Next")
            expect(nextButton).toBeDisabled()
        })

        it("should disable all buttons when isLoading is true", () => {
            render(
                <NavigationButtons
                    onBack={() => {}}
                    onNext={() => {}}
                    onCancel={() => {}}
                    isLoading={true}
                />
            )

            const backButton = screen.getByText("Back")
            const nextButton = screen.getByText("Next")
            const cancelButton = screen.getByText("Cancel")

            expect(backButton).toBeDisabled()
            expect(nextButton).toBeDisabled()
            expect(cancelButton).toBeDisabled()
        })

        it("should enable buttons when isLoading is false", () => {
            render(
                <NavigationButtons
                    onBack={() => {}}
                    onNext={() => {}}
                    onCancel={() => {}}
                    isLoading={false}
                />
            )

            const backButton = screen.getByText("Back")
            const nextButton = screen.getByText("Next")
            const cancelButton = screen.getByText("Cancel")

            expect(backButton).not.toBeDisabled()
            expect(nextButton).not.toBeDisabled()
            expect(cancelButton).not.toBeDisabled()
        })
    })

    describe("Loading State", () => {
        it("should display loading spinner when isLoading is true", () => {
            const { container } = render(
                <NavigationButtons onNext={() => {}} isLoading={true} />
            )

            const spinner = container.querySelector(".animate-spin")
            expect(spinner).toBeInTheDocument()
        })

        it("should not display loading spinner when isLoading is false", () => {
            const { container } = render(
                <NavigationButtons onNext={() => {}} isLoading={false} />
            )

            const spinner = container.querySelector(".animate-spin")
            expect(spinner).not.toBeInTheDocument()
        })

        it("should display loading spinner only on Next button", () => {
            const { container } = render(
                <NavigationButtons
                    onBack={() => {}}
                    onNext={() => {}}
                    isLoading={true}
                />
            )

            const spinners = container.querySelectorAll(".animate-spin")
            expect(spinners.length).toBe(1)
        })
    })

    describe("Button Styling", () => {
        it("should have proper styling for Back button", () => {
            render(<NavigationButtons onBack={() => {}} onNext={() => {}} />)

            const backButton = screen.getByText("Back")
            expect(backButton).toHaveClass("border")
            expect(backButton).toHaveClass("border-gray-300")
        })

        it("should have proper styling for Next button", () => {
            render(<NavigationButtons onBack={() => {}} onNext={() => {}} />)

            const nextButton = screen.getByText("Next")
            expect(nextButton).toHaveClass("bg-blue-600")
            expect(nextButton).toHaveClass("text-white")
        })

        it("should have proper styling for Cancel button", () => {
            render(
                <NavigationButtons
                    onBack={() => {}}
                    onNext={() => {}}
                    onCancel={() => {}}
                />
            )

            const cancelButton = screen.getByText("Cancel")
            expect(cancelButton).toHaveClass("border")
            expect(cancelButton).toHaveClass("border-red-300")
        })

        it("should have hover effects on buttons", () => {
            render(<NavigationButtons onBack={() => {}} onNext={() => {}} />)

            const backButton = screen.getByText("Back")
            expect(backButton).toHaveClass("hover:bg-gray-50")

            const nextButton = screen.getByText("Next")
            expect(nextButton).toHaveClass("hover:bg-blue-700")
        })
    })

    describe("Button Layout", () => {
        it("should display buttons in correct order", () => {
            const { container } = render(
                <NavigationButtons
                    onBack={() => {}}
                    onNext={() => {}}
                    onCancel={() => {}}
                />
            )

            const buttons = container.querySelectorAll("button")
            expect(buttons.length).toBeGreaterThanOrEqual(2)
        })

        it("should have proper spacing between buttons", () => {
            const { container } = render(
                <NavigationButtons
                    onBack={() => {}}
                    onNext={() => {}}
                    onCancel={() => {}}
                />
            )

            const buttonContainer = container.querySelector(".flex.gap-3")
            expect(buttonContainer).toBeInTheDocument()
        })

        it("should have flex-1 spacer between buttons", () => {
            const { container } = render(
                <NavigationButtons
                    onBack={() => {}}
                    onNext={() => {}}
                    onCancel={() => {}}
                />
            )

            const spacer = container.querySelector(".flex-1")
            expect(spacer).toBeInTheDocument()
        })
    })

    describe("Accessibility", () => {
        it("should have accessible aria labels", () => {
            render(
                <NavigationButtons
                    onBack={() => {}}
                    onNext={() => {}}
                    onCancel={() => {}}
                />
            )

            const backButton = screen.getByLabelText("Go back to previous step")
            const cancelButton = screen.getByLabelText("Cancel registration")

            expect(backButton).toBeInTheDocument()
            expect(cancelButton).toBeInTheDocument()
        })

        it("should have proper button semantics", () => {
            render(<NavigationButtons onBack={() => {}} onNext={() => {}} />)

            const backButton = screen.getByText("Back")
            const nextButton = screen.getByText("Next")

            expect(backButton.tagName).toBe("BUTTON")
            expect(nextButton.tagName).toBe("BUTTON")
        })

        it("should have keyboard accessible buttons", () => {
            const onNext = vi.fn()
            render(<NavigationButtons onNext={onNext} />)

            const nextButton = screen.getByText("Next")
            nextButton.focus()

            expect(nextButton).toHaveFocus()
        })
    })

    describe("Edge Cases", () => {
        it("should handle all buttons disabled", () => {
            render(
                <NavigationButtons
                    onBack={() => {}}
                    onNext={() => {}}
                    onCancel={() => {}}
                    backDisabled={true}
                    nextDisabled={true}
                />
            )

            const backButton = screen.getByText("Back")
            const nextButton = screen.getByText("Next")

            expect(backButton).toBeDisabled()
            expect(nextButton).toBeDisabled()
        })

        it("should handle only Next button", () => {
            render(<NavigationButtons onNext={() => {}} />)

            expect(screen.getByText("Next")).toBeInTheDocument()
            expect(screen.queryByText("Back")).not.toBeInTheDocument()
            expect(screen.queryByText("Cancel")).not.toBeInTheDocument()
        })

        it("should handle only Back button", () => {
            render(<NavigationButtons onBack={() => {}} />)

            expect(screen.getByText("Back")).toBeInTheDocument()
            expect(screen.queryByText("Next")).not.toBeInTheDocument()
            expect(screen.queryByText("Cancel")).not.toBeInTheDocument()
        })

        it("should handle very long button labels", () => {
            render(
                <NavigationButtons
                    onNext={() => {}}
                    nextLabel="Create Account and Send Verification Email"
                />
            )

            expect(
                screen.getByText("Create Account and Send Verification Email")
            ).toBeInTheDocument()
        })
    })

    describe("State Updates", () => {
        it("should update disabled state when props change", () => {
            const { rerender } = render(
                <NavigationButtons onNext={() => {}} nextDisabled={false} />
            )

            let nextButton = screen.getByText("Next")
            expect(nextButton).not.toBeDisabled()

            rerender(
                <NavigationButtons onNext={() => {}} nextDisabled={true} />
            )

            nextButton = screen.getByText("Next")
            expect(nextButton).toBeDisabled()
        })

        it("should update loading state when props change", () => {
            const { container, rerender } = render(
                <NavigationButtons onNext={() => {}} isLoading={false} />
            )

            let spinner = container.querySelector(".animate-spin")
            expect(spinner).not.toBeInTheDocument()

            rerender(<NavigationButtons onNext={() => {}} isLoading={true} />)

            spinner = container.querySelector(".animate-spin")
            expect(spinner).toBeInTheDocument()
        })

        it("should update button label when props change", () => {
            const { rerender } = render(
                <NavigationButtons onNext={() => {}} nextLabel="Next" />
            )

            expect(screen.getByText("Next")).toBeInTheDocument()

            rerender(
                <NavigationButtons
                    onNext={() => {}}
                    nextLabel="Create Account"
                />
            )

            expect(screen.queryByText("Next")).not.toBeInTheDocument()
            expect(screen.getByText("Create Account")).toBeInTheDocument()
        })
    })
})
