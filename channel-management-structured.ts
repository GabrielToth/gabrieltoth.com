import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"

import { getChannelManagementBreadcrumbs } from "./channel-management-breadcrumbs"

export async function buildChannelManagementStructured(
    locale: Locale
): Promise<{
    serviceStructuredData: Record<string, unknown>
    faqs: Array<{ question: string; answer: string }>
    breadcrumbs: Array<{ name: string; url: string }>
    offerCatalog: Record<string, unknown>
}> {
    const t = await getTranslations({ locale, namespace: "channelManagement" })

    const serviceStructuredData = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "ViraTrend - Digital Growth Consulting",
        description: t("about.description"),
        brand: {
            "@type": "Brand",
            name: "ViraTrend",
        },
        category: "Digital Marketing Consulting",
        url: `https://www.gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/channel-management`,
        offers: {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            priceCurrency: "BRL",
            price: "0",
            description: t("services.subtitle"),
        },
        aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "5.0",
            ratingCount: "50",
            bestRating: "5",
            worstRating: "1",
        },
    } as Record<string, unknown>

    const faqsRaw = t.raw("faq.items") as Array<{
        question: string
        answer: string
    }>
    const faqs = faqsRaw.map(item => ({
        question: item.question,
        answer: item.answer,
    }))

    const breadcrumbs = getChannelManagementBreadcrumbs(locale)

    const localeToCurrency: Record<string, string> = {
        "pt-BR": "BRL",
        en: "USD",
        es: "EUR",
        de: "EUR",
    }
    const priceCurrency = localeToCurrency[locale] || "USD"
    const plans = t.raw("pricing.plans") as Array<{
        name: string
        basePrice: number
        description: string
        features: string[]
        popular?: boolean
    }>
    const pageUrl = `https://www.gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/channel-management`
    const offerCatalog = {
        "@context": "https://schema.org",
        "@type": "OfferCatalog",
        name: t("pricing.title"),
        itemListElement: plans.map(plan => ({
            "@type": "Offer",
            priceCurrency,
            price: plan.basePrice,
            itemOffered: {
                "@type": "Product",
                name: plan.name,
                description: plan.description,
                url: pageUrl,
                offers: {
                    "@type": "Offer",
                    priceCurrency,
                    price: plan.basePrice,
                    availability: "https://schema.org/InStock",
                    url: pageUrl,
                },
                aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: "5",
                    ratingCount: "25",
                    bestRating: "5",
                    worstRating: "1",
                },
                additionalProperty: plan.features.map(f => ({
                    "@type": "PropertyValue",
                    name: "Feature",
                    value: f,
                })),
            },
        })),
    } as Record<string, unknown>

    return { serviceStructuredData, faqs, breadcrumbs, offerCatalog }
}
