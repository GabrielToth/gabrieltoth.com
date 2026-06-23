/**
 * Unit tests for PricingManager
 * Tests pricing management, cost calculation, and currency conversion
 */

import { PricingManager } from "./pricing"
import { initializeDatabasePool } from "../storage/database"
import { initializeDatabase } from "../storage/initialize"

describe("PricingManager", () => {
    let manager: PricingManager
    let pool: any

    beforeAll(async () => {
        pool = await initializeDatabasePool()
        await initializeDatabase()
    })

    beforeEach(() => {
        manager = new PricingManager(5.0) // 5 BRL per USD
    })

    afterAll(async () => {
        await pool.close()
    })

    describe("Exchange Rate", () => {
        it("should set and get exchange rate", () => {
            manager.setExchangeRate(6.5)
            expect(manager.getExchangeRate()).toBe(6.5)
        })

        it("should reject negative exchange rate", () => {
            expect(() => manager.setExchangeRate(-1)).toThrow(
                "Exchange rate must be positive"
            )
        })

        it("should reject zero exchange rate", () => {
            expect(() => manager.setExchangeRate(0)).toThrow(
                "Exchange rate must be positive"
            )
        })
    })

    describe("Currency Conversion", () => {
        it("should convert USD to BRL", () => {
            manager.setExchangeRate(5.0)
            const brl = manager.convertUSDToBRL(100)
            expect(brl).toBe(500)
        })

        it("should convert BRL to USD", () => {
            manager.setExchangeRate(5.0)
            const usd = manager.convertBRLToUSD(500)
            expect(usd).toBe(100)
        })

        it("should handle decimal conversions", () => {
            manager.setExchangeRate(5.25)
            const brl = manager.convertUSDToBRL(10.5)
            expect(brl).toBeCloseTo(55.125, 3)
        })

        it("should reject negative amounts in USD to BRL", () => {
            expect(() => manager.convertUSDToBRL(-100)).toThrow(
                "Amount must be non-negative"
            )
        })

        it("should reject negative amounts in BRL to USD", () => {
            expect(() => manager.convertBRLToUSD(-500)).toThrow(
                "Amount must be non-negative"
            )
        })

        it("should handle zero conversions", () => {
            expect(manager.convertUSDToBRL(0)).toBe(0)
            expect(manager.convertBRLToUSD(0)).toBe(0)
        })
    })

    describe("Pricing Overrides", () => {
        it("should set pricing override", async () => {
            manager.setPricingOverride("claude-haiku-4.5", 1.0, 5.0)

            const pricing = await manager.getPricing("claude-haiku-4.5")
            expect(pricing.inputPrice).toBe(1.0)
            expect(pricing.outputPrice).toBe(5.0)
        })

        it("should reject negative prices in override", () => {
            expect(() =>
                manager.setPricingOverride("claude-haiku-4.5", -1.0, 5.0)
            ).toThrow("Prices must be non-negative")
        })

        it("should clear pricing overrides", async () => {
            manager.setPricingOverride("claude-haiku-4.5", 1.0, 5.0)
            manager.clearOverrides()

            const pricing = await manager.getPricing("claude-haiku-4.5")
            // Should fall back to default pricing
            expect(pricing.inputPrice).toBe(0.8)
            expect(pricing.outputPrice).toBe(4.0)
        })
    })

    describe("Cost Calculation", () => {
        it("should calculate cost for Claude model", async () => {
            const cost = await manager.calculateCost(
                "claude-haiku-4.5",
                1000,
                500
            )

            // Claude: input 0.8 per 1M, output 4.0 per 1M
            const expectedInput = (1000 * 0.8) / 1_000_000
            const expectedOutput = (500 * 4.0) / 1_000_000
            const expectedTotal = expectedInput + expectedOutput

            expect(cost.inputCost).toBeCloseTo(expectedInput, 8)
            expect(cost.outputCost).toBeCloseTo(expectedOutput, 8)
            expect(cost.totalCost).toBeCloseTo(expectedTotal, 8)
        })

        it("should calculate cost for Gemini model", async () => {
            const cost = await manager.calculateCost(
                "gemini-flash-3.1",
                1000,
                500
            )

            // Gemini: input 0.075 per 1M, output 0.3 per 1M
            const expectedInput = (1000 * 0.075) / 1_000_000
            const expectedOutput = (500 * 0.3) / 1_000_000
            const expectedTotal = expectedInput + expectedOutput

            expect(cost.inputCost).toBeCloseTo(expectedInput, 8)
            expect(cost.outputCost).toBeCloseTo(expectedOutput, 8)
            expect(cost.totalCost).toBeCloseTo(expectedTotal, 8)
        })

        it("should calculate cost for Cursor model", async () => {
            const cost = await manager.calculateCost(
                "cursor-composer-2.0",
                1000,
                500
            )

            // Cursor: input 1.0 per 1M, output 5.0 per 1M
            const expectedInput = (1000 * 1.0) / 1_000_000
            const expectedOutput = (500 * 5.0) / 1_000_000
            const expectedTotal = expectedInput + expectedOutput

            expect(cost.inputCost).toBeCloseTo(expectedInput, 8)
            expect(cost.outputCost).toBeCloseTo(expectedOutput, 8)
            expect(cost.totalCost).toBeCloseTo(expectedTotal, 8)
        })

        it("should reject negative token counts", async () => {
            await expect(
                manager.calculateCost("claude-haiku-4.5", -1000, 500)
            ).rejects.toThrow("Token counts must be non-negative")
        })

        it("should handle zero tokens", async () => {
            const cost = await manager.calculateCost("claude-haiku-4.5", 0, 0)

            expect(cost.inputCost).toBe(0)
            expect(cost.outputCost).toBe(0)
            expect(cost.totalCost).toBe(0)
        })

        it("should use pricing override in cost calculation", async () => {
            manager.setPricingOverride("claude-haiku-4.5", 2.0, 10.0)

            const cost = await manager.calculateCost(
                "claude-haiku-4.5",
                1000,
                500
            )

            const expectedInput = (1000 * 2.0) / 1_000_000
            const expectedOutput = (500 * 10.0) / 1_000_000
            const expectedTotal = expectedInput + expectedOutput

            expect(cost.inputCost).toBeCloseTo(expectedInput, 8)
            expect(cost.outputCost).toBeCloseTo(expectedOutput, 8)
            expect(cost.totalCost).toBeCloseTo(expectedTotal, 8)
        })
    })

    describe("Pricing Verification", () => {
        it("should indicate when pricing needs verification after interval", () => {
            // Create a fresh manager and manually set last prompt to old date
            const freshManager = new PricingManager()
            // Manually set the last prompt to 8 days ago to trigger verification
            ;(freshManager as any).lastPricingPrompt = new Date(
                Date.now() - 8 * 24 * 60 * 60 * 1000
            )
            expect(freshManager.shouldPromptForPricingVerification()).toBe(true)
        })

        it("should mark pricing as verified", () => {
            const manager2 = new PricingManager()
            manager2.markPricingVerified()
            expect(manager2.shouldPromptForPricingVerification()).toBe(false)
        })
    })

    describe("Cache Management", () => {
        it("should clear cache", async () => {
            await manager.getPricing("claude-haiku-4.5")
            const cached1 = manager.getAllCachedPricing()
            expect(cached1.length).toBeGreaterThan(0)

            manager.clearCache()
            const cached2 = manager.getAllCachedPricing()
            expect(cached2.length).toBe(0)
        })

        it("should get all cached pricing", async () => {
            manager.clearCache()

            await manager.getPricing("claude-haiku-4.5")
            await manager.getPricing("gemini-flash-3.1")

            const cached = manager.getAllCachedPricing()
            expect(cached.length).toBeGreaterThanOrEqual(2)
            expect(cached.some(p => p.model === "claude-haiku-4.5")).toBe(true)
            expect(cached.some(p => p.model === "gemini-flash-3.1")).toBe(true)
        })
    })

    describe("Default Pricing", () => {
        it("should get default pricing for model", () => {
            const pricing = PricingManager.getDefaultPricing("claude-haiku-4.5")
            expect(pricing.input).toBe(0.8)
            expect(pricing.output).toBe(4.0)
        })

        it("should get all default pricing", () => {
            const allPricing = PricingManager.getAllDefaultPricing()
            expect(allPricing["claude-haiku-4.5"]).toBeDefined()
            expect(allPricing["gemini-flash-3.1"]).toBeDefined()
            expect(allPricing["cursor-composer-2.0"]).toBeDefined()
        })

        it("should return unknown pricing for unsupported model", () => {
            const pricing = PricingManager.getDefaultPricing("unknown")
            expect(pricing.input).toBe(1.0)
            expect(pricing.output).toBe(1.0)
        })
    })

    describe("Pricing Retrieval", () => {
        it("should get pricing for supported model", async () => {
            const pricing = await manager.getPricing("claude-haiku-4.5")

            expect(pricing.model).toBe("claude-haiku-4.5")
            expect(pricing.inputPrice).toBe(0.8)
            expect(pricing.outputPrice).toBe(4.0)
            expect(pricing.currency).toBe("USD")
            expect(pricing.lastUpdated).toBeInstanceOf(Date)
        })

        it("should cache pricing", async () => {
            manager.clearCache()

            const pricing1 = await manager.getPricing("claude-haiku-4.5")
            const pricing2 = await manager.getPricing("claude-haiku-4.5")

            expect(pricing1).toEqual(pricing2)
        })

        it("should handle multiple models", async () => {
            const claude = await manager.getPricing("claude-haiku-4.5")
            const gemini = await manager.getPricing("gemini-flash-3.1")
            const cursor = await manager.getPricing("cursor-composer-2.0")

            expect(claude.inputPrice).toBe(0.8)
            expect(gemini.inputPrice).toBe(0.075)
            expect(cursor.inputPrice).toBe(1.0)
        })
    })
})
