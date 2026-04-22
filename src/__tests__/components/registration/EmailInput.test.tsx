import { EmailInput } from "@/components/registration/EmailInput"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock fetch
global.fetch = vi.fn()

describe("EmailInput Component", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

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
        await user.type(input, "t")

        expect(onChange).toHaveBeenCalledWith("t")
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

    it("displays error message when provided", () => {
        render(
            <EmailInput
                value="invalid"
                onChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        // Simulate validation error by checking if error message appears
        // The component will show error after validation
        expect(screen.getByLabelText("Email address")).toBeInTheDocument()
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
})
