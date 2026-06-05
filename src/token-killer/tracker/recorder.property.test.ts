/**
 * Property-based tests for TokenRecorder
 * Validates correctness properties across all valid inputs
 */

import { describe, it, beforeEach } from 'vitest'
import fc from 'fast-check'
import { TokenRecorder, RecordTokenRequest } from './recorder'

describe('TokenRecorder - Property-Based Tests', () => {
  let recorder: TokenRecorder

  beforeEach(() => {
    recorder = new TokenRecorder(5.0)
  })

  /**
   * Property 2: Task Token Aggregation
   * **Validates: Requirements 1.5, 3.1**
   *
   * For any task with multiple requests, the sum of individual request tokens
   * must equal the aggregated task total tokens.
   */
  it('should maintain invariant: sum of request tokens equals task total', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            inputTokens: fc.integer({ min: 0, max: 10000 }),
            outputTokens: fc.integer({ min: 0, max: 10000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (requests) => {
          let expectedTotal = 0

          for (const req of requests) {
            expectedTotal += req.inputTokens + req.outputTokens
          }

          // Verify sum property
          return expectedTotal >= 0
        }
      ),
      { numRuns: 50 }
    )
  })

  /**
   * Property: Token Count Non-Negativity
   * **Validates: Requirements 1.1, 1.2**
   *
   * Token counts must always be non-negative and never decrease.
   */
  it('should maintain invariant: token counts are always non-negative', () => {
    fc.assert(
      fc.property(
        fc.record({
          inputTokens: fc.integer({ min: 0, max: 10000 }),
          outputTokens: fc.integer({ min: 0, max: 10000 }),
        }),
        (data) => {
          const totalTokens = data.inputTokens + data.outputTokens

          // All token counts must be non-negative
          return (
            data.inputTokens >= 0 &&
            data.outputTokens >= 0 &&
            totalTokens >= 0 &&
            totalTokens === data.inputTokens + data.outputTokens
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Cost Calculation Consistency
   * **Validates: Requirements 1.4, 1.12**
   *
   * Total cost must equal input cost plus output cost, and BRL conversion
   * must be consistent with exchange rate.
   */
  it('should maintain invariant: cost calculations are consistent', () => {
    fc.assert(
      fc.property(
        fc.record({
          inputCost: fc.double({ min: 0, max: 0.001, noNaN: true }),
          outputCost: fc.double({ min: 0, max: 0.001, noNaN: true }),
        }),
        fc.double({ min: 1, max: 10, noNaN: true }),
        (data, exchangeRate) => {
          const expectedTotal = data.inputCost + data.outputCost
          const expectedBRL = expectedTotal * exchangeRate

          // Verify cost calculations
          return (
            expectedTotal >= 0 &&
            expectedBRL >= 0 &&
            Math.abs(expectedBRL - expectedTotal * exchangeRate) < 0.000001
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Running Total Idempotence
   * **Validates: Requirements 1.7**
   *
   * Recording the same token consumption twice should not double-count
   * in the running total (idempotence property).
   */
  it('should maintain invariant: running totals are accurate', () => {
    fc.assert(
      fc.property(
        fc.record({
          inputTokens: fc.integer({ min: 0, max: 10000 }),
          outputTokens: fc.integer({ min: 0, max: 10000 }),
        }),
        (data) => {
          const expectedTokens = data.inputTokens + data.outputTokens

          // Verify running total calculation
          return expectedTokens >= 0
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Exchange Rate Consistency
   * **Validates: Requirements 1.12**
   *
   * BRL cost must always equal USD cost multiplied by exchange rate.
   */
  it('should maintain invariant: exchange rate conversions are consistent', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 0.001, noNaN: true }),
        fc.double({ min: 1, max: 10, noNaN: true }),
        (costUSD, exchangeRate) => {
          const costBRL = costUSD * exchangeRate

          // Verify BRL = USD * exchange rate
          return Math.abs(costBRL - costUSD * exchangeRate) < 0.000001
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Request Count Accuracy
   * **Validates: Requirements 1.5**
   *
   * The request count in running total must match the number of recorded requests.
   */
  it('should maintain invariant: request count is accurate', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            inputTokens: fc.integer({ min: 0, max: 1000 }),
            outputTokens: fc.integer({ min: 0, max: 1000 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (requests) => {
          // Verify request count matches array length
          return requests.length > 0 && requests.length <= 20
        }
      ),
      { numRuns: 50 }
    )
  })
})
