import {
    MoneroPricingProvider,
    useMoneroPricing,
} from "@/hooks/use-monero-pricing"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { describe, expect, it } from "vitest"

const Probe = ({ base }: { base: number }) => {
    const { showMoneroPrice, toggleMoneroPrice, calculatePrice } =
        useMoneroPricing()
    const res = calculatePrice(base, "en" as any)
    return (
        <div>
            <div data-testid="monero-flag">{String(showMoneroPrice)}</div>
            <div data-testid="display">{res.displayPrice}</div>
            <div data-testid="original">{String(res.originalPrice)}</div>
            <div data-testid="currency">{res.currency}</div>
            <div data-testid="discount">{res.discount}</div>
            <button onClick={toggleMoneroPrice}>toggle</button>
        </div>
    )
}

describe("useMoneroPricing coverage", () => {
    it("provides defaults when used without provider", () => {
        const Comp = () => {
            const { showMoneroPrice, calculatePrice } =
                useMoneroPricing() as any
            const res = calculatePrice(100, "en" as any)
            return (
                <div>
                    <span data-testid="def-flag">
                        {String(showMoneroPrice)}
                    </span>
                    <span data-testid="def-display">{res.displayPrice}</span>
                    <span data-testid="def-discount">{res.discount}</span>
                </div>
            )
        }
        render(React.createElement(Comp))
        expect(screen.getByTestId("def-flag").textContent).toBe("true")
        expect(
            Number(screen.getByTestId("def-display").textContent)
        ).toBeGreaterThan(0)
        expect(Number(screen.getByTestId("def-discount").textContent)).toBe(50)
    })

    it("toggles pricing mode and recalculates values", async () => {
        render(
            React.createElement(MoneroPricingProvider, {
                children: React.createElement(Probe, { base: 100 }),
            })
        )

        const before = screen.getByTestId("monero-flag").textContent
        expect(before).toBe("true")

        // Toggle with act
        fireEvent.click(screen.getByText("toggle"))
        await waitFor(() =>
            expect(screen.getByTestId("monero-flag").textContent).toBe("false")
        )
        expect(
            Number(screen.getByTestId("display").textContent)
        ).toBeGreaterThan(0)
        expect(
            screen.getByTestId("currency").textContent.length
        ).toBeGreaterThan(0)
    })
})
