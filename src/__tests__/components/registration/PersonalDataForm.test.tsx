import { PersonalDataForm } from "@/components/registration/PersonalDataForm"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

describe("PersonalDataForm Component", () => {
    // ============================================================================
    // RENDERING TESTS
    // ============================================================================

    it("renders all three input fields with labels", () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        expect(screen.getByLabelText("Full name")).toBeInTheDocument()
        expect(screen.getByText("Full Name")).toBeInTheDocument()

        expect(screen.getByLabelText("Birth date")).toBeInTheDocument()
        expect(screen.getByText("Birth Date")).toBeInTheDocument()

        expect(screen.getByLabelText("Phone number")).toBeInTheDocument()
        expect(screen.getByText("Phone Number")).toBeInTheDocument()
    })

    it("displays correct placeholder text for all fields", () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument()
        expect(screen.getByPlaceholderText("DD/MM/YYYY")).toBeInTheDocument()
        expect(
            screen.getByPlaceholderText("+1 (555) 123-4567")
        ).toBeInTheDocument()
    })

    it("displays helper text for birth date format", () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        expect(
            screen.getByText(/Format: DD\/MM\/YYYY.*You must be at least 13/)
        ).toBeInTheDocument()
    })

    it("displays helper text for phone format", () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        expect(
            screen.getByText(/Supports international formats/)
        ).toBeInTheDocument()
    })

    it("renders labels with correct htmlFor attributes", () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        const nameLabel = screen.getByText("Full Name")
        const birthDateLabel = screen.getByText("Birth Date")
        const phoneLabel = screen.getByText("Phone Number")

        expect(nameLabel).toHaveAttribute("for", "name")
        expect(birthDateLabel).toHaveAttribute("for", "birthDate")
        expect(phoneLabel).toHaveAttribute("for", "phone")
    })

    // ============================================================================
    // NAME VALIDATION DISPLAY TESTS
    // ============================================================================

    it("displays error message for empty name", async () => {
        const { rerender } = render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        // Rerender with empty name to trigger validation
        rerender(
            <PersonalDataForm
                name=""
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        // Empty name should not show error until user interacts
        expect(
            screen.queryByText(/Full name is required/)
        ).not.toBeInTheDocument()
    })

    it("displays error message for name with less than 2 characters", async () => {
        const { rerender } = render(
            <PersonalDataForm
                name="J"
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(
                screen.getByText(/Full name must be at least 2 characters/)
            ).toBeInTheDocument()
        })
    })

    it("displays error message for name with invalid characters", async () => {
        render(
            <PersonalDataForm
                name="John@Doe"
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(
                screen.getByText(
                    /Full name can only contain letters, spaces, hyphens, and apostrophes/
                )
            ).toBeInTheDocument()
        })
    })

    it("displays success message for valid name", async () => {
        render(
            <PersonalDataForm
                name="John Doe"
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(screen.getByText(/✓ Valid name/)).toBeInTheDocument()
        })
    })

    it("accepts valid names with hyphens and apostrophes", async () => {
        const validNames = ["John-Paul", "O'Brien", "Mary-Jane Watson"]

        for (const name of validNames) {
            const { unmount } = render(
                <PersonalDataForm
                    name={name}
                    birthDate=""
                    phone=""
                    onNameChange={vi.fn()}
                    onBirthDateChange={vi.fn()}
                    onPhoneChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(screen.getByText(/✓ Valid name/)).toBeInTheDocument()
            })

            unmount()
        }
    })

    it("displays name error with aria-describedby", async () => {
        render(
            <PersonalDataForm
                name="J"
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            const nameInput = screen.getByLabelText("Full name")
            expect(nameInput).toHaveAttribute("aria-describedby", "name-error")
        })
    })

    // ============================================================================
    // BIRTH DATE VALIDATION DISPLAY TESTS
    // ============================================================================

    it("displays error message for invalid birth date format", async () => {
        render(
            <PersonalDataForm
                name=""
                birthDate="01-01-1990"
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(
                screen.getByText(/Please enter a valid date \(DD\/MM\/YYYY\)/)
            ).toBeInTheDocument()
        })
    })

    it("displays error message for invalid date (32/13/2000)", async () => {
        render(
            <PersonalDataForm
                name=""
                birthDate="32/13/2000"
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(
                screen.getByText(/Please enter a valid date \(DD\/MM\/YYYY\)/)
            ).toBeInTheDocument()
        })
    })

    it("displays error message for user under 13 years old", async () => {
        // Create a date for someone 12 years old
        const today = new Date()
        const birthYear = today.getFullYear() - 12
        const birthDate = `15/03/${birthYear}`

        render(
            <PersonalDataForm
                name=""
                birthDate={birthDate}
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(
                screen.getByText(
                    /You must be at least 13 years old to register/
                )
            ).toBeInTheDocument()
        })
    })

    it("displays success message for valid birth date (13+ years old)", async () => {
        // Create a date for someone 25 years old
        const today = new Date()
        const birthYear = today.getFullYear() - 25
        const birthDate = `15/03/${birthYear}`

        render(
            <PersonalDataForm
                name=""
                birthDate={birthDate}
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(screen.getByText(/✓ Valid birth date/)).toBeInTheDocument()
        })
    })

    it("displays error for future birth date", async () => {
        // Create a date in the future
        const today = new Date()
        const futureYear = today.getFullYear() + 1
        const birthDate = `15/03/${futureYear}`

        render(
            <PersonalDataForm
                name=""
                birthDate={birthDate}
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(
                screen.getByText(/Please enter a valid date \(DD\/MM\/YYYY\)/)
            ).toBeInTheDocument()
        })
    })

    it("displays birth date error with aria-describedby", async () => {
        render(
            <PersonalDataForm
                name=""
                birthDate="32/13/2000"
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            const birthDateInput = screen.getByLabelText("Birth date")
            expect(birthDateInput).toHaveAttribute(
                "aria-describedby",
                "birthDate-error"
            )
        })
    })

    // ============================================================================
    // PHONE VALIDATION DISPLAY TESTS
    // ============================================================================

    it("displays error message for invalid phone format", async () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone="invalid"
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(
                screen.getByText(/Please enter a valid phone number/)
            ).toBeInTheDocument()
        })
    })

    it("displays error message for phone with too few digits", async () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone="+1 123"
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(
                screen.getByText(/Please enter a valid phone number/)
            ).toBeInTheDocument()
        })
    })

    it("displays success message for valid phone number", async () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone="+1 (555) 123-4567"
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(
                screen.getByText(/✓ Valid phone \(\+15551234567\)/)
            ).toBeInTheDocument()
        })
    })

    it("displays phone error with aria-describedby", async () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone="invalid"
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            const phoneInput = screen.getByLabelText("Phone number")
            expect(phoneInput).toHaveAttribute(
                "aria-describedby",
                "phone-error"
            )
        })
    })

    // ============================================================================
    // INTERNATIONAL PHONE FORMAT SUPPORT TESTS
    // ============================================================================

    it("accepts US phone format", async () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone="+1 (555) 123-4567"
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(
                screen.getByText(/✓ Valid phone \(\+15551234567\)/)
            ).toBeInTheDocument()
        })
    })

    it("accepts Brazilian phone format", async () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone="+55 11 98765-4321"
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(
                screen.getByText(/✓ Valid phone \(\+5511987654321\)/)
            ).toBeInTheDocument()
        })
    })

    it("accepts UK phone format", async () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone="+44 20 7946 0958"
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(screen.getByText(/✓ Valid phone/)).toBeInTheDocument()
        })
    })

    it("accepts phone with various formatting characters", async () => {
        const phoneFormats = [
            "+1 555 123 4567",
            "+1-555-123-4567",
            "+1(555)123-4567",
            "+15551234567",
        ]

        for (const phone of phoneFormats) {
            const { unmount } = render(
                <PersonalDataForm
                    name=""
                    birthDate=""
                    phone={phone}
                    onNameChange={vi.fn()}
                    onBirthDateChange={vi.fn()}
                    onPhoneChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(screen.getByText(/✓ Valid phone/)).toBeInTheDocument()
            })

            unmount()
        }
    })

    it("normalizes phone number to E.164 format", async () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone="+1 (555) 123-4567"
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            // Should display normalized format +15551234567
            expect(
                screen.getByText(/✓ Valid phone \(\+15551234567\)/)
            ).toBeInTheDocument()
        })
    })

    // ============================================================================
    // ERROR MESSAGE DISPLAY TESTS
    // ============================================================================

    it("displays error messages near corresponding input fields", async () => {
        render(
            <PersonalDataForm
                name="J"
                birthDate="32/13/2000"
                phone="invalid"
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            const nameError = screen.getByText(
                /Full name must be at least 2 characters/
            )
            const birthDateError = screen.getByText(
                /Please enter a valid date \(DD\/MM\/YYYY\)/
            )
            const phoneError = screen.getByText(
                /Please enter a valid phone number/
            )

            expect(nameError).toBeInTheDocument()
            expect(birthDateError).toBeInTheDocument()
            expect(phoneError).toBeInTheDocument()
        })
    })

    it("clears error messages when input becomes valid", async () => {
        const { rerender } = render(
            <PersonalDataForm
                name="J"
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(
                screen.getByText(/Full name must be at least 2 characters/)
            ).toBeInTheDocument()
        })

        // Rerender with valid name
        rerender(
            <PersonalDataForm
                name="John Doe"
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            expect(
                screen.queryByText(/Full name must be at least 2 characters/)
            ).not.toBeInTheDocument()
            expect(screen.getByText(/✓ Valid name/)).toBeInTheDocument()
        })
    })

    it("displays error messages with red styling", async () => {
        render(
            <PersonalDataForm
                name="J"
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            const nameError = screen.getByText(
                /Full name must be at least 2 characters/
            )
            expect(nameError).toHaveClass("text-red-600")
        })
    })

    it("displays success messages with green styling", async () => {
        render(
            <PersonalDataForm
                name="John Doe"
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            const successMessage = screen.getByText(/✓ Valid name/)
            expect(successMessage).toHaveClass("text-green-600")
        })
    })

    // ============================================================================
    // CALLBACK TESTS
    // ============================================================================

    it("calls onNameChange when user types name", async () => {
        const onNameChange = vi.fn()
        const user = userEvent.setup()

        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone=""
                onNameChange={onNameChange}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        const nameInput = screen.getByPlaceholderText("John Doe")
        await user.type(nameInput, "John")

        // Verify callback was called multiple times (once per character)
        expect(onNameChange).toHaveBeenCalled()
        expect(onNameChange).toHaveBeenCalledWith("J")
        expect(onNameChange).toHaveBeenCalledWith("o")
        expect(onNameChange).toHaveBeenCalledWith("h")
        expect(onNameChange).toHaveBeenCalledWith("n")
    })

    it("calls onBirthDateChange when user types birth date", async () => {
        const onBirthDateChange = vi.fn()
        const user = userEvent.setup()

        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={onBirthDateChange}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        const birthDateInput = screen.getByPlaceholderText("DD/MM/YYYY")
        await user.type(birthDateInput, "15/03/1990")

        // Verify callback was called multiple times (once per character)
        expect(onBirthDateChange).toHaveBeenCalled()
        expect(onBirthDateChange).toHaveBeenCalledWith("1")
        expect(onBirthDateChange).toHaveBeenCalledWith("5")
        expect(onBirthDateChange).toHaveBeenCalledWith("/")
    })

    it("calls onPhoneChange when user types phone", async () => {
        const onPhoneChange = vi.fn()
        const user = userEvent.setup()

        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={onPhoneChange}
                onValidationChange={vi.fn()}
            />
        )

        const phoneInput = screen.getByPlaceholderText("+1 (555) 123-4567")
        await user.type(phoneInput, "+1")

        // Verify callback was called multiple times (once per character)
        expect(onPhoneChange).toHaveBeenCalled()
        expect(onPhoneChange).toHaveBeenCalledWith("+")
        expect(onPhoneChange).toHaveBeenCalledWith("1")
    })

    it("calls onValidationChange with true when all fields are valid", async () => {
        const onValidationChange = vi.fn()

        render(
            <PersonalDataForm
                name="John Doe"
                birthDate="15/03/1990"
                phone="+1 (555) 123-4567"
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={onValidationChange}
            />
        )

        await waitFor(() => {
            expect(onValidationChange).toHaveBeenCalledWith(true)
        })
    })

    it("calls onValidationChange with false when any field is invalid", async () => {
        const onValidationChange = vi.fn()

        render(
            <PersonalDataForm
                name="J"
                birthDate="15/03/1990"
                phone="+1 (555) 123-4567"
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={onValidationChange}
            />
        )

        await waitFor(() => {
            expect(onValidationChange).toHaveBeenCalledWith(false)
        })
    })

    // ============================================================================
    // DISABLED STATE TESTS
    // ============================================================================

    it("disables all inputs when disabled prop is true", () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
                disabled={true}
            />
        )

        const nameInput = screen.getByPlaceholderText("John Doe")
        const birthDateInput = screen.getByPlaceholderText("DD/MM/YYYY")
        const phoneInput = screen.getByPlaceholderText("+1 (555) 123-4567")

        expect(nameInput).toBeDisabled()
        expect(birthDateInput).toBeDisabled()
        expect(phoneInput).toBeDisabled()
    })

    it("enables all inputs when disabled prop is false", () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
                disabled={false}
            />
        )

        const nameInput = screen.getByPlaceholderText("John Doe")
        const birthDateInput = screen.getByPlaceholderText("DD/MM/YYYY")
        const phoneInput = screen.getByPlaceholderText("+1 (555) 123-4567")

        expect(nameInput).not.toBeDisabled()
        expect(birthDateInput).not.toBeDisabled()
        expect(phoneInput).not.toBeDisabled()
    })

    // ============================================================================
    // ACCESSIBILITY TESTS
    // ============================================================================

    it("has proper aria attributes for all inputs", () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        const nameInput = screen.getByLabelText("Full name")
        const birthDateInput = screen.getByLabelText("Birth date")
        const phoneInput = screen.getByLabelText("Phone number")

        expect(nameInput).toHaveAttribute("type", "text")
        expect(birthDateInput).toHaveAttribute("type", "text")
        expect(phoneInput).toHaveAttribute("type", "tel")
    })

    it("associates labels with inputs using htmlFor", () => {
        render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        const nameLabel = screen.getByText("Full Name")
        const birthDateLabel = screen.getByText("Birth Date")
        const phoneLabel = screen.getByText("Phone Number")

        expect(nameLabel).toHaveAttribute("for", "name")
        expect(birthDateLabel).toHaveAttribute("for", "birthDate")
        expect(phoneLabel).toHaveAttribute("for", "phone")
    })

    // ============================================================================
    // STYLING TESTS
    // ============================================================================

    it("renders with correct wrapper styling", () => {
        const { container } = render(
            <PersonalDataForm
                name=""
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        const wrapper = container.querySelector(".w-full.space-y-4")
        expect(wrapper).toBeInTheDocument()
    })

    it("applies error styling to input when validation fails", async () => {
        render(
            <PersonalDataForm
                name="J"
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            const nameInput = screen.getByPlaceholderText("John Doe")
            expect(nameInput).toHaveClass("border-red-500")
        })
    })

    it("applies success styling to input when validation passes", async () => {
        render(
            <PersonalDataForm
                name="John Doe"
                birthDate=""
                phone=""
                onNameChange={vi.fn()}
                onBirthDateChange={vi.fn()}
                onPhoneChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        await waitFor(() => {
            const nameInput = screen.getByPlaceholderText("John Doe")
            expect(nameInput).toHaveClass("border-green-500")
        })
    })
})
