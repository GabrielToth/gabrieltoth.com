import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { SecuritySection } from "./SecuritySection"
import { User } from "./SettingsContainer"

vi.mock("next-intl", () => ({
    useTranslations: (ns: string) => (key: string) => {
        const map: Record<string, string> = {
            "dashboard.settings.twoFactorAuthentication":
                "Two-Factor Authentication",
            "dashboard.settings.twoFactorDescription":
                "Add an extra layer of security to your account",
            "dashboard.settings.twoFactorEnabled": "2FA Enabled",
            "dashboard.settings.twoFactorDisabled": "2FA Disabled",
            "dashboard.settings.twoFactorProtected":
                "Your account is protected with two-factor authentication",
            "dashboard.settings.twoFactorEnablePrompt":
                "Enable 2FA to secure your account",
            "dashboard.settings.toggle2FA": "Toggle 2FA",
            "dashboard.settings.setup2FA": "Set up Two-Factor Authentication",
            "dashboard.settings.enter6DigitCode": "Enter 6-digit code",
            "dashboard.settings.codePlaceholder": "000000",
            "dashboard.settings.confirmAndEnable": "Confirm \u0026 Enable",
            "dashboard.settings.changePassword": "Change Password",
            "dashboard.settings.changePasswordDescription":
                "Change your password to keep your account secure",
            "dashboard.settings.currentPassword": "Current Password",
            "dashboard.settings.enterCurrentPassword":
                "Enter your current password",
            "dashboard.settings.newPassword": "New Password",
            "dashboard.settings.enterNewPassword": "Enter your new password",
            "dashboard.settings.passwordRequirements": "Password Requirements:",
            "dashboard.settings.passwordMinChars": "At least 8 characters",
            "dashboard.settings.passwordUppercase":
                "At least one uppercase letter",
            "dashboard.settings.passwordLowercase":
                "At least one lowercase letter",
            "dashboard.settings.passwordNumber": "At least one number",
            "dashboard.settings.passwordSpecial":
                "At least one special character",
            "dashboard.settings.currentPasswordRequired":
                "Current password is required",
            "dashboard.settings.newPasswordRequired":
                "New password is required",
            "dashboard.settings.passwordRequirementsNotMet":
                "Password does not meet all requirements",
            "dashboard.settings.confirmPassword": "Confirm Password",
            "dashboard.settings.confirmNewPassword":
                "Confirm your new password",
            "dashboard.settings.confirmPasswordRequired":
                "Please confirm your password",
            "dashboard.settings.passwordsDoNotMatch": "Passwords do not match",
            "dashboard.settings.passwordChanged":
                "Password changed successfully!",
            "dashboard.settings.failedToChangePassword":
                "Failed to change password",
            "dashboard.settings.changing": "Changing...",
            "dashboard.settings.cancel": "Cancel",
            "dashboard.settings.on": "On",
            "dashboard.settings.off": "Off",
        }
        return map[`${ns}.${key}`] ?? key
    },
}))

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
        expect(screen.getAllByText("Change Password").length).toBeGreaterThan(0)
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
                screen.getByText(/at least 8 characters/i)
            ).toBeInTheDocument()
            expect(
                screen.getByText(/at least one uppercase letter/i)
            ).toBeInTheDocument()
            expect(
                screen.getByText(/at least one lowercase letter/i)
            ).toBeInTheDocument()
            expect(screen.getByText(/at least one number/i)).toBeInTheDocument()
            expect(
                screen.getByText(/at least one special character/i)
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
