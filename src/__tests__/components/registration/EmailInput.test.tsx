import { EmailInput } from "@/components/registration/EmailInput"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock fetch
global.fetch = vi.fn()

describe("EmailInput Component", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        ;(global.fetch as any).mockClear()
    })

    describe("Rendering", () => {
        it("renders email input field with label", () => {
            render(
                <EmailInput
                    value=""
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            expect(screen.getByLabelText("Email address")).toBeInTheDocument()
            expect(screen.getByText("Email Address")).toBeInTheDocument()
        })

        it("displays placeholder text", () => {
            render(
                <EmailInput
                    value=""
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const input = screen.getByPlaceholderText("you@example.com")
            expect(input).toBeInTheDocument()
        })

        it("displays the provided value", () => {
            render(
                <EmailInput
                    value="test@example.com"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const input = screen.getByDisplayValue("test@example.com")
            expect(input).toBeInTheDocument()
        })

        it("renders label with correct htmlFor attribute", () => {
            render(
                <EmailInput
                    value=""
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const label = screen.getByText("Email Address")
            expect(label).toHaveAttribute("for", "email")
        })

        it("renders with correct styling classes", () => {
            const { container } = render(
                <EmailInput
                    value=""
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const wrapper = container.querySelector(".w-full")
            expect(wrapper).toBeInTheDocument()
        })

        it("has proper aria attributes", () => {
            render(
                <EmailInput
                    value=""
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            const input = screen.getByLabelText("Email address")
            expect(input).toHaveAttribute("type", "email")
            expect(input).toHaveAttribute("placeholder", "you@example.com")
        })
    })

    describe("User Interactions", () => {
        it("calls onChange when user types", async () => {
            const onChange = vi.fn()
            const user = userEvent.setup()

            render(
                <EmailInput
                    value=""
                    onChange={onChange}
                    onValidationChange={vi.fn()}
                />
            )

            const input = screen.getByPlaceholderText("you@example.com")
            await user.type(input, "test")

            // Verify onChange was called multiple times (once per character)
            expect(onChange).toHaveBeenCalled()
            expect(onChange.mock.calls.length).toBeGreaterThan(0)
        })

        it("disables input when disabled prop is true", () => {
            render(
                <EmailInput
                    value=""
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                    disabled={true}
                />
            )

            const input = screen.getByPlaceholderText("you@example.com")
            expect(input).toBeDisabled()
        })

        it("accepts valid email values", () => {
            const validEmails = [
                "user@example.com",
                "user.name@example.com",
                "user+tag@example.co.uk",
            ]

            for (const email of validEmails) {
                const { unmount } = render(
                    <EmailInput
                        value={email}
                        onChange={vi.fn()}
                        onValidationChange={vi.fn()}
                    />
                )

                const input = screen.getByDisplayValue(email)
                expect(input).toBeInTheDocument()

                unmount()
            }
        })
    })

    describe("Email Format Validation Display", () => {
        it("displays error message for invalid email format", async () => {
            const onValidationChange = vi.fn()

            render(
                <EmailInput
                    value="invalid-email"
                    onChange={vi.fn()}
                    onValidationChange={onValidationChange}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText("Invalid email format")
                ).toBeInTheDocument()
            })

            expect(onValidationChange).toHaveBeenCalledWith(false)
        })

        it("clears error message when email becomes valid", async () => {
            const onValidationChange = vi.fn()
            const { rerender } = render(
                <EmailInput
                    value="invalid"
                    onChange={vi.fn()}
                    onValidationChange={onValidationChange}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText("Invalid email format")
                ).toBeInTheDocument()
            })

            rerender(
                <EmailInput
                    value="valid@example.com"
                    onChange={vi.fn()}
                    onValidationChange={onValidationChange}
                />
            )

            await waitFor(() => {
                expect(
                    screen.queryByText("Invalid email format")
                ).not.toBeInTheDocument()
            })
        })

        it("clears error when email is empty", async () => {
            const onValidationChange = vi.fn()
            const { rerender } = render(
                <EmailInput
                    value="invalid"
                    onChange={vi.fn()}
                    onValidationChange={onValidationChange}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText("Invalid email format")
                ).toBeInTheDocument()
            })

            rerender(
                <EmailInput
                    value=""
                    onChange={vi.fn()}
                    onValidationChange={onValidationChange}
                />
            )

            await waitFor(() => {
                expect(
                    screen.queryByText("Invalid email format")
                ).not.toBeInTheDocument()
            })
        })

        it("displays input with error styling when format is invalid", async () => {
            const { container } = render(
                <EmailInput
                    value="invalid-email"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                const input = container.querySelector("input")
                expect(input).toHaveClass("border-red-500")
            })
        })

        it("displays input with success styling when email is valid and available", async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                json: async () => ({
                    success: true,
                    data: { available: true },
                }),
            })

            const { container } = render(
                <EmailInput
                    value="valid@example.com"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                const input = container.querySelector("input")
                expect(input).toHaveClass("border-green-500")
            })
        })
    })

    describe("Email Uniqueness Check Display", () => {
        it("displays loading spinner during email uniqueness check", async () => {
            ;(global.fetch as any).mockImplementationOnce(
                () =>
                    new Promise(resolve => {
                        setTimeout(
                            () =>
                                resolve({
                                    json: async () => ({
                                        success: true,
                                        data: { available: true },
                                    }),
                                }),
                            1000
                        )
                    })
            )

            const { container } = render(
                <EmailInput
                    value="valid@example.com"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                const spinner = container.querySelector(".animate-spin")
                expect(spinner).toBeInTheDocument()
            })
        })

        it("displays success checkmark when email is available", async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                json: async () => ({
                    success: true,
                    data: { available: true },
                }),
            })

            render(
                <EmailInput
                    value="available@example.com"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(screen.getByText("✓")).toBeInTheDocument()
                expect(
                    screen.getByText("Email is available")
                ).toBeInTheDocument()
            })
        })

        it("displays error message when email is already registered", async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                json: async () => ({
                    success: true,
                    data: { available: false },
                }),
            })

            const onValidationChange = vi.fn()

            render(
                <EmailInput
                    value="taken@example.com"
                    onChange={vi.fn()}
                    onValidationChange={onValidationChange}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText("Email already registered")
                ).toBeInTheDocument()
            })

            expect(onValidationChange).toHaveBeenCalledWith(false)
        })

        it("displays error message when email check fails", async () => {
            ;(global.fetch as any).mockRejectedValueOnce(
                new Error("Network error")
            )

            const onValidationChange = vi.fn()

            render(
                <EmailInput
                    value="valid@example.com"
                    onChange={vi.fn()}
                    onValidationChange={onValidationChange}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText("Failed to check email availability")
                ).toBeInTheDocument()
            })

            expect(onValidationChange).toHaveBeenCalledWith(false)
        })

        it("debounces email uniqueness check by 500ms", async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                json: async () => ({
                    success: true,
                    data: { available: true },
                }),
            })

            const { rerender } = render(
                <EmailInput
                    value="test1@example.com"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            // Simulate rapid typing by changing value quickly
            rerender(
                <EmailInput
                    value="test2@example.com"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            rerender(
                <EmailInput
                    value="test3@example.com"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            // Fetch should not be called yet (debounced)
            expect(global.fetch).not.toHaveBeenCalled()

            // Wait for debounce to complete
            await waitFor(
                () => {
                    expect(global.fetch).toHaveBeenCalled()
                },
                { timeout: 1000 }
            )
        })

        it("calls API with correct email parameter", async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                json: async () => ({
                    success: true,
                    data: { available: true },
                }),
            })

            render(
                <EmailInput
                    value="test@example.com"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining(
                        "/api/auth/check-email?email=test%40example.com"
                    )
                )
            })
        })

        it("removes loading spinner after check completes", async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                json: async () => ({
                    success: true,
                    data: { available: true },
                }),
            })

            const { container } = render(
                <EmailInput
                    value="valid@example.com"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                const spinner = container.querySelector(".animate-spin")
                expect(spinner).not.toBeInTheDocument()
            })
        })
    })

    describe("Validation State Management", () => {
        it("calls onValidationChange with true when email is valid and available", async () => {
            ;(global.fetch as any).mockImplementationOnce(() =>
                Promise.resolve({
                    json: async () => ({
                        success: true,
                        data: { available: true },
                    }),
                })
            )

            const onValidationChange = vi.fn()

            render(
                <EmailInput
                    value="valid@example.com"
                    onChange={vi.fn()}
                    onValidationChange={onValidationChange}
                />
            )

            await waitFor(() => {
                expect(onValidationChange).toHaveBeenCalledWith(true)
            })
        })

        it("calls onValidationChange with false when email format is invalid", async () => {
            const onValidationChange = vi.fn()

            render(
                <EmailInput
                    value="invalid-email"
                    onChange={vi.fn()}
                    onValidationChange={onValidationChange}
                />
            )

            await waitFor(() => {
                expect(onValidationChange).toHaveBeenCalledWith(false)
            })
        })

        it("calls onValidationChange with false when email is empty", () => {
            const onValidationChange = vi.fn()

            render(
                <EmailInput
                    value=""
                    onChange={vi.fn()}
                    onValidationChange={onValidationChange}
                />
            )

            expect(onValidationChange).toHaveBeenCalledWith(false)
        })
    })

    describe("Error Message Display", () => {
        it("displays error message near input field", async () => {
            render(
                <EmailInput
                    value="invalid"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                const errorMessage = screen.getByText("Invalid email format")
                expect(errorMessage).toHaveClass("text-red-600")
            })
        })

        it("associates error message with input using aria-describedby", async () => {
            const { container } = render(
                <EmailInput
                    value="invalid"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                const input = container.querySelector("input")
                expect(input).toHaveAttribute("aria-describedby", "email-error")
            })
        })

        it("removes aria-describedby when error is cleared", async () => {
            const { container, rerender } = render(
                <EmailInput
                    value="invalid"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText("Invalid email format")
                ).toBeInTheDocument()
            })

            rerender(
                <EmailInput
                    value=""
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                const input = container.querySelector("input")
                expect(input).not.toHaveAttribute("aria-describedby")
            })
        })

        it("displays success message when email is available", async () => {
            ;(global.fetch as any).mockImplementationOnce(() =>
                Promise.resolve({
                    json: async () => ({
                        success: true,
                        data: { available: true },
                    }),
                })
            )

            render(
                <EmailInput
                    value="available@example.com"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(
                    screen.getByText("Email is available")
                ).toBeInTheDocument()
            })
        })

        it("does not display success message when email is taken", async () => {
            ;(global.fetch as any).mockResolvedValueOnce({
                json: async () => ({
                    success: true,
                    data: { available: false },
                }),
            })

            render(
                <EmailInput
                    value="taken@example.com"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(
                    screen.queryByText("Email is available")
                ).not.toBeInTheDocument()
            })
        })
    })

    describe("Edge Cases", () => {
        it("handles rapid email changes correctly", async () => {
            ;(global.fetch as any).mockImplementation(() =>
                Promise.resolve({
                    json: async () => ({
                        success: true,
                        data: { available: true },
                    }),
                })
            )

            const { rerender } = render(
                <EmailInput
                    value="test1@example.com"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalled()
            })

            const initialCallCount = (global.fetch as any).mock.calls.length

            rerender(
                <EmailInput
                    value="test2@example.com"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            // Should debounce and not call immediately
            expect((global.fetch as any).mock.calls.length).toBe(
                initialCallCount
            )
        })

        it("handles email with special characters", async () => {
            ;(global.fetch as any).mockImplementationOnce(() =>
                Promise.resolve({
                    json: async () => ({
                        success: true,
                        data: { available: true },
                    }),
                })
            )

            render(
                <EmailInput
                    value="user+tag@example.co.uk"
                    onChange={vi.fn()}
                    onValidationChange={vi.fn()}
                />
            )

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining("user%2Btag%40example.co.uk")
                )
            })
        })
    })
})
