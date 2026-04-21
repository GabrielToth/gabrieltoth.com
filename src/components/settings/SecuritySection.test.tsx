import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { SecuritySection } from "./SecuritySection"
import { User } from "./SettingsContainer"

describe("SecuritySection", () => {
    const mockUser: User = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    it("renders security section", () => {
        render(<SecuritySection user={mockUser} />)

        expect(
            screen.getByText("Two-Factor Authentication")
        ).toBeInTheDocument()
        expect(screen.getByText("Password")).toBeInTheDocument()
    })

    it("displays 2FA toggle", () => {
        render(<SecuritySection user={mockUser} />)

        expect(screen.getByText("2FA Disabled")).toBeInTheDocument()
        expect(
            screen.getByText("Enable 2FA to secure your account")
        ).toBeInTheDocument()
    })

    it("toggles 2FA setup form", async () => {
        const user = userEvent.setup()
        render(<SecuritySection user={mockUser} />)

        const toggle = screen.getByRole("button", { name: /toggle 2fa/i })
        await user.click(toggle)

        await waitFor(() => {
            expect(
                screen.getByText("Set up Two-Factor Authentication")
            ).toBeInTheDocument()
        })
    })

    it("displays password change button", () => {
        render(<SecuritySection user={mockUser} />)

        expect(
            screen.getByRole("button", { name: /change password/i })
        ).toBeInTheDocument()
    })

    it("shows password form when change password is clicked", async () => {
        const user = userEvent.setup()
        render(<SecuritySection user={mockUser} />)

        const changeButton = screen.getByRole("button", {
            name: /change password/i,
        })
        await user.click(changeButton)

        await waitFor(() => {
            expect(
                screen.getByLabelText("Current Password")
            ).toBeInTheDocument()
            expect(screen.getByLabelText("New Password")).toBeInTheDocument()
            expect(
                screen.getByLabelText("Confirm Password")
            ).toBeInTheDocument()
        })
    })

    it("validates password requirements", async () => {
        const user = userEvent.setup()
        render(<SecuritySection user={mockUser} />)

        const changeButton = screen.getByRole("button", {
            name: /change password/i,
        })
        await user.click(changeButton)

        const newPasswordInput = screen.getByLabelText("New Password")
        await user.type(newPasswordInput, "Test123!")

        await waitFor(() => {
            expect(
                screen.getByText("At least 8 characters")
            ).toBeInTheDocument()
            expect(
                screen.getByText("At least one uppercase letter")
            ).toBeInTheDocument()
            expect(
                screen.getByText("At least one lowercase letter")
            ).toBeInTheDocument()
            expect(screen.getByText("At least one number")).toBeInTheDocument()
            expect(
                screen.getByText("At least one special character")
            ).toBeInTheDocument()
        })
    })

    it("validates current password is required", async () => {
        const user = userEvent.setup()
        render(<SecuritySection user={mockUser} />)

        const changeButton = screen.getByRole("button", {
            name: /change password/i,
        })
        await user.click(changeButton)

        const submitButton = screen.getByRole("button", {
            name: /change password/i,
        })
        await user.click(submitButton)

        await waitFor(() => {
            expect(
                screen.getByText("Current password is required")
            ).toBeInTheDocument()
        })
    })

    it("validates passwords match", async () => {
        const user = userEvent.setup()
        render(<SecuritySection user={mockUser} />)

        const changeButton = screen.getByRole("button", {
            name: /change password/i,
        })
        await user.click(changeButton)

        const currentPasswordInput = screen.getByLabelText("Current Password")
        const newPasswordInput = screen.getByLabelText("New Password")
        const confirmPasswordInput = screen.getByLabelText("Confirm Password")

        await user.type(currentPasswordInput, "OldPassword123!")
        await user.type(newPasswordInput, "NewPassword123!")
        await user.type(confirmPasswordInput, "DifferentPassword123!")

        const submitButton = screen.getByRole("button", {
            name: /change password/i,
        })
        await user.click(submitButton)

        await waitFor(() => {
            expect(
                screen.getByText("Passwords do not match")
            ).toBeInTheDocument()
        })
    })

    it("cancels password change", async () => {
        const user = userEvent.setup()
        render(<SecuritySection user={mockUser} />)

        const changeButton = screen.getByRole("button", {
            name: /change password/i,
        })
        await user.click(changeButton)

        const cancelButton = screen.getByRole("button", { name: /cancel/i })
        await user.click(cancelButton)

        await waitFor(() => {
            expect(
                screen.queryByLabelText("Current Password")
            ).not.toBeInTheDocument()
        })
    })
})
