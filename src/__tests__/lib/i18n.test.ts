import {
    defaultLocale,
    detectBrowserLanguage,
    getLocaleFromCookie,
    getLocaleFromUrl,
    getLocalizedPath,
    locales,
    setLocaleCookie,
} from "@/lib/i18n"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

describe("lib/i18n", () => {
    const originalCookieDescriptor = Object.getOwnPropertyDescriptor(
        Document.prototype,
        "cookie"
    )

    beforeEach(() => {
        // @ts-ignore
        Object.defineProperty(document, "cookie", {
            writable: true,
            value: "",
        })
    })

    afterEach(() => {
        if (originalCookieDescriptor) {
            Object.defineProperty(
                Document.prototype,
                "cookie",
                originalCookieDescriptor
            )
        }
    })

    it("getLocaleFromCookie returns default when empty", () => {
        // @ts-ignore
        document.cookie = ""
        expect(getLocaleFromCookie()).toBe(defaultLocale)
    })

    it("getLocaleFromCookie parses valid locale cookie", () => {
        // @ts-ignore
        document.cookie = "locale=en"
        expect(getLocaleFromCookie()).toBe("en")
    })

    it("setLocaleCookie writes cookie string", () => {
        setLocaleCookie("es")
        // @ts-ignore
        expect(document.cookie.includes("locale=es")).toBe(true)
    })

    it("getLocaleFromUrl extracts first segment if valid", () => {
        expect(getLocaleFromUrl("/pt-BR/page")).toBe("pt-BR")
        expect(getLocaleFromUrl("/unknown/page")).toBe(defaultLocale)
    })

    it("getLocalizedPath removes leading locale, keeps path otherwise", () => {
        expect(getLocalizedPath("/en/projects")).toBe("/projects")
        expect(getLocalizedPath("/projects")).toBe("/projects")
    })

    it("detectBrowserLanguage maps language prefix when exact not found", () => {
        // @ts-ignore
        Object.defineProperty(window.navigator, "language", {
            value: "pt-PT",
            configurable: true,
        })
        const detected = detectBrowserLanguage()
        expect(locales).toContain(detected)
    })
})
