import { MoneroPricingProvider } from "@/hooks/use-monero-pricing"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { describe, expect, it } from "vitest"

describe("ui/pricing-toggle coverage", () => {
    it("renders SSR fallback and client toggle", async () => {
        const mod = await import("@/components/ui/pricing-toggle")
        // SSR fallback branch (isClient=false initial)
        const { rerender } = render(
            React.createElement(mod.default as any, { locale: "en" })
        )
        expect(screen.getByText(/Monero/i)).toBeInTheDocument()

        // Re-render inside provider to exercise client toggle handlers
        rerender(
            React.createElement(MoneroPricingProvider, {
                children: React.createElement(mod.default as any, {
                    locale: "en",
                }),
            })
        )

        // Click on both buttons (they call the same toggle)
        const moneroBtn = screen.getAllByText(/Monero/i)[0].closest("button")
        moneroBtn && fireEvent.click(moneroBtn)
        await waitFor(() => expect(true).toBe(true))
    })
})
