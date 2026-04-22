import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GoogleOAuthPersonalInfo } from "./GoogleOAuthPersonalInfo"

describe("GoogleOAuthPersonalInfo", () => {
    const mockOnComplete = vi.fn()
    const mockOnBack = vi.fn()

    const defaultProps = {
        googleEmail: "john.doe@gmail.com",
        googleName: "John Doe",
        onComplete: mockOnComplete,
        onBack: mockOnBack,
    }

    beforeEach(() => {
        mockOnComplete.mockClear()
        mockOnBack.mockClear()
    })

    describe("Rendering", () => {
        it("should render the component with all fields", () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            expect(
                screen.getByText("Complete Your Profile")
            ).toBeInTheDocument()
            expect(screen.getByLabelText("Full Name")).toBeInTheDocument()
            expect(screen.getByLabelText("Birth Date")).toBeInTheDocument()
            expect(screen.getByLabelText("Phone Number")).toBeInTheDocument()
        })

        it("should pre-fill the full name field with Google name", () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const nameInput = screen.getByLabelText(
                "Full Name"
            ) as HTMLInputElement
            expect(nameInput.value).toBe("John Doe")
        })

        it("should display the correct placeholder texts", () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument()
            expect(
                screen.getByPlaceholderText("DD/MM/YYYY")
            ).toBeInTheDocument()
            expect(
                screen.getByPlaceholderText("+1 (555) 123-4567")
            ).toBeInTheDocument()
        })

        it("should display Next and Back buttons", () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            expect(
                screen.getByRole("button", { name: /Next/i })
            ).toBeInTheDocument()
            expect(
                screen.getByRole("button", { name: /Back/i })
            ).toBeInTheDocument()
        })

        it("should display help text for each field", () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            expect(
                screen.getByText(/Pre-filled from your Google account/i)
            ).toBeInTheDocument()
            expect(
                screen.getByText(/Format: DD\/MM\/YYYY/i)
            ).toBeInTheDocument()
            expect(
                screen.getByText(/Supports international formats/i)
            ).toBeInTheDocument()
        })
    })

    describe("Full Name Validation", () => {
        it("should show error when name is empty", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const nameInput = screen.getByLabelText("Full Name")
            await userEvent.clear(nameInput)
            await userEvent.type(nameInput, " ")
            fireEvent.blur(nameInput)

            await waitFor(() => {
                expect(
                    screen.getByText(/Full name is required/i)
                ).toBeInTheDocument()
            })
        })

        it("should show error when name is less than 2 characters", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const nameInput = screen.getByLabelText("Full Name")
            await userEvent.clear(nameInput)
            await userEvent.type(nameInput, "J")

            await waitFor(() => {
                expect(
                    screen.getByText(/Full name must be at least 2 characters/i)
                ).toBeInTheDocument()
            })
        })

        it("should show success when name is valid", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const nameInput = screen.getByLabelText("Full Name")
            await userEvent.clear(nameInput)
            await userEvent.type(nameInput, "Jane Smith")

            await waitFor(() => {
                expect(screen.getByText(/✓ Valid name/i)).toBeInTheDocument()
            })
        })

        it("should allow editing of pre-filled name", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const nameInput = screen.getByLabelText(
                "Full Name"
            ) as HTMLInputElement
            expect(nameInput.value).toBe("John Doe")

            await userEvent.clear(nameInput)
            await userEvent.type(nameInput, "Jane Smith")

            expect(nameInput.value).toBe("Jane Smith")
        })

        it("should accept names with hyphens and apostrophes", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const nameInput = screen.getByLabelText("Full Name")
            await userEvent.clear(nameInput)
            await userEvent.type(nameInput, "Marie-Claire O'Brien")

            await waitFor(() => {
                expect(screen.getByText(/✓ Valid name/i)).toBeInTheDocument()
            })
        })
    })

    describe("Birth Date Validation", () => {
        it("should show error when birth date format is invalid", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const birthDateInput = screen.getByLabelText("Birth Date")
            await userEvent.type(birthDateInput, "2000-01-01")

            await waitFor(() => {
                expect(
                    screen.getByText(/Please enter a valid date/i)
                ).toBeInTheDocument()
            })
        })

        it("should show error when user is less than 13 years old", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const birthDateInput = screen.getByLabelText("Birth Date")
            const today = new Date()
            const tooYoung = new Date(
                today.getFullYear() - 10,
                today.getMonth(),
                today.getDate()
            )
            const formattedDate = `${String(tooYoung.getDate()).padStart(2, "0")}/${String(tooYoung.getMonth() + 1).padStart(2, "0")}/${tooYoung.getFullYear()}`

            await userEvent.type(birthDateInput, formattedDate)

            await waitFor(() => {
                expect(
                    screen.getByText(
                        /You must be at least 13 years old to register/i
                    )
                ).toBeInTheDocument()
            })
        })

        it("should show success when birth date is valid", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const birthDateInput = screen.getByLabelText("Birth Date")
            await userEvent.type(birthDateInput, "15/03/1990")

            await waitFor(() => {
                expect(
                    screen.getByText(/✓ Valid birth date/i)
                ).toBeInTheDocument()
            })
        })

        it("should accept valid DD/MM/YYYY format", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const birthDateInput = screen.getByLabelText("Birth Date")
            await userEvent.type(birthDateInput, "01/01/2000")

            await waitFor(() => {
                expect(
                    screen.getByText(/✓ Valid birth date/i)
                ).toBeInTheDocument()
            })
        })
    })

    describe("Phone Number Validation", () => {
        it("should show error when phone format is invalid", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const phoneInput = screen.getByLabelText("Phone Number")
            await userEvent.type(phoneInput, "123")

            await waitFor(() => {
                expect(
                    screen.getByText(/Please enter a valid phone number/i)
                ).toBeInTheDocument()
            })
        })

        it("should show success when phone is valid", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const phoneInput = screen.getByLabelText("Phone Number")
            await userEvent.type(phoneInput, "+1 (555) 123-4567")

            await waitFor(() => {
                expect(screen.getByText(/✓ Valid phone/i)).toBeInTheDocument()
            })
        })

        it("should support international phone formats", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const phoneInput = screen.getByLabelText("Phone Number")
            await userEvent.type(phoneInput, "+55 11 98765-4321")

            await waitFor(() => {
                expect(screen.getByText(/✓ Valid phone/i)).toBeInTheDocument()
            })
        })

        it("should display normalized phone number", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const phoneInput = screen.getByLabelText("Phone Number")
            await userEvent.type(phoneInput, "+1 (555) 123-4567")

            await waitFor(() => {
                expect(
                    screen.getByText(/✓ Valid phone \(\+1/)
                ).toBeInTheDocument()
            })
        })
    })

    describe("Form Validation", () => {
        it("should disable Next button when form is invalid", () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const nextButton = screen.getByRole("button", { name: /Next/i })
            expect(nextButton).toBeDisabled()
        })

        it("should enable Next button when all fields are valid", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const birthDateInput = screen.getByLabelText("Birth Date")
            const phoneInput = screen.getByLabelText("Phone Number")

            await userEvent.type(birthDateInput, "15/03/1990")
            await userEvent.type(phoneInput, "+1 (555) 123-4567")

            await waitFor(() => {
                const nextButton = screen.getByRole("button", { name: /Next/i })
                expect(nextButton).not.toBeDisabled()
            })
        })

        it("should disable Next button when name is invalid", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const nameInput = screen.getByLabelText("Full Name")
            const birthDateInput = screen.getByLabelText("Birth Date")
            const phoneInput = screen.getByLabelText("Phone Number")

            await userEvent.clear(nameInput)
            await userEvent.type(nameInput, "J")
            await userEvent.type(birthDateInput, "15/03/1990")
            await userEvent.type(phoneInput, "+1 (555) 123-4567")

            await waitFor(() => {
                const nextButton = screen.getByRole("button", { name: /Next/i })
                expect(nextButton).toBeDisabled()
            })
        })

        it("should disable Next button when birth date is invalid", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const birthDateInput = screen.getByLabelText("Birth Date")
            const phoneInput = screen.getByLabelText("Phone Number")

            await userEvent.type(birthDateInput, "invalid")
            await userEvent.type(phoneInput, "+1 (555) 123-4567")

            await waitFor(() => {
                const nextButton = screen.getByRole("button", { name: /Next/i })
                expect(nextButton).toBeDisabled()
            })
        })

        it("should disable Next button when phone is invalid", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const birthDateInput = screen.getByLabelText("Birth Date")
            const phoneInput = screen.getByLabelText("Phone Number")

            await userEvent.type(birthDateInput, "15/03/1990")
            await userEvent.type(phoneInput, "123")

            await waitFor(() => {
                const nextButton = screen.getByRole("button", { name: /Next/i })
                expect(nextButton).toBeDisabled()
            })
        })
    })

    describe("Button Actions", () => {
        it("should call onComplete with correct data when Next is clicked", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const birthDateInput = screen.getByLabelText("Birth Date")
            const phoneInput = screen.getByLabelText("Phone Number")

            await userEvent.type(birthDateInput, "15/03/1990")
            await userEvent.type(phoneInput, "+1 (555) 123-4567")

            await waitFor(() => {
                const nextButton = screen.getByRole("button", { name: /Next/i })
                expect(nextButton).not.toBeDisabled()
            })

            const nextButton = screen.getByRole("button", { name: /Next/i })
            fireEvent.click(nextButton)

            expect(mockOnComplete).toHaveBeenCalledWith({
                email: "john.doe@gmail.com",
                fullName: "John Doe",
                birthDate: "15/03/1990",
                phone: expect.stringContaining("+1"),
            })
        })

        it("should call onBack when Back button is clicked", () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const backButton = screen.getByRole("button", { name: /Back/i })
            fireEvent.click(backButton)

            expect(mockOnBack).toHaveBeenCalled()
        })

        it("should not call onComplete when Next is clicked with invalid data", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const nextButton = screen.getByRole("button", { name: /Next/i })
            fireEvent.click(nextButton)

            expect(mockOnComplete).not.toHaveBeenCalled()
        })
    })

    describe("Accessibility", () => {
        it("should have proper ARIA labels", () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            expect(screen.getByLabelText("Full Name")).toHaveAttribute(
                "aria-label",
                "Full name"
            )
            expect(screen.getByLabelText("Birth Date")).toHaveAttribute(
                "aria-label",
                "Birth date"
            )
            expect(screen.getByLabelText("Phone Number")).toHaveAttribute(
                "aria-label",
                "Phone number"
            )
        })

        it("should have ARIA descriptions for error messages", async () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const nameInput = screen.getByLabelText("Full Name")
            await userEvent.clear(nameInput)
            await userEvent.type(nameInput, "J")

            await waitFor(() => {
                expect(nameInput).toHaveAttribute(
                    "aria-describedby",
                    "fullName-error"
                )
            })
        })

        it("should have proper button labels", () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            expect(
                screen.getByRole("button", { name: /Proceed to next step/i })
            ).toBeInTheDocument()
            expect(
                screen.getByRole("button", {
                    name: /Go back to previous step/i,
                })
            ).toBeInTheDocument()
        })
    })

    describe("Responsive Design", () => {
        it("should render with proper spacing on all viewports", () => {
            const { container } = render(
                <GoogleOAuthPersonalInfo {...defaultProps} />
            )

            const mainDiv = container.querySelector(".w-full.space-y-6")
            expect(mainDiv).toBeInTheDocument()
        })

        it("should have full-width inputs", () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const inputs = screen.getAllByRole("textbox")
            inputs.forEach(input => {
                expect(input).toHaveClass("w-full")
            })
        })

        it("should have full-width buttons", () => {
            render(<GoogleOAuthPersonalInfo {...defaultProps} />)

            const buttons = screen.getAllByRole("button")
            buttons.forEach(button => {
                expect(button).toHaveClass("w-full")
            })
        })
    })

    describe("Dark Theme Styling", () => {
        it("should use dark theme colors", () => {
            const { container } = render(
                <GoogleOAuthPersonalInfo {...defaultProps} />
            )

            const inputs = container.querySelectorAll("input")
            inputs.forEach(input => {
                expect(input).toHaveClass("bg-gray-800")
                expect(input).toHaveClass("text-white")
            })
        })

        it("should use blue focus ring", () => {
            const { container } = render(
                <GoogleOAuthPersonalInfo {...defaultProps} />
            )

            const inputs = container.querySelectorAll("input")
            inputs.forEach(input => {
                // Check that input has focus:ring classes (can be blue, green, or red depending on validation state)
                expect(input.className).toMatch(
                    /focus:ring-(blue|green|red)-500/
                )
            })
        })
    })
})
