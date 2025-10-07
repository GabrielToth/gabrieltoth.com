import { getCurrencyForLocale } from "@/lib/currency"
import { describe, expect, it } from "vitest"

describe("lib/currency", () => {
    it("maps locales to currency and defaults to USD", () => {
        expect(getCurrencyForLocale("pt-BR")).toBe("BRL")
        expect(getCurrencyForLocale("en")).toBe("USD")
        expect(getCurrencyForLocale("es")).toBe("EUR")
        expect(getCurrencyForLocale("de")).toBe("EUR")
        expect(getCurrencyForLocale("unknown")).toBe("USD")
    })
})
