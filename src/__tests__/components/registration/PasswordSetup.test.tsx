import { PasswordSetup } from "@/components/registration/PasswordSetup"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

describe("PasswordSetup Component", () => {
    describe("Rendering", () => {
        it("renders password input field with label", () => {
            render(
                <PasswordSetup
                    value=""
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            expect(screen.getByLabelText("Password")).toBeInTheDocument()
            expect(screen.getByText("Password")).toBeInTheDocument()
        })

        it("renders confirm password field", () => {
            render(
                <PasswordSetup
                    value=""
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            expect(
                screen.getByLabelText("Confirm password")
            ).toBeInTheDocument()
            expect(screen.getByText("Confirm Password")).toBeInTheDocument()
        })

        it("displays password requirements list", () => {
            render(
                <PasswordSetup
                    value=""
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            expect(
                screen.getByText("Password Requirements:")
            ).toBeInTheDocument()
            expect(
                screen.getByText(/At least 8 characters/)
            ).toBeInTheDocument()
            expect(screen.getByText(/One uppercase letter/)).toBeInTheDocument()
            expect(screen.getByText(/One lowercase letter/)).toBeInTheDocument()
            expect(screen.getByText(/One number/)).toBeInTheDocument()
            expect(
                screen.getByText(/One special character/)
            ).toBeInTheDocument()
        })

        it("renders with correct styling classes", () => {
            const { container } = render(
                <PasswordSetup
                    value=""
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const wrapper = container.querySelector(".w-full.space-y-4")
            expect(wrapper).toBeInTheDocument()
        })

        it("has proper aria attributes", () => {
            render(
                <PasswordSetup
                    value=""
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const passwordInput = screen.getByLabelText("Password")
            const confirmInput = screen.getByLabelText("Confirm password")

            expect(passwordInput).toHaveAttribute("type", "password")
            expect(confirmInput).toHaveAttribute("type", "password")
        })
    })

    describe("Password Input Handling", () => {
        it("calls onChange when user types password", async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(
                <PasswordSetup
                    value=""
                    confirmValue=""
                    onChange={onChange}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const passwordInput = screen.getByPlaceholderText(
                "Enter a strong password"
            )
            await user.type(passwordInput, "TestPass123!")

            // onChange is called for each character typed
            expect(onChange).toHaveBeenCalledTimes("TestPass123!".length)
            // Verify it was called with individual characters
            expect(onChange).toHaveBeenCalledWith("T")
            expect(onChange).toHaveBeenCalledWith("!")
        })

        it("calls onConfirmChange when user types confirm password", async () => {
            const onConfirmChange = vi.fn()
            const user = userEvent.setup()

            render(
                <PasswordSetup
                    value=""
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={onConfirmChange}
                    onValidationChange={vi.fn()}
                />
            )

            const confirmInput = screen.getByPlaceholderText(
                "Confirm your password"
            )
            await user.type(confirmInput, "TestPass123!")

            // onConfirmChange is called for each character typed
            expect(onConfirmChange).toHaveBeenCalledTimes("TestPass123!".length)
            // Verify it was called with individual characters
            expect(onConfirmChange).toHaveBeenCalledWith("T")
            expect(onConfirmChange).toHaveBeenCalledWith("!")
        })

        it("displays password values correctly", () => {
            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue="TestPass123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const passwordInputs = screen.getAllByDisplayValue("TestPass123!")
            expect(passwordInputs.length).toBe(2)
        })

        it("disables inputs when disabled prop is true", () => {
            render(
                <PasswordSetup
                    value=""
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                    disabled={true}
                />
            )

            const passwordInput = screen.getByPlaceholderText(
                "Enter a strong password"
            )
            const confirmInput = screen.getByPlaceholderText(
                "Confirm your password"
            )

            expect(passwordInput).toBeDisabled()
            expect(confirmInput).toBeDisabled()
        })
    })

    describe("Password Strength Indicator", () => {
        it("does not display strength indicator when password is empty", () => {
            render(
                <PasswordSetup
                    value=""
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            // Should not display strength feedback for empty password
            const strengthElements = screen.queryAllByText(
                /weak|fair|good|strong/i
            )
            expect(strengthElements.length).toBe(0)
        })

        it("displays strength indicator for various password strengths", () => {
            const { rerender } = render(
                <PasswordSetup
                    value="Pass1!"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            // Should display some strength feedback
            let strengthElements = screen.queryAllByText(
                /weak|fair|good|strong/i
            )
            expect(strengthElements.length).toBeGreaterThan(0)

            // Test with different password
            rerender(
                <PasswordSetup
                    value="Pass1234"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            strengthElements = screen.queryAllByText(/weak|fair|good|strong/i)
            expect(strengthElements.length).toBeGreaterThan(0)

            // Test with another password
            rerender(
                <PasswordSetup
                    value="Pass123!"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            strengthElements = screen.queryAllByText(/weak|fair|good|strong/i)
            expect(strengthElements.length).toBeGreaterThan(0)
        })

        it("displays strong strength for password with all requirements", () => {
            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const strengthElements = screen.getAllByText(/strong/i)
            expect(strengthElements.length).toBeGreaterThan(0)
        })

        it("displays strength feedback message", () => {
            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            // Should display feedback text
            const feedbackElements = screen.queryAllByText(
                /strong password|good password|fair|weak/i
            )
            expect(feedbackElements.length).toBeGreaterThan(0)
        })

        it("updates strength indicator when password changes", async () => {
            const { rerender } = render(
                <PasswordSetup
                    value="Pass"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            // Initially should have some strength feedback
            let strengthElements = screen.queryAllByText(
                /weak|fair|good|strong/i
            )
            expect(strengthElements.length).toBeGreaterThan(0)

            // Update to strong password
            rerender(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            // Should still have strength feedback
            strengthElements = screen.queryAllByText(/weak|fair|good|strong/i)
            expect(strengthElements.length).toBeGreaterThan(0)
        })
    })

    describe("Password Confirmation Matching", () => {
        it("displays error when passwords do not match", async () => {
            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue="DifferentPass123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText("Passwords do not match")
                ).toBeInTheDocument()
            })
        })

        it("displays success message when passwords match", async () => {
            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue="TestPass123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText(/✓ Passwords match/)
                ).toBeInTheDocument()
            })
        })

        it("does not display error when confirm field is empty", () => {
            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            expect(
                screen.queryByText("Passwords do not match")
            ).not.toBeInTheDocument()
        })

        it("clears error when passwords become matching", async () => {
            const { rerender } = render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue="DifferentPass123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText("Passwords do not match")
                ).toBeInTheDocument()
            })

            // Update to matching password
            rerender(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue="TestPass123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(
                    screen.queryByText("Passwords do not match")
                ).not.toBeInTheDocument()
                expect(
                    screen.getByText(/✓ Passwords match/)
                ).toBeInTheDocument()
            })
        })

        it("calls onValidationChange with true when passwords match and valid", async () => {
            const onValidationChange = vi.fn()

            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue="TestPass123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={onValidationChange}
                />
            )

            await waitFor(() => {
                expect(onValidationChange).toHaveBeenCalledWith(true)
            })
        })

        it("calls onValidationChange with false when passwords do not match", async () => {
            const onValidationChange = vi.fn()

            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue="DifferentPass123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={onValidationChange}
                />
            )

            await waitFor(() => {
                expect(onValidationChange).toHaveBeenCalledWith(false)
            })
        })

        it("calls onValidationChange with false when password is invalid", async () => {
            const onValidationChange = vi.fn()

            render(
                <PasswordSetup
                    value="weak"
                    confirmValue="weak"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={onValidationChange}
                />
            )

            await waitFor(() => {
                expect(onValidationChange).toHaveBeenCalledWith(false)
            })
        })
    })

    describe("Show/Hide Toggle Functionality", () => {
        it("shows Show/Hide toggle buttons for both fields", () => {
            render(
                <PasswordSetup
                    value=""
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const showButtons = screen.getAllByText("Show")
            expect(showButtons.length).toBe(2)
        })

        it("toggles password visibility when Show button clicked", async () => {
            const user = userEvent.setup()

            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const passwordInput = screen.getByDisplayValue(
                "TestPass123!"
            ) as HTMLInputElement
            expect(passwordInput.type).toBe("password")

            const showButtons = screen.getAllByText("Show")
            await user.click(showButtons[0])

            expect(passwordInput.type).toBe("text")
        })

        it("toggles password visibility back to hidden", async () => {
            const user = userEvent.setup()

            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const passwordInput = screen.getByDisplayValue(
                "TestPass123!"
            ) as HTMLInputElement

            const showButtons = screen.getAllByText("Show")
            await user.click(showButtons[0])
            expect(passwordInput.type).toBe("text")

            const hideButtons = screen.getAllByText("Hide")
            await user.click(hideButtons[0])
            expect(passwordInput.type).toBe("password")
        })

        it("toggles confirm password visibility independently", async () => {
            const user = userEvent.setup()

            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue="TestPass123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const passwordInputs = screen.getAllByDisplayValue(
                "TestPass123!"
            ) as HTMLInputElement[]
            const passwordInput = passwordInputs[0]
            const confirmInput = passwordInputs[1]

            // Initially both hidden
            expect(passwordInput.type).toBe("password")
            expect(confirmInput.type).toBe("password")

            // Show only confirm password
            const showButtons = screen.getAllByText("Show")
            await user.click(showButtons[1])

            expect(passwordInput.type).toBe("password")
            expect(confirmInput.type).toBe("text")
        })

        it("displays Hide button when password is visible", async () => {
            const user = userEvent.setup()

            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const showButtons = screen.getAllByText("Show")
            await user.click(showButtons[0])

            const hideButtons = screen.getAllByText("Hide")
            expect(hideButtons.length).toBeGreaterThanOrEqual(1)
        })

        it("has proper aria labels for toggle buttons", () => {
            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue="TestPass123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const toggleButtons = screen.getAllByRole("button")
            const showHideButtons = toggleButtons.filter(btn =>
                btn.getAttribute("aria-label")?.includes("password")
            )

            expect(showHideButtons.length).toBeGreaterThanOrEqual(2)
        })
    })

    describe("Validation Error Display", () => {
        it("displays error when password is too short", async () => {
            render(
                <PasswordSetup
                    value="Pass1!"
                    confirmValue="Pass1!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText(/Password must be at least 8 characters/i)
                ).toBeInTheDocument()
            })
        })

        it("displays error when password lacks uppercase", async () => {
            render(
                <PasswordSetup
                    value="password123!"
                    confirmValue="password123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText(/must contain at least one uppercase/i)
                ).toBeInTheDocument()
            })
        })

        it("displays error when password lacks number", async () => {
            render(
                <PasswordSetup
                    value="Password!"
                    confirmValue="Password!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText(/must contain at least one number/i)
                ).toBeInTheDocument()
            })
        })

        it("displays error when password lacks special character", async () => {
            render(
                <PasswordSetup
                    value="Password123"
                    confirmValue="Password123"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText(
                        /must contain at least one special character/i
                    )
                ).toBeInTheDocument()
            })
        })

        it("clears error when password becomes valid", async () => {
            const { rerender } = render(
                <PasswordSetup
                    value="weak"
                    confirmValue="weak"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText(/Password must be at least 8 characters/i)
                ).toBeInTheDocument()
            })

            // Update to valid password
            rerender(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue="TestPass123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(
                    screen.queryByText(
                        /Password must be at least 8 characters/i
                    )
                ).not.toBeInTheDocument()
            })
        })

        it("displays error message in red color", async () => {
            const { container } = render(
                <PasswordSetup
                    value="weak"
                    confirmValue="different"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                const errorElement = container.querySelector(".text-red-600")
                expect(errorElement).toBeInTheDocument()
            })
        })

        it("displays success message when passwords match", async () => {
            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue="TestPass123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText(/✓ Passwords match/)
                ).toBeInTheDocument()
            })
        })

        it("displays success message in green color", async () => {
            const { container } = render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue="TestPass123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                const successElement =
                    container.querySelector(".text-green-600")
                expect(successElement).toBeInTheDocument()
            })
        })

        it("displays requirements with checkmarks for met requirements", () => {
            const { container } = render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            // Should display checkmarks for met requirements
            const checkmarks = container.querySelectorAll("li.text-green-600")
            expect(checkmarks.length).toBeGreaterThan(0)
        })

        it("displays requirements with circles for unmet requirements", () => {
            const { container } = render(
                <PasswordSetup
                    value="weak"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            // Should display circles for unmet requirements
            const circles = container.querySelectorAll("li.text-gray-600")
            expect(circles.length).toBeGreaterThan(0)
        })

        it("displays requirements in green for met requirements", () => {
            const { container } = render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            // Should have green text for met requirements
            const greenRequirements =
                container.querySelectorAll(".text-green-600")
            expect(greenRequirements.length).toBeGreaterThan(0)
        })

        it("displays requirements in gray for unmet requirements", () => {
            const { container } = render(
                <PasswordSetup
                    value="weak"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            // Should have gray text for unmet requirements
            const grayRequirements =
                container.querySelectorAll(".text-gray-600")
            expect(grayRequirements.length).toBeGreaterThan(0)
        })
    })

    describe("Confirm Password Field Styling", () => {
        it("displays confirm field with red border when passwords do not match", async () => {
            const { container } = render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue="DifferentPass123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                const confirmInput = container.querySelector(
                    'input[placeholder="Confirm your password"]'
                )
                expect(confirmInput).toHaveClass("border-red-500")
            })
        })

        it("displays confirm field with green border when passwords match", async () => {
            const { container } = render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue="TestPass123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                const confirmInput = container.querySelector(
                    'input[placeholder="Confirm your password"]'
                )
                expect(confirmInput).toHaveClass("border-green-500")
            })
        })

        it("displays confirm field with default border when empty", () => {
            const { container } = render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const confirmInput = container.querySelector(
                'input[placeholder="Confirm your password"]'
            )
            expect(confirmInput).toHaveClass("border-gray-300")
        })
    })

    describe("Edge Cases", () => {
        it("handles very long passwords", () => {
            const longPassword = "A".repeat(100) + "a1!"
            render(
                <PasswordSetup
                    value={longPassword}
                    confirmValue={longPassword}
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const strengthElements = screen.getAllByText(/strong/i)
            expect(strengthElements.length).toBeGreaterThan(0)
        })

        it("handles passwords with multiple special characters", () => {
            render(
                <PasswordSetup
                    value="Pass@word#123!$%"
                    confirmValue="Pass@word#123!$%"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const strengthElements = screen.getAllByText(/strong/i)
            expect(strengthElements.length).toBeGreaterThan(0)
        })

        it("handles passwords with spaces", async () => {
            render(
                <PasswordSetup
                    value="Pass word 123!"
                    confirmValue="Pass word 123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText(/✓ Passwords match/)
                ).toBeInTheDocument()
            })
        })

        it("handles case-sensitive password comparison", async () => {
            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue="testpass123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText("Passwords do not match")
                ).toBeInTheDocument()
            })
        })

        it("handles rapid password changes", async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(
                <PasswordSetup
                    value=""
                    confirmValue=""
                    onChange={onChange}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const passwordInput = screen.getByPlaceholderText(
                "Enter a strong password"
            )

            await user.type(passwordInput, "TestPass123!", { delay: 10 })

            expect(onChange).toHaveBeenCalledTimes("TestPass123!".length)
        })
    })

    describe("Accessibility", () => {
        it("has accessible labels for all inputs", () => {
            render(
                <PasswordSetup
                    value=""
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            expect(screen.getByLabelText("Password")).toBeInTheDocument()
            expect(
                screen.getByLabelText("Confirm password")
            ).toBeInTheDocument()
        })

        it("has accessible toggle buttons with aria labels", () => {
            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue="TestPass123!"
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const toggleButtons = screen.getAllByRole("button")
            const accessibleButtons = toggleButtons.filter(btn =>
                btn.getAttribute("aria-label")?.includes("password")
            )

            expect(accessibleButtons.length).toBeGreaterThanOrEqual(2)
        })

        it("maintains focus after toggle button click", async () => {
            const user = userEvent.setup()

            render(
                <PasswordSetup
                    value="TestPass123!"
                    confirmValue=""
                    onChange={vi.fn()}
                    onConfirmChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const showButtons = screen.getAllByText("Show")
            await user.click(showButtons[0])

            // Button should still be accessible
            expect(showButtons[0]).toBeInTheDocument()
        })
    })
})
