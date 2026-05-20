/**
 * Unit Tests: Hash Algorithm Detection (Argon2id only)
 */

import { describe, expect, it } from "vitest"
import {
    detectHashAlgorithm,
    getAlgorithmDescription,
    isArgon2idHashFormat,
} from "./hash-algorithm-detection"

const VALID_ARGON2 =
    "$argon2id$v=19$m=64000,t=3,p=2$abcdefghijklmnop$0123456789abcdef0123456789abcdef"

describe("Hash Algorithm Detection", () => {
    it("detects valid Argon2id hash", () => {
        const result = detectHashAlgorithm(VALID_ARGON2)
        expect(result.algorithm).toBe("argon2id")
        expect(result.version).toBe(19)
        expect(result.isValid).toBe(true)
    })

    it("rejects unknown formats", () => {
        for (const hash of ["not_a_valid_hash", "", null]) {
            const result = detectHashAlgorithm(hash)
            expect(result.algorithm).toBe("unknown")
            expect(result.isValid).toBe(false)
        }
    })

    it("detects incomplete Argon2id as invalid", () => {
        const result = detectHashAlgorithm("$argon2id$v=19$m=64000,t=3,p=2$")
        expect(result.algorithm).toBe("argon2id")
        expect(result.isValid).toBe(false)
    })

    it("isArgon2idHashFormat matches detection", () => {
        expect(isArgon2idHashFormat(VALID_ARGON2)).toBe(true)
        expect(isArgon2idHashFormat("invalid")).toBe(false)
    })

    it("getAlgorithmDescription for Argon2id and unknown", () => {
        expect(getAlgorithmDescription(VALID_ARGON2)).toContain("Argon2id")
        expect(getAlgorithmDescription("x")).toContain("Unknown")
    })
})
