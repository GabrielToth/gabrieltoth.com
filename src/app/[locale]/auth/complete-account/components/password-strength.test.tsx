/**
 * Password Strength Component Tests
 *
 * Tests for password strength indicator
 *
 * Validates: Requirements 4.8
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import PasswordStrength from "./password-strength"

// Mock next-intl
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => {
        const translations: Record<string, string> = {
            "completeAccount.passwordRequirements.minLength":
                "At least 8 characters",
            "completeAccount.passwordRequirements.uppercase":
                "At least one uppercase letter",
            "completeAccount.passwordRequirements.lowercase":
                "At least one lowercase letter",
            "completeAccount.passwordRequirements.number":
                "At least one number",
            "completeAccount.passwordRequirements.special":
                "At least one special character (!@#$%^&*)",
            "completeAccount.passwordRequirements.strong": "Password is strong",
            "completeAccount.passwordRequirements.weak":
                "Password needs more requirements",
        }
        return translations[key] || key
    },
}))

describe("PasswordStrength", () => {
    it("should render password requirements", () => {
        render(<PasswordStrength password="" />)

        expect(screen.getByText("At least 8 characters")).toBeInTheDocument()
        expect(
            screen.getByText("At least one uppercase letter")
        ).toBeInTheDocument()
        expect(
            screen.getByText("At least one lowercase letter")
        ).toBeInTheDocument()
        expect(screen.getByText("At least one number")).toBeInTheDocument()
        expect(
            screen.getByText("At least one special character (!@#$%^&*)")
        ).toBeInTheDocument()
    })

    it("should show weak password status for empty password", () => {
        render(<PasswordStrength password="" />)

        expect(screen.getByText("0/5")).toBeInTheDocument()
    })

    it("should show weak password status for short password", () => {
        render(<PasswordStrength password="Pass1!" />)

        expect(screen.getByText("4/5")).toBeInTheDocument()
    })

    it("should show strong password status for valid password", () => {
        render(<PasswordStrength password="SecurePass123!" />)

        expect(screen.getByText("5/5")).toBeInTheDocument()
        expect(screen.getByText("Password is strong")).toBeInTheDocument()
    })

    it("should validate minimum length requirement", () => {
        const { rerender } = render(<PasswordStrength password="Pass1!" />)

        // Should not have min length met (4/5)
        expect(screen.getByText("4/5")).toBeInTheDocument()

        rerender(<PasswordStrength password="SecurePass123!" />)

        // Should have min length met (5/5)
        expect(screen.getByText("5/5")).toBeInTheDocument()
    })

    it("should validate uppercase requirement", () => {
        render(<PasswordStrength password="securepass123!" />)

        // Should not have uppercase met
        expect(screen.getByText("4/5")).toBeInTheDocument()
    })

    it("should validate lowercase requirement", () => {
        render(<PasswordStrength password="SECUREPASS123!" />)

        // Should not have lowercase met
        expect(screen.getByText("4/5")).toBeInTheDocument()
    })

    it("should validate number requirement", () => {
        render(<PasswordStrength password="SecurePass!" />)

        // Should not have number met
        expect(screen.getByText("4/5")).toBeInTheDocument()
    })

    it("should validate special character requirement", () => {
        render(<PasswordStrength password="SecurePass123" />)

        // Should not have special char met
        expect(screen.getByText("4/5")).toBeInTheDocument()
    })

    it("should update requirements as password changes", () => {
        const { rerender } = render(<PasswordStrength password="P" />)

        expect(screen.getByText("1/5")).toBeInTheDocument()

        rerender(<PasswordStrength password="Pass" />)
        expect(screen.getByText("2/5")).toBeInTheDocument()

        rerender(<PasswordStrength password="Pass1" />)
        expect(screen.getByText("3/5")).toBeInTheDocument()

        rerender(<PasswordStrength password="Pass1!" />)
        expect(screen.getByText("4/5")).toBeInTheDocument()

        rerender(<PasswordStrength password="SecurePass123!" />)
        expect(screen.getByText("5/5")).toBeInTheDocument()
    })

    it("should display progress bar", () => {
        const { container } = render(
            <PasswordStrength password="SecurePass123!" />
        )

        const progressBar = container.querySelector(".h-2.bg-gray-200")
        expect(progressBar).toBeInTheDocument()
    })
})
