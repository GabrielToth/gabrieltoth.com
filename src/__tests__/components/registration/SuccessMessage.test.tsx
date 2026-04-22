import { SuccessMessage } from "@/components/registration/SuccessMessage"
import { render, screen, waitFor } from "@testing-library/react"
import { useRouter } from "next/navigation"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: vi.fn(),
}))

describe("SuccessMessage Component", () => {
    let mockPush: ReturnType<typeof vi.fn>

    beforeEach(() => {
        mockPush = vi.fn()
        ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
            push: mockPush,
        })
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.clearAllMocks()
        vi.useRealTimers()
    })

    describe("Rendering", () => {
        it("should render success message", () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            expect(
                screen.getByText("Account created successfully!")
            ).toBeInTheDocument()
        })

        it("should render success icon", () => {
            const { container } = render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            const icon = container.querySelector(".text-green-600")
            expect(icon).toBeInTheDocument()
        })

        it("should render success heading", () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            expect(screen.getByText("Success!")).toBeInTheDocument()
        })

        it("should render countdown timer", () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            expect(
                screen.getByText(/Redirecting to login in/)
            ).toBeInTheDocument()
        })

        it("should render redirect button", () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            expect(screen.getByText("Go to Login Now")).toBeInTheDocument()
        })
    })

    describe("Custom Messages", () => {
        it("should display custom success message", () => {
            render(
                <SuccessMessage
                    message="Welcome! Your account has been created."
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            expect(
                screen.getByText("Welcome! Your account has been created.")
            ).toBeInTheDocument()
        })

        it("should use default message if not provided", () => {
            render(<SuccessMessage redirectUrl="/login" redirectDelay={2000} />)

            expect(
                screen.getByText("Account created successfully!")
            ).toBeInTheDocument()
        })

        it("should display detailed success message", () => {
            const detailedMessage =
                "Congratulations! Your account has been created successfully. A verification email has been sent to your inbox."

            render(
                <SuccessMessage
                    message={detailedMessage}
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            expect(screen.getByText(detailedMessage)).toBeInTheDocument()
        })
    })

    describe("Countdown Timer", () => {
        it("should display initial countdown", () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            expect(
                screen.getByText(/Redirecting to login in 2 seconds/)
            ).toBeInTheDocument()
        })

        it("should decrement countdown every second", () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            expect(
                screen.getByText(/Redirecting to login in 2 seconds/)
            ).toBeInTheDocument()

            vi.advanceTimersByTime(1000)

            expect(
                screen.getByText(/Redirecting to login in 1 seconds/)
            ).toBeInTheDocument()
        })

        it("should handle custom redirect delay", () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={5000}
                />
            )

            expect(
                screen.getByText(/Redirecting to login in 5 seconds/)
            ).toBeInTheDocument()

            vi.advanceTimersByTime(1000)

            expect(
                screen.getByText(/Redirecting to login in 4 seconds/)
            ).toBeInTheDocument()
        })

        it("should handle short countdown", () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={1000}
                />
            )

            expect(
                screen.getByText(/Redirecting to login in 1 seconds/)
            ).toBeInTheDocument()
        })
    })

    describe("Auto-Redirect", () => {
        it("should redirect to login after countdown", async () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            vi.advanceTimersByTime(2000)

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/login")
            })
        })

        it("should redirect to custom URL", async () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/dashboard"
                    redirectDelay={2000}
                />
            )

            vi.advanceTimersByTime(2000)

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/dashboard")
            })
        })

        it("should use default redirect URL if not provided", async () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectDelay={2000}
                />
            )

            vi.advanceTimersByTime(2000)

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/login")
            })
        })

        it("should redirect to verification page", async () => {
            render(
                <SuccessMessage
                    message="Account created! Please verify your email."
                    redirectUrl="/verify-email"
                    redirectDelay={2000}
                />
            )

            vi.advanceTimersByTime(2000)

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/verify-email")
            })
        })
    })

    describe("Manual Redirect Button", () => {
        it("should redirect immediately when button is clicked", () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={5000}
                />
            )

            const button = screen.getByText("Go to Login Now")
            button.click()

            expect(mockPush).toHaveBeenCalledWith("/login")
        })

        it("should redirect to custom URL when button is clicked", () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/dashboard"
                    redirectDelay={5000}
                />
            )

            const button = screen.getByText("Go to Login Now")
            button.click()

            expect(mockPush).toHaveBeenCalledWith("/dashboard")
        })
    })

    describe("Styling", () => {
        it("should have dark overlay", () => {
            const { container } = render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            const overlay = container.querySelector(".fixed.inset-0")
            expect(overlay).toHaveClass("bg-black")
            expect(overlay).toHaveClass("bg-opacity-50")
        })

        it("should have centered card", () => {
            const { container } = render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            const card = container.querySelector(".bg-white.rounded-lg")
            expect(card).toBeInTheDocument()
        })

        it("should have green success icon background", () => {
            const { container } = render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            const iconBg = container.querySelector(".bg-green-100")
            expect(iconBg).toBeInTheDocument()
        })

        it("should have blue button styling", () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            const button = screen.getByText("Go to Login Now")
            expect(button).toHaveClass("bg-blue-600")
        })
    })

    describe("Accessibility", () => {
        it("should have accessible button", () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            const button = screen.getByText("Go to Login Now")
            expect(button).toBeInTheDocument()
            expect(button.tagName).toBe("BUTTON")
        })

        it("should display success message for screen readers", () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            expect(screen.getByText("Success!")).toBeInTheDocument()
            expect(
                screen.getByText("Account created successfully!")
            ).toBeInTheDocument()
        })
    })

    describe("Edge Cases", () => {
        it("should handle very short redirect delay", async () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={100}
                />
            )

            vi.advanceTimersByTime(100)

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith("/login")
            })
        })

        it("should handle very long redirect delay", () => {
            render(
                <SuccessMessage
                    message="Account created successfully!"
                    redirectUrl="/login"
                    redirectDelay={60000}
                />
            )

            expect(
                screen.getByText(/Redirecting to login in 60 seconds/)
            ).toBeInTheDocument()
        })

        it("should handle empty message", () => {
            render(
                <SuccessMessage
                    message=""
                    redirectUrl="/login"
                    redirectDelay={2000}
                />
            )

            expect(screen.getByText("Success!")).toBeInTheDocument()
        })
    })
})
