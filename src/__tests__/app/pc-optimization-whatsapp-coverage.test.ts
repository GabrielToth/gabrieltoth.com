import { describe, expect, it } from "vitest"

describe("pc-optimization whatsapp coverage", () => {
    it("generates EN message with wa.me url", async () => {
        const { generatePCOptimizationWhatsAppMessage } =
            await import("@/app/[locale]/pc-optimization/pc-optimization-whatsapp")
        const url = generatePCOptimizationWhatsAppMessage("en")
        expect(url.startsWith("https://wa.me/")).toBe(true)
        expect(url).toContain("Hello! I'm interested")
    })

    it("generates PT-BR message variant", async () => {
        const { generatePCOptimizationWhatsAppMessage } =
            await import("@/app/[locale]/pc-optimization/pc-optimization-whatsapp")
        const url = generatePCOptimizationWhatsAppMessage("pt-BR")
        expect(url).toContain("wa.me/")
        expect(decodeURIComponent(url)).toContain("Olá! Tenho interesse")
    })
})

import { generatePCOptimizationWhatsAppMessage } from "@/app/[locale]/pc-optimization/pc-optimization-whatsapp"

describe("pc-optimization whatsapp generator coverage", () => {
    it("returns wa.me link for all supported locales and default", () => {
        for (const loc of ["pt-BR", "es", "de", "en"]) {
            const url = generatePCOptimizationWhatsAppMessage(loc)
            expect(url).toMatch(/^https:\/\/wa\.me\//)
        }
    })
})
