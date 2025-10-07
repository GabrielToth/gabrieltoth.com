import { describe, expect, it } from "vitest"

describe("lib/i18n coverage", () => {
    it("gets and sets locale via cookie helpers and parses URL", async () => {
        const mod = await import("@/lib/i18n")

        // getLocaleFromUrl
        expect(mod.getLocaleFromUrl("/en/page")).toBe("en")
        expect(mod.getLocaleFromUrl("/unknown")).toBe(mod.defaultLocale)

        // getLocalizedPath removes leading locale
        expect(mod.getLocalizedPath("/pt-BR/path")).toBe("/path")
        expect(mod.getLocalizedPath("/es")).toBe("/")

        // Cookie path (simulate browser)
        Object.defineProperty(global, "window", {
            value: {},
            writable: true,
        })
        Object.defineProperty(global, "document", {
            value: {
                cookie: "locale=en",
            },
            writable: true,
        })
        expect(mod.getLocaleFromCookie()).toBe("en")
        mod.setLocaleCookie("de")
        expect(String((document as any).cookie)).toContain("locale=")
    })

    it("detects browser language with prefix fallback", async () => {
        const mod = await import("@/lib/i18n")
        Object.defineProperty(global, "window", {
            value: {},
            writable: true,
        })
        Object.defineProperty(global, "navigator", {
            value: { language: "es-MX" },
            writable: true,
        })
        expect(mod.detectBrowserLanguage()).toBe("es")
    })
})
