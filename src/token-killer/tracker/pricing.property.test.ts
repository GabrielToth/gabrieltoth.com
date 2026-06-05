/**
 * Property-based tests for PricingManager
 * Validates correctness properties for cost calculations and conversions
 */

import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import fc from 'fast-check'
import { PricingManager } from './pricing'
import { initializeDatabasePool } from '../storage/database'
import { initializeDatabase } from '../storage/initialize'

describe('PricingManager - Property-Based Tests', () => {
  let manager: PricingManager
  let pool: any

  beforeAll(async () => {
    pool = await initializeDatabasePool()
    await initializeDatabase()
  })

  beforeEach(() => {
    manager = new PricingManager(5.0)
  })

  afterAll(async () => {
    await pool.close()
  })

  /**
   * Property 4: Cost Calculation Accuracy
   * **Validates: Requirements 1.4, 1.12**
   *
   * For any token count and pricing, the calculated cost must equal
   * (input_tokens × input_price) + (output_tokens × output_price).
   */
  it('should maintain invariant: cost calculation formula is correct', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 1000000 }),
        fc.integer({ min: 0, max: 1000000 }),
        async (inputTokens, outputTokens) => {
          const cost = await manager.calculateCost('claude-haiku-4.5', inputTokens, outputTokens)

          // Claude pricing: input 0.8 per 1M, output 4.0 per 1M
          const expectedInput = (inputTokens * 0.8) / 1_000_000
          const expectedOutput = (outputTokens * 4.0) / 1_000_000
          const expectedTotal = expectedInput + expectedOutput

          return (
            Math.abs(cost.inputCost - expectedInput) < 0.000001 &&
            Math.abs(cost.outputCost - expectedOutput) < 0.000001 &&
            Math.abs(cost.totalCost - expectedTotal) < 0.000001
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Cost Non-Negativity
   * **Validates: Requirements 1.4**
   *
   * Costs must always be non-negative for non-negative token counts.
   */
  it('should maintain invariant: costs are always non-negative', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 1000000 }),
        fc.integer({ min: 0, max: 1000000 }),
        async (inputTokens, outputTokens) => {
          const cost = await manager.calculateCost('claude-haiku-4.5', inputTokens, outputTokens)

          return cost.inputCost >= 0 && cost.outputCost >= 0 && cost.totalCost >= 0
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Currency Conversion Consistency
   * **Validates: Requirements 1.12**
   *
   * For any USD amount and exchange rate, converting to BRL and back
   * should return approximately the original amount.
   */
  it('should maintain invariant: currency conversions are reversible', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: 0, max: 1000, noNaN: true }),
        fc.float({ min: 1, max: 10, noNaN: true }),
        (usd, exchangeRate) => {
          const manager2 = new PricingManager(exchangeRate)

          const brl = manager2.convertUSDToBRL(usd)
          const backToUsd = manager2.convertBRLToUSD(brl)

          // Should be approximately equal (within floating point precision)
          return Math.abs(backToUsd - usd) < 0.000001
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Exchange Rate Linearity
   * **Validates: Requirements 1.12**
   *
   * Currency conversion must be linear: convert(a + b) = convert(a) + convert(b)
   */
  it('should maintain invariant: currency conversion is linear', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.float({ min: 0, max: 500, noNaN: true }),
        fc.float({ min: 0, max: 500, noNaN: true }),
        fc.float({ min: 1, max: 10, noNaN: true }),
        (usd1, usd2, exchangeRate) => {
          const manager2 = new PricingManager(exchangeRate)

          const brl1 = manager2.convertUSDToBRL(usd1)
          const brl2 = manager2.convertUSDToBRL(usd2)
          const brlSum = manager2.convertUSDToBRL(usd1 + usd2)

          // Linearity: convert(a + b) = convert(a) + convert(b)
          return Math.abs(brlSum - (brl1 + brl2)) < 0.000001
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Pricing Override Consistency
   * **Validates: Requirements 1.10**
   *
   * When a pricing override is set, it must be used in cost calculations
   * instead of default pricing.
   */
  it('should maintain invariant: pricing overrides are applied correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 0.1, max: 10, noNaN: true }),
        fc.double({ min: 0.1, max: 10, noNaN: true }),
        fc.integer({ min: 0, max: 1000000 }),
        fc.integer({ min: 0, max: 1000000 }),
        async (inputPrice, outputPrice, inputTokens, outputTokens) => {
          const manager2 = new PricingManager()
          manager2.setPricingOverride('claude-haiku-4.5', inputPrice, outputPrice)

          const cost = await manager2.calculateCost('claude-haiku-4.5', inputTokens, outputTokens)

          const expectedInput = (inputTokens * inputPrice) / 1_000_000
          const expectedOutput = (outputTokens * outputPrice) / 1_000_000
          const expectedTotal = expectedInput + expectedOutput

          return (
            Math.abs(cost.inputCost - expectedInput) < 0.000001 &&
            Math.abs(cost.outputCost - expectedOutput) < 0.000001 &&
            Math.abs(cost.totalCost - expectedTotal) < 0.000001
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Model-Specific Pricing
   * **Validates: Requirements 1.9**
   *
   * Different models must have different pricing, and cost calculations
   * must reflect the correct model pricing.
   */
  it('should maintain invariant: model-specific pricing is applied', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1000, max: 100000 }),
        fc.integer({ min: 1000, max: 100000 }),
        async (inputTokens, outputTokens) => {
          const claudeCost = await manager.calculateCost('claude-haiku-4.5', inputTokens, outputTokens)
          const geminiCost = await manager.calculateCost('gemini-flash-3.1', inputTokens, outputTokens)

          // Claude is more expensive than Gemini for same tokens
          // Claude: input 0.8, output 4.0 per 1M
          // Gemini: input 0.075, output 0.3 per 1M
          return claudeCost.totalCost > geminiCost.totalCost
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Zero Token Cost
   * **Validates: Requirements 1.4**
   *
   * Zero tokens should always result in zero cost, regardless of pricing.
   */
  it('should maintain invariant: zero tokens result in zero cost', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          const cost = await manager.calculateCost('claude-haiku-4.5', 0, 0)

          return cost.inputCost === 0 && cost.outputCost === 0 && cost.totalCost === 0
        }
      ),
      { numRuns: 10 }
    )
  })

  /**
   * Property: Cost Monotonicity
   * **Validates: Requirements 1.4**
   *
   * Cost must increase monotonically with token count.
   * If tokens increase, cost must increase or stay the same.
   */
  it('should maintain invariant: cost increases with token count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 500000 }),
        fc.integer({ min: 1, max: 500000 }),
        async (baseTokens, additionalTokens) => {
          const cost1 = await manager.calculateCost('claude-haiku-4.5', baseTokens, 0)
          const cost2 = await manager.calculateCost('claude-haiku-4.5', baseTokens + additionalTokens, 0)

          // Cost must increase or stay the same
          return cost2.totalCost >= cost1.totalCost
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Exchange Rate Monotonicity
   * **Validates: Requirements 1.12**
   *
   * Higher exchange rates must result in higher BRL amounts for same USD.
   */
  it('should maintain invariant: higher exchange rate produces higher BRL', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1000, noNaN: true }),
        fc.double({ min: 1, max: 5, noNaN: true }),
        fc.double({ min: 5.1, max: 10, noNaN: true }),
        (usd, rate1, rate2) => {
          const manager1 = new PricingManager(rate1)
          const manager2 = new PricingManager(rate2)

          const brl1 = manager1.convertUSDToBRL(usd)
          const brl2 = manager2.convertUSDToBRL(usd)

          // Higher exchange rate should produce higher BRL
          return brl2 > brl1
        }
      ),
      { numRuns: 100 }
    )
  })
})
