import { render } from "@testing-library/react"
import React, { act } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock useLocale to control locale value
vi.mock("@/hooks/use-locale", () => ({
    useLocale: () => ({ locale: "en" }),
}))

// Capture props from the client page to exercise handlers
const viewSpy = vi.fn()

vi.mock("@/app/[locale]/waveigl-support/waveigl-support-view", () => ({
    __esModule: true,
    default: (props: any) => {
        viewSpy(props)
        return null
    },
}))

// Stub window.open and alert
const openSpy = vi.fn()
const alertSpy = vi.fn()

describe("WaveIGL Support Client Page coverage", () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        ;(window as any).open = openSpy
        ;(window as any).alert = alertSpy
        viewSpy.mockClear()
    })

    it("exercises payment flows and scroll", async () => {
        const mod = await import(
            "@/app/[locale]/waveigl-support/waveigl-support-client-page"
        )
        render(
            React.createElement(mod.default as any, {
                translations: {
                    payment: {
                        alerts: {
                            enterAmount: "enter",
                            pixMonthlyNotSupported: "no pix sub",
                        },
                    },
                },
            })
        )

        // Ensure view received props and we can drive handlers
        expect(viewSpy).toHaveBeenCalled()
        const lastProps = viewSpy.mock.calls.at(-1)?.[0]

        // Trigger scroll (safe even without a real ref element)
        await act(async () => {
            lastProps.onScrollToDonation()
        })

        // No amount yet -> alerts
        await act(async () => {
            await lastProps.onPaymentMethodClick("monero")
        })
        expect(alertSpy).toHaveBeenCalledWith("enter")

        // Set amount and test monero open
        await act(async () => {
            lastProps.setCustomAmount("123")
        })
        const updated1 = viewSpy.mock.calls.at(-1)?.[0]
        await act(async () => {
            await updated1.onPaymentMethodClick("monero")
        })
        expect(openSpy).toHaveBeenCalledWith(
            "/payment-demo?method=monero&amount=123&type=subscription",
            "_blank"
        )

        // PIX with subscription should alert and not open again
        openSpy.mockClear()
        await act(async () => {
            await updated1.onPaymentMethodClick("pix")
        })
        expect(alertSpy).toHaveBeenCalledWith("no pix sub")
        expect(openSpy).not.toHaveBeenCalled()

        // Switch to one-time and test PIX open
        await act(async () => {
            updated1.setPaymentType("one-time")
        })
        const updated2 = viewSpy.mock.calls.at(-1)?.[0]
        await act(async () => {
            await updated2.onPaymentMethodClick("pix")
        })
        expect(openSpy).toHaveBeenCalledWith(
            "/payment-demo?method=pix&amount=123&type=one-time",
            "_blank"
        )
    })

    it("injects Mercado Pago script on mount", async () => {
        const mod = await import(
            "@/app/[locale]/waveigl-support/waveigl-support-client-page"
        )
        const before = document.querySelectorAll("script").length
        render(
            React.createElement(mod.default as any, {
                translations: { payment: { alerts: {} } },
            })
        )
        const after = document.querySelectorAll("script").length
        expect(after).toBeGreaterThanOrEqual(before + 1)
    })
})
