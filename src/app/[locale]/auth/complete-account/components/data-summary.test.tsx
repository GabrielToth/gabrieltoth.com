/**
 * Data Summary Component Tests
 *
 * Tests for read-only data display
 *
 * Validates: Requirements 4.9
 */

import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import DataSummary from "./data-summary"

// Mock next-intl
vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => {
        const translations: Record<string, string> = {
            "completeAccount.step3.edit": "Edit",
            "completeAccount.email": "Email",
            "completeAccount.name": "Name",
            "completeAccount.password": "Password",
            "completeAccount.phone": "Phone",
            "completeAccount.birthDate": "Birth Date",
        }
        return translations[key] || key
    },
}))

describe("DataSummary", () => {
    const defaultProps = {
        title: "Your Information",
        data: {
            email: "user@example.com",
            name: "John Doe",
        },
        onEdit: vi.fn(),
    }

    it("should render section label", () => {
        render(<DataSummary {...defaultProps} />)

        expect(screen.getByText("Your Information")).toBeInTheDocument()
    })

    it("should display data fields", () => {
        render(<DataSummary {...defaultProps} />)

        expect(screen.getByText("user@example.com")).toBeInTheDocument()
        expect(screen.getByText("John Doe")).toBeInTheDocument()
    })

    it("should display edit button when onEdit is provided", () => {
        render(<DataSummary {...defaultProps} />)

        expect(screen.getByText("Edit")).toBeInTheDocument()
    })

    it("should not display edit button when onEdit is not provided", () => {
        const props = {
            ...defaultProps,
            onEdit: undefined,
        }

        render(<DataSummary {...props} />)

        expect(screen.queryByText("Edit")).not.toBeInTheDocument()
    })

    it("should call onEdit when edit button is clicked", () => {
        const onEdit = vi.fn()
        render(<DataSummary {...defaultProps} onEdit={onEdit} />)

        const editButton = screen.getByText("Edit")
        fireEvent.click(editButton)

        expect(onEdit).toHaveBeenCalled()
    })

    it("should mask password field", () => {
        const props = {
            ...defaultProps,
            data: {
                password: "SecurePass123!",
            },
        }

        render(<DataSummary {...props} />)

        expect(screen.getByText("••••••••")).toBeInTheDocument()
    })

    it("should not display undefined or empty values", () => {
        const props = {
            ...defaultProps,
            data: {
                email: "user@example.com",
                name: undefined,
                phone: "",
            },
        }

        render(<DataSummary {...props} />)

        expect(screen.getByText("user@example.com")).toBeInTheDocument()
        expect(screen.queryByText("undefined")).not.toBeInTheDocument()
    })

    it("should display multiple data fields", () => {
        const props = {
            ...defaultProps,
            data: {
                email: "user@example.com",
                name: "John Doe",
                phone: "+1234567890",
                birthDate: "1990-01-01",
            },
        }

        render(<DataSummary {...props} />)

        expect(screen.getByText("user@example.com")).toBeInTheDocument()
        expect(screen.getByText("John Doe")).toBeInTheDocument()
        expect(screen.getByText("+1234567890")).toBeInTheDocument()
        expect(screen.getByText("1990-01-01")).toBeInTheDocument()
    })

    it("should display field labels", () => {
        const props = {
            ...defaultProps,
            data: {
                email: "user@example.com",
                name: "John Doe",
            },
        }

        render(<DataSummary {...props} />)

        // Labels should be displayed with colons
        expect(screen.getByText(/Email:/)).toBeInTheDocument()
        expect(screen.getByText(/Name:/)).toBeInTheDocument()
    })

    it("should handle picture field", () => {
        const props = {
            ...defaultProps,
            data: {
                picture: "✓",
            },
        }

        render(<DataSummary {...props} />)

        expect(screen.getByText("✓ Uploaded")).toBeInTheDocument()
    })

    it("should render in a bordered container", () => {
        const { container } = render(<DataSummary {...defaultProps} />)

        const section = container.querySelector(".border")
        expect(section).toBeInTheDocument()
    })
})
