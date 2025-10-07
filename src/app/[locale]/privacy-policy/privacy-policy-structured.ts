import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"

export async function buildPrivacyPolicyStructured(locale: Locale): Promise<{
    breadcrumbs: Array<{ name: string; url: string }>
    webPageStructuredData: Record<string, unknown>
    sections: Array<{ title: string; content: string }>
}> {
    const t = await getTranslations({ locale, namespace: "privacyPolicy" })

    const breadcrumbs = (
        t.raw("breadcrumbs") as Array<{ name: string; href: string }>
    ).map(b => ({
        name: b.name,
        url: `https://www.gabrieltoth.com${locale === "en" ? "" : `/${locale}`}${b.href}`,
    }))

    const sections = t.raw("sections") as Array<{
        title: string
        content: string
    }>

    const webPageStructuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: t("title"),
        /* c8 ignore next */
        description: (sections[0]?.content || "").slice(0, 160) || t("title"),
        url: `https://www.gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/privacy-policy`,
        isPartOf: {
            "@type": "WebSite",
            name: "Gabriel Toth Portfolio",
            url: "https://www.gabrieltoth.com",
        },
        about: {
            "@type": "Thing",
            name: "Data Protection",
        },
    }

    return { breadcrumbs, webPageStructuredData, sections }
}
