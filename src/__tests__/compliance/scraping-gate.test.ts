import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
    isOfficialOnlyMode,
    isUnofficialScrapingAllowed,
} from "@/lib/compliance/scraping-gate"

/**
 * The compliance gate MUST default to OFF and only allow scraping when the
 * env var is explicitly "true". This protects the public CNPJ-entity site
 * from unintentionally scraping third-party pages.
 */
describe("scraping-gate", () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it("defaults to OFF when unset", () => {
        vi.stubEnv("ALLOW_UNOFFICIAL_SCRAPING", "")
        delete process.env.ALLOW_UNOFFICIAL_SCRAPING
        expect(isUnofficialScrapingAllowed()).toBe(false)
        expect(isOfficialOnlyMode()).toBe(true)
    })

    it("stays OFF for any value other than 'true'", () => {
        for (const v of ["false", "1", "yes", "TRUE!", "on", "  "]) {
            vi.stubEnv("ALLOW_UNOFFICIAL_SCRAPING", v)
            expect(isUnofficialScrapingAllowed()).toBe(false)
        }
    })

    it("allows scraping only for exact 'true'", () => {
        vi.stubEnv("ALLOW_UNOFFICIAL_SCRAPING", "true")
        expect(isUnofficialScrapingAllowed()).toBe(true)
        expect(isOfficialOnlyMode()).toBe(false)
    })

    it("is case/whitespace tolerant for the truthy value", () => {
        vi.stubEnv("ALLOW_UNOFFICIAL_SCRAPING", "  TRUE  ")
        expect(isUnofficialScrapingAllowed()).toBe(true)
    })
})
