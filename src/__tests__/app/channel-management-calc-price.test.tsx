import { describe, expect, it, vi } from "vitest"

vi.mock("@/hooks/use-monero-pricing", () => ({
    useMoneroPricing: () => ({
        calculatePrice: (base: number) => ({
            displayPrice: base * 2,
            originalPrice: base * 3,
            currency: "USD",
            isMonero: true,
        }),
    }),
}))

describe("useCalculatePrice", () => {
    it("calculates and returns price fields", async () => {
        const mod = await import(
            "@/app/[locale]/channel-management/channel-management-calculate-price"
        )
        const { calculatePrice } = mod.useCalculatePrice("en" as any)
        const result = calculatePrice(10)
        expect(result.displayPrice).toBe("20")
        expect(result.originalPrice).toBe("30")
        expect(result.currency).toBe("USD")
        expect(result.isMonero).toBe(true)
    })
})
