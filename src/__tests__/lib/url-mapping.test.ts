import { describe, expect, it } from "vitest"

import { getLocalizedUrl, getRouteKeyFromPath } from "@/lib/url-mapping"

describe("getRouteKeyFromPath", () => {
    it("resolves English about-me to about-me key", () => {
        expect(getRouteKeyFromPath("about-me")).toBe("about-me")
    })

    it("resolves Portuguese quem-sou-eu to about-me key", () => {
        expect(getRouteKeyFromPath("quem-sou-eu")).toBe("about-me")
    })

    it("resolves Spanish acerca-de-mi to about-me key", () => {
        expect(getRouteKeyFromPath("acerca-de-mi")).toBe("about-me")
    })

    it("resolves German uber-mich to about-me key", () => {
        expect(getRouteKeyFromPath("uber-mich")).toBe("about-me")
    })

    it("resolves French a-propos-de-moi to about-me key", () => {
        expect(getRouteKeyFromPath("a-propos-de-moi")).toBe("about-me")
    })

    it("resolves nested minecraft/modpacks slug", () => {
        expect(getRouteKeyFromPath("minecraft/modpacks")).toBe(
            "minecraft-modpacks"
        )
    })

    it("returns path as-is for unmapped routes", () => {
        expect(getRouteKeyFromPath("blog")).toBe("blog")
        expect(getRouteKeyFromPath("dashboard")).toBe("dashboard")
        expect(getRouteKeyFromPath("settings")).toBe("settings")
    })

    it("strips leading/trailing slashes", () => {
        expect(getRouteKeyFromPath("/about-me/")).toBe("about-me")
    })
})

describe("getLocalizedUrl", () => {
    it("maps about-me to correct slugs per locale", () => {
        expect(getLocalizedUrl("about-me", "en")).toBe("about-me")
        expect(getLocalizedUrl("about-me", "pt-BR")).toBe("quem-sou-eu")
        expect(getLocalizedUrl("about-me", "es")).toBe("acerca-de-mi")
        expect(getLocalizedUrl("about-me", "de")).toBe("uber-mich")
        expect(getLocalizedUrl("about-me", "fr")).toBe("a-propos-de-moi")
    })

    it("returns key for unmapped routes", () => {
        expect(getLocalizedUrl("blog", "pt-BR")).toBe("blog")
        expect(getLocalizedUrl("dashboard", "es")).toBe("dashboard")
    })

    it("handles nested minecraft paths consistently", () => {
        expect(getLocalizedUrl("minecraft-modpacks", "pt-BR")).toBe(
            "minecraft/modpacks"
        )
        expect(getLocalizedUrl("minecraft-modpacks", "en")).toBe(
            "minecraft/modpacks"
        )
    })
})
