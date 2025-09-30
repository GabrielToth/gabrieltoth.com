import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"
import {
    type TermsContent,
    type TermsSectionsMap,
} from "./terms-of-service-types"

export async function buildTermsOfServiceStructured(locale: Locale): Promise<{
    breadcrumbs: Array<{ name: string; url: string }>
    webPageStructuredData: Record<string, unknown>
    content: TermsContent
}> {
    const t = await getTranslations({ locale, namespace: "termsOfService" })

    const breadcrumbs = (
        t.raw("breadcrumbs") as Array<{ name: string; href: string }>
    ).map(b => ({
        name: b.name,
        url: `https://www.gabrieltoth.com${locale === "en" ? "" : `/${locale}`}${b.href}`,
    }))

    const webPageStructuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: t("title"),
        description:
            (
                (
                    t.raw("sections") as Record<
                        string,
                        { title: string; text: string }
                    >
                )?.acceptance?.text || ""
            ).slice(0, 160) || t("title"),
        url: `https://www.gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/terms-of-service`,
        isPartOf: {
            "@type": "WebSite",
            name: "Gabriel Toth Portfolio",
            url: "https://www.gabrieltoth.com",
        },
        about: {
            "@type": "Thing",
            name: t("title"),
        },
    }

    const s = t.raw("sections") as TermsSectionsMap
    const content: TermsContent = {
        title: t("title"),
        lastUpdated: t("lastUpdated"),
        acceptance: s.acceptance,
        services: s.services,
        responsibilities: s.responsibilities,
        limitations: s.limitations,
        privacy: s.privacy,
        modifications: s.modifications,
        termination: s.termination,
        governing: s.governing,
        contact: s.contact,
    }

    return { breadcrumbs, webPageStructuredData, content }
}
