import { describe, expect, it } from "vitest"
import enPrivacy from "@/i18n/en/privacyPolicy.json"
import ptPrivacy from "@/i18n/pt-BR/privacyPolicy.json"
import esPrivacy from "@/i18n/es/privacyPolicy.json"
import dePrivacy from "@/i18n/de/privacyPolicy.json"
import frPrivacy from "@/i18n/fr/privacyPolicy.json"

import enTerms from "@/i18n/en/termsOfService.json"
import ptTerms from "@/i18n/pt-BR/termsOfService.json"
import esTerms from "@/i18n/es/termsOfService.json"
import deTerms from "@/i18n/de/termsOfService.json"
import frTerms from "@/i18n/fr/termsOfService.json"

describe("Google & YouTube API Compliance Policies", () => {
    const locales = [
        { locale: "en", privacy: enPrivacy, terms: enTerms },
        { locale: "pt-BR", privacy: ptPrivacy, terms: ptTerms },
        { locale: "es", privacy: esPrivacy, terms: esTerms },
        { locale: "de", privacy: dePrivacy, terms: deTerms },
        { locale: "fr", privacy: frPrivacy, terms: frTerms },
    ]

    for (const { locale, privacy, terms } of locales) {
        describe(`Locale: ${locale}`, () => {
            it("should contain dedicated Google/YouTube section in Privacy Policy", () => {
                const sections = privacy.sections as Array<{
                    title: string
                    content: string
                }>
                const googleSection = sections.find(
                    s =>
                        s.title.includes("Google") &&
                        s.title.includes("YouTube")
                )
                expect(googleSection).toBeDefined()
                expect(googleSection?.content).toContain(
                    "https://www.youtube.com/t/terms"
                )
                expect(googleSection?.content).toContain(
                    "https://policies.google.com/privacy"
                )
                expect(googleSection?.content).toContain(
                    "https://myaccount.google.com/permissions"
                )
            })

            it("should contain YouTube API Services section in Terms of Service", () => {
                const sections = terms.sections as Record<
                    string,
                    { title: string; text: string }
                >
                const youtubeSection = sections.youtubeApi
                expect(youtubeSection).toBeDefined()
                expect(youtubeSection.text).toContain(
                    "https://www.youtube.com/t/terms"
                )
                expect(youtubeSection.text).toContain(
                    "https://policies.google.com/privacy"
                )
                expect(youtubeSection.text).toContain(
                    "https://myaccount.google.com/permissions"
                )
            })
        })
    }
})
