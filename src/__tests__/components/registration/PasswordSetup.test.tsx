import { PasswordSetup } from "@/components/registration/PasswordSetup"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

describe("PasswordSetup Component", () => {
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

        expect(screen.getByLabelText("Confirm password")).toBeInTheDocument()
        expect(screen.getByText("Confirm Password")).toBeInTheDocument()
    })

    it("displays password requirements", () => {
        render(
            <PasswordSetup
                value=""
                confirmValue=""
                onChange={vi.fn()}
                onConfirmChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        expect(screen.getByText("Password Requirements:")).toBeInTheDocument()
        expect(screen.getByText(/At least 8 characters/)).toBeInTheDocument()
        expect(screen.getByText(/One uppercase letter/)).toBeInTheDocument()
        expect(screen.getByText(/One lowercase letter/)).toBeInTheDocument()
        expect(screen.getByText(/One number/)).toBeInTheDocument()
        expect(screen.getByText(/One special character/)).toBeInTheDocument()
    })

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
        await user.type(passwordInput, "T")

        expect(onChange).toHaveBeenCalledWith("T")
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
        await user.type(confirmInput, "T")

        expect(onConfirmChange).toHaveBeenCalledWith("T")
    })

    it("shows Show/Hide toggle buttons", () => {
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
        expect(showButtons.length).toBeGreaterThanOrEqual(2)
    })

    it("toggles password visibility", async () => {
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

    it("displays password strength indicator when password is provided", () => {
        render(
            <PasswordSetup
                value="TestPass123!"
                confirmValue=""
                onChange={vi.fn()}
                onConfirmChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        // The component should display strength feedback
        const strengthElements = screen.getAllByText(/strong|weak|fair|good/i)
        expect(strengthElements.length).toBeGreaterThan(0)
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

    it("displays requirements list with checkmarks", () => {
        render(
            <PasswordSetup
                value="TestPass123!"
                confirmValue=""
                onChange={vi.fn()}
                onConfirmChange={vi.fn()}
                onValidationChange={vi.fn()}
            />
        )

        // Should display requirement indicators
        const requirements = screen.getAllByText(/✓|○/)
        expect(requirements.length).toBeGreaterThan(0)
    })
})
