import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { BillingSection } from "./BillingSection"
import { BillingInfo } from "./SettingsContainer"

describe("BillingSection", () => {
    const mockBilling: BillingInfo = {
        plan: "Pro",
        price: 29.99,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        invoices: [
            {
                id: "inv-001",
                date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                amount: 29.99,
                status: "paid",
                downloadUrl: "#",
            },
            {
                id: "inv-002",
                date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
                amount: 29.99,
                status: "paid",
                downloadUrl: "#",
            },
        ],
    }

    const mockOnUpgrade = vi.fn()

    it("renders billing section", () => {
        render(
            <BillingSection billing={mockBilling} onUpgrade={mockOnUpgrade} />
        )

        expect(screen.getByText("Current Plan")).toBeInTheDocument()
        expect(
            screen.getByText("Manage your subscription and billing")
        ).toBeInTheDocument()
    })

    it("displays current plan information", () => {
        render(
            <BillingSection billing={mockBilling} onUpgrade={mockOnUpgrade} />
        )

        expect(screen.getByText("Pro Plan")).toBeInTheDocument()
        expect(screen.getByText("$29.99")).toBeInTheDocument()
        expect(screen.getByText("/month")).toBeInTheDocument()
    })

    it("displays plan features", () => {
        render(
            <BillingSection billing={mockBilling} onUpgrade={mockOnUpgrade} />
        )

        expect(screen.getByText("Unlimited posts")).toBeInTheDocument()
        expect(screen.getByText("5 connected channels")).toBeInTheDocument()
        expect(screen.getByText("Basic analytics")).toBeInTheDocument()
        expect(screen.getByText("Email support")).toBeInTheDocument()
    })

    it("displays next billing date", () => {
        render(
            <BillingSection billing={mockBilling} onUpgrade={mockOnUpgrade} />
        )

        expect(screen.getByText(/next billing date:/i)).toBeInTheDocument()
    })

    it("displays upgrade button", () => {
        render(
            <BillingSection billing={mockBilling} onUpgrade={mockOnUpgrade} />
        )

        expect(
            screen.getByRole("button", { name: /upgrade plan/i })
        ).toBeInTheDocument()
    })

    it("calls onUpgrade when upgrade button is clicked", async () => {
        const user = userEvent.setup()
        render(
            <BillingSection billing={mockBilling} onUpgrade={mockOnUpgrade} />
        )

        const upgradeButton = screen.getByRole("button", {
            name: /upgrade plan/i,
        })
        await user.click(upgradeButton)

        expect(mockOnUpgrade).toHaveBeenCalled()
    })

    it("displays billing history", () => {
        render(
            <BillingSection billing={mockBilling} onUpgrade={mockOnUpgrade} />
        )

        expect(screen.getByText("Billing History")).toBeInTheDocument()
        expect(
            screen.getByText("View and download your past invoices")
        ).toBeInTheDocument()
    })

    it("displays invoice table with headers", () => {
        render(
            <BillingSection billing={mockBilling} onUpgrade={mockOnUpgrade} />
        )

        expect(screen.getByText("Date")).toBeInTheDocument()
        expect(screen.getByText("Amount")).toBeInTheDocument()
        expect(screen.getByText("Status")).toBeInTheDocument()
        expect(screen.getByText("Action")).toBeInTheDocument()
    })

    it("displays invoices in table", () => {
        render(
            <BillingSection billing={mockBilling} onUpgrade={mockOnUpgrade} />
        )

        const paidBadges = screen.getAllByText("Paid")
        expect(paidBadges.length).toBeGreaterThan(0)
    })

    it("displays download buttons for invoices", () => {
        render(
            <BillingSection billing={mockBilling} onUpgrade={mockOnUpgrade} />
        )

        const downloadButtons = screen.getAllByRole("button", {
            name: /download/i,
        })
        expect(downloadButtons.length).toBeGreaterThan(0)
    })

    it("handles invoice download", async () => {
        const user = userEvent.setup()
        render(
            <BillingSection billing={mockBilling} onUpgrade={mockOnUpgrade} />
        )

        const downloadButtons = screen.getAllByRole("button", {
            name: /download/i,
        })
        await user.click(downloadButtons[0])

        await waitFor(() => {
            expect(downloadButtons[0]).toHaveTextContent("Download")
        })
    })

    it("displays empty state when no invoices", () => {
        const billingNoInvoices: BillingInfo = {
            ...mockBilling,
            invoices: [],
        }

        render(
            <BillingSection
                billing={billingNoInvoices}
                onUpgrade={mockOnUpgrade}
            />
        )

        expect(
            screen.getByText(
                "No invoices yet. Your first invoice will appear here."
            )
        ).toBeInTheDocument()
    })
})
