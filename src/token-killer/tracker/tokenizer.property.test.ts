/**
 * Property-based tests for tokenizer module
 * Validates: Requirements 1.1, 1.2
 * Property 1: Token Count Consistency
 */

import { describe, it, expect } from "vitest"
import fc from "fast-check"
import { TokenizerFactory } from "./tokenizer"

describe("Tokenizer - Property-Based Tests", () => {
    describe("Property 1: Token Count Consistency", () => {
        /**
         * Validates: Requirements 1.1, 1.2
         *
         * Property: Token count for the same text should always be the same
         * (idempotence property)
         */
        it("should return consistent token counts for same input", () => {
            fc.assert(
                fc.property(fc.string(), text => {
                    const count1 = TokenizerFactory.countInputTokens(
                        text,
                        "claude-haiku-4.5"
                    )
                    const count2 = TokenizerFactory.countInputTokens(
                        text,
                        "claude-haiku-4.5"
                    )
                    const count3 = TokenizerFactory.countInputTokens(
                        text,
                        "claude-haiku-4.5"
                    )

                    return count1 === count2 && count2 === count3
                })
            )
        })

        /**
         * Property: Token count should never be negative
         */
        it("should never return negative token counts", () => {
            fc.assert(
                fc.property(fc.string(), text => {
                    const count = TokenizerFactory.countInputTokens(
                        text,
                        "claude-haiku-4.5"
                    )
                    return count >= 0
                })
            )
        })

        /**
         * Property: Empty string should have 0 tokens
         */
        it("should return 0 tokens for empty string", () => {
            const count = TokenizerFactory.countInputTokens(
                "",
                "claude-haiku-4.5"
            )
            expect(count).toBe(0)
        })

        /**
         * Property: Token count should scale with text length
         * Longer text should have more or equal tokens
         */
        it("should scale token count with text length", () => {
            fc.assert(
                fc.property(fc.string(), fc.string(), (text1, text2) => {
                    const count1 = TokenizerFactory.countInputTokens(
                        text1,
                        "claude-haiku-4.5"
                    )
                    const count2 = TokenizerFactory.countInputTokens(
                        text1 + text2,
                        "claude-haiku-4.5"
                    )

                    // Combined text should have >= tokens than first text alone
                    return count2 >= count1
                })
            )
        })

        /**
         * Property: Input and output token counts should be the same for same text
         */
        it("should return same count for input and output tokens", () => {
            fc.assert(
                fc.property(fc.string(), text => {
                    const inputCount = TokenizerFactory.countInputTokens(
                        text,
                        "claude-haiku-4.5"
                    )
                    const outputCount = TokenizerFactory.countOutputTokens(
                        text,
                        "claude-haiku-4.5"
                    )

                    return inputCount === outputCount
                })
            )
        })

        /**
         * Property: All supported models should return positive counts for non-empty text
         */
        it("should return positive counts for all models with non-empty text", () => {
            fc.assert(
                fc.property(fc.string({ minLength: 1 }), text => {
                    const models = [
                        "claude-haiku-4.5",
                        "gemini-flash-3.1",
                        "cursor-composer-2.0",
                        "gpt-4",
                        "gpt-3.5-turbo",
                    ] as const

                    return models.every(model => {
                        const count = TokenizerFactory.countInputTokens(
                            text,
                            model
                        )
                        return count > 0
                    })
                })
            )
        })

        /**
         * Property: Token count should be deterministic across different models
         * (same text should produce similar token counts)
         */
        it("should produce similar token counts across models", () => {
            fc.assert(
                fc.property(fc.string({ minLength: 1 }), text => {
                    const claudeCount = TokenizerFactory.countInputTokens(
                        text,
                        "claude-haiku-4.5"
                    )
                    const geminiCount = TokenizerFactory.countInputTokens(
                        text,
                        "gemini-flash-3.1"
                    )
                    const cursorCount = TokenizerFactory.countInputTokens(
                        text,
                        "cursor-composer-2.0"
                    )

                    // All counts should be positive
                    if (
                        claudeCount <= 0 ||
                        geminiCount <= 0 ||
                        cursorCount <= 0
                    ) {
                        return false
                    }

                    // Counts should be within 50% of each other
                    const maxCount = Math.max(
                        claudeCount,
                        geminiCount,
                        cursorCount
                    )
                    const minCount = Math.min(
                        claudeCount,
                        geminiCount,
                        cursorCount
                    )
                    const variance = (maxCount - minCount) / minCount

                    return variance <= 0.5
                })
            )
        })

        /**
         * Property: Verification should be consistent
         * If verification passes for a count, it should pass for the same count again
         */
        it("should verify token counts consistently", () => {
            fc.assert(
                fc.property(fc.string(), text => {
                    const count = TokenizerFactory.countInputTokens(
                        text,
                        "claude-haiku-4.5"
                    )
                    const verified1 = TokenizerFactory.verifyTokenCount(
                        text,
                        "claude-haiku-4.5",
                        count
                    )
                    const verified2 = TokenizerFactory.verifyTokenCount(
                        text,
                        "claude-haiku-4.5",
                        count
                    )

                    return verified1 === verified2
                })
            )
        })

        /**
         * Property: Token count should be bounded by text length
         * Token count should never exceed text length (since each token is at least 1 character)
         */
        it("should not exceed text length in characters", () => {
            fc.assert(
                fc.property(fc.string(), text => {
                    const count = TokenizerFactory.countInputTokens(
                        text,
                        "claude-haiku-4.5"
                    )
                    // Token count should not exceed text length
                    return count <= text.length
                })
            )
        })

        /**
         * Property: Fallback tokenizer should use approximate counting
         * For unknown models, should use 4 chars per token approximation
         */
        it("should use approximate counting for unknown models", () => {
            fc.assert(
                fc.property(fc.string(), text => {
                    const count = TokenizerFactory.countInputTokens(
                        text,
                        "unknown"
                    )
                    const approximateCount = Math.ceil(text.length / 4)

                    return count === approximateCount
                })
            )
        })

        /**
         * Property: Token count should be monotonic
         * Adding more text should never decrease token count
         */
        it("should maintain monotonic token count", () => {
            fc.assert(
                fc.property(fc.string(), fc.string(), (text1, text2) => {
                    const count1 = TokenizerFactory.countInputTokens(
                        text1,
                        "claude-haiku-4.5"
                    )
                    const count2 = TokenizerFactory.countInputTokens(
                        text1 + text2,
                        "claude-haiku-4.5"
                    )
                    const count3 = TokenizerFactory.countInputTokens(
                        text1 + text2 + text2,
                        "claude-haiku-4.5"
                    )

                    return count1 <= count2 && count2 <= count3
                })
            )
        })

        /**
         * Property: Special characters should be counted
         * Text with special characters should have non-zero token count
         */
        it("should count special characters", () => {
            fc.assert(
                fc.property(
                    fc
                        .string({ minLength: 1 })
                        .filter(s => /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(s)),
                    text => {
                        const count = TokenizerFactory.countInputTokens(
                            text,
                            "claude-haiku-4.5"
                        )
                        return count > 0
                    }
                )
            )
        })

        /**
         * Property: Unicode characters should be counted
         * Text with unicode should have non-zero token count
         */
        it("should count unicode characters", () => {
            fc.assert(
                fc.property(
                    fc
                        .string({ minLength: 1 })
                        .filter(s => /[^\x00-\x7F]/.test(s)),
                    text => {
                        const count = TokenizerFactory.countInputTokens(
                            text,
                            "claude-haiku-4.5"
                        )
                        return count > 0
                    }
                )
            )
        })

        /**
         * Property: Whitespace should be counted
         * Text with only whitespace should have non-zero token count
         */
        it("should count whitespace characters", () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1 }).filter(s => /^\s+$/.test(s)),
                    text => {
                        const count = TokenizerFactory.countInputTokens(
                            text,
                            "claude-haiku-4.5"
                        )
                        return count > 0
                    }
                )
            )
        })

        /**
         * Property: Repeated text should scale linearly
         * Repeating text N times should result in approximately N times the tokens
         */
        it("should scale linearly with repeated text", () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1 }),
                    fc.integer({ min: 2, max: 5 }),
                    (text, n) => {
                        const singleCount = TokenizerFactory.countInputTokens(
                            text,
                            "claude-haiku-4.5"
                        )
                        const repeatedCount = TokenizerFactory.countInputTokens(
                            text.repeat(n),
                            "claude-haiku-4.5"
                        )

                        // Repeated text should have approximately n times the tokens
                        const ratio = repeatedCount / singleCount
                        const expectedRatio = n

                        // Allow 20% variance due to tokenization boundaries
                        return (
                            Math.abs(ratio - expectedRatio) / expectedRatio <=
                            0.2
                        )
                    }
                )
            )
        })
    })
})
