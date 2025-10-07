// @ts-nocheck
import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { describe, expect, it, vi } from "vitest"

import WaveIGLSupportView from "@/app/[locale]/waveigl-support/waveigl-support-view"

// Render Dialog content unconditionally to exercise inner components
vi.mock("@/components/ui/dialog", () => {
    const PassThrough = ({ children }: any) => <div>{children}</div>
    return {
        Dialog: PassThrough,
        DialogContent: PassThrough,
        DialogDescription: PassThrough,
        DialogHeader: PassThrough,
        DialogTitle: PassThrough,
    }
})

const baseTranslations: any = {
    hero: {
        badge: "badge",
        title: "title",
        subtitle: "subtitle",
        cta: "cta",
        stats: [
            { number: "1", label: "L1" },
            { number: "2", label: "L2" },
            { number: "3", label: "L3" },
        ],
    },
    mission: {
        title: "mission",
        subtitle: "sub",
        points: [
            { icon: "Layout", title: "T1", description: "D1" },
            { icon: "Users", title: "T2", description: "D2" },
        ],
    },
    projects: {
        title: "projects",
        subtitle: "p-sub",
        list: [
            {
                icon: "Layout",
                title: "A",
                description: "d",
                budget: "R$ 10",
                progress: 0,
                status: "new",
            },
            {
                icon: "Users",
                title: "B",
                description: "d",
                budget: "R$ 20",
                progress: 10,
                status: "in-progress",
            },
        ],
    },
    common: {
        inDevelopment: "in-dev",
        goal: "goal",
        totalInvestmentNeeded: "total",
        overallProgress: "overall",
    },
    transparency: {
        title: "transparency",
        subtitle: "transparency sub",
        breakdown: [
            {
                amount: "10%",
                category: "cat",
                description: "desc",
                percentage: 10,
            },
        ],
    },
    donation: {
        title: "donation",
        subtitle: "donation sub",
        moneroBonus: "bonus",
        monthlyAnnualPlan: "Monthly/Annual",
        monthly: "Monthly",
        annual: "Annual",
        oneTime: "One-time",
        pixDonation: "PIX Donation",
        scanQrCode: "scan",
        pixKeyCopied: "copied",
        suggestedAmounts: {
            donator: { description: "desc" },
            theDonator: { description: "desc" },
        },
    },
    payment: {
        methods: {
            pix: { title: "PIX", description: "d", features: ["a"] },
            monero: { title: "XMR", description: "d", features: ["b"] },
        },
        dialog: {
            oneTime: "One-time",
            monthly: "Monthly",
            description: "desc",
            customAmount: "amount",
            anonymousPayment: "anon",
            instantPayment: "instant",
        },
        alerts: { pixMonthlyNotSupported: "no pix sub" },
    },
}

describe("WaveIGLSupportView coverage", () => {
    it("renders, exercises dialog internals, toggles and clipboard", () => {
        const onPaymentMethodClick = vi.fn()
        const onScrollToDonation = vi.fn()
        const setSelectedMethod = vi.fn()
        const setCustomAmount = vi.fn()
        const setPaymentType = vi.fn()
        const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {})
        const writeTextStub = vi.fn().mockResolvedValue(undefined as any)
        if (!(navigator as any).clipboard) {
            Object.defineProperty(navigator, "clipboard", {
                value: { writeText: writeTextStub },
                configurable: true,
            })
        } else {
            ;(navigator as any).clipboard.writeText = writeTextStub
        }

        const { container, rerender } = render(
            <WaveIGLSupportView
                locale="en"
                translations={baseTranslations}
                selectedMethod="pix"
                setSelectedMethod={setSelectedMethod}
                customAmount="100"
                setCustomAmount={setCustomAmount}
                paymentType="subscription"
                setPaymentType={setPaymentType}
                onPaymentMethodClick={onPaymentMethodClick}
                onScrollToDonation={onScrollToDonation}
                donationSectionRef={{ current: null } as any}
            />
        )

        expect(container).toBeTruthy()
        // CTA button present
        expect(screen.getByText("cta")).toBeTruthy()
        // Payment dialog content rendered (via mocked Dialog)
        expect(screen.getAllByText(/Monthly|One-time/).length).toBeGreaterThan(
            0
        )

        // Trigger CTA
        fireEvent.click(screen.getByText("cta"))
        expect(onScrollToDonation).toHaveBeenCalled()

        // PaymentMethodToggle radios
        const pixRadio = screen.getByRole("radio", { name: /PIX/i })
        const xmrRadio = screen.getByRole("radio", { name: /XMR/i })
        fireEvent.click(xmrRadio)
        expect(setSelectedMethod).toHaveBeenCalledWith("monero")
        // Re-render with monero selected so switching back to PIX triggers change
        rerender(
            <WaveIGLSupportView
                locale="en"
                translations={baseTranslations}
                selectedMethod="monero"
                setSelectedMethod={setSelectedMethod}
                customAmount="100"
                setCustomAmount={setCustomAmount}
                paymentType="subscription"
                setPaymentType={setPaymentType}
                onPaymentMethodClick={onPaymentMethodClick}
                onScrollToDonation={onScrollToDonation}
                donationSectionRef={{ current: null } as any}
            />
        )
        const pixRadioAfter = screen.getByRole("radio", { name: /PIX/i })
        fireEvent.click(pixRadioAfter)
        expect(setSelectedMethod).toHaveBeenCalledWith("pix")

        // Custom amount input onChange
        const amountInput = screen.getByRole("spinbutton")
        fireEvent.change(amountInput, { target: { value: "200" } })
        expect(setCustomAmount).toHaveBeenCalledWith("200")

        // Dialog primary action button
        // Ensure selectedMethod prop matches PIX before clicking primary action
        rerender(
            <WaveIGLSupportView
                locale="en"
                translations={baseTranslations}
                selectedMethod="pix"
                setSelectedMethod={setSelectedMethod}
                customAmount="100"
                setCustomAmount={setCustomAmount}
                paymentType="subscription"
                setPaymentType={setPaymentType}
                onPaymentMethodClick={onPaymentMethodClick}
                onScrollToDonation={onScrollToDonation}
                donationSectionRef={{ current: null } as any}
            />
        )
        const primaryButton = screen
            .getAllByRole("button")
            .find(btn =>
                /PIX|Monero/.test((btn as HTMLButtonElement).textContent || "")
            ) as HTMLButtonElement
        if (primaryButton) {
            fireEvent.click(primaryButton)
            expect(onPaymentMethodClick).toHaveBeenCalledWith("pix")
        }

        // Switch to one-time and exercise copy PIX key
        rerender(
            <WaveIGLSupportView
                locale="en"
                translations={baseTranslations}
                selectedMethod="pix"
                setSelectedMethod={setSelectedMethod}
                customAmount="100"
                setCustomAmount={setCustomAmount}
                paymentType="one-time"
                setPaymentType={setPaymentType}
                onPaymentMethodClick={onPaymentMethodClick}
                onScrollToDonation={onScrollToDonation}
                donationSectionRef={{ current: null } as any}
            />
        )
        const copyBtn = screen.getByText(/Copy PIX Key/i)
        fireEvent.click(copyBtn)
        expect(writeTextStub).toHaveBeenCalled()
        expect(alertSpy).toHaveBeenCalled()
    })
})
