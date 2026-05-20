/**
 * Unit Tests: Hash Format Validation (Argon2id only)
 */

import { logger } from "@/lib/logger"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    getGenericHashValidationError,
    isValidHashFormat,
    validateHashFormat,
} from "./hash-format-validator"

vi.mock("@/lib/logger", () => ({
    logger: {
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

const VALID_ARGON2 =
    "$argon2id$v=19$m=64000,t=3,p=2$abcdefghijklmnop$0123456789abcdef0123456789abcdef"

describe("Hash Format Validation", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("accepts valid Argon2id hash", () => {
        const result = validateHashFormat(VALID_ARGON2)
        expect(result.isValid).toBe(true)
        expect(result.algorithm).toBe("argon2id")
        expect(logger.warn).not.toHaveBeenCalled()
    })

    it("rejects non-Argon2id hash", () => {
        const result = validateHashFormat("not-a-valid-password-hash")
        expect(result.isValid).toBe(false)
        expect(result.algorithm).toBe("unknown")
        expect(logger.warn).toHaveBeenCalled()
    })

    it("isValidHashFormat and generic error", () => {
        expect(isValidHashFormat(VALID_ARGON2)).toBe(true)
        expect(isValidHashFormat("bad")).toBe(false)
        expect(getGenericHashValidationError()).toBe("Authentication failed")
    })
})
