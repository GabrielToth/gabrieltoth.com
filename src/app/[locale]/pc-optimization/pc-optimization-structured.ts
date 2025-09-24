import { getCurrencyForLocale } from "@/lib/currency"
import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"
import { type PCOptimizationPlan } from "./pc-optimization-types"

export async function buildPCOptimizationStructured(locale: Locale): Promise<{
    howTo: Record<string, unknown>
    offerCatalog: Record<string, unknown>
    breadcrumbs: Array<{ name: string; url: string }>
}> {
    const t = await getTranslations({ locale, namespace: "pcOptimization" })

    const howTo = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: t("hero.title"),
        description: t("hero.subtitle"),
        step: [
            {
                "@type": "HowToStep",
                name: t("pricing.title"),
                text: t("pricing.subtitle"),
            },
            {
                "@type": "HowToStep",
                name: t("cta.title"),
                text: t("cta.subtitle"),
            },
        ],
    } as Record<string, unknown>

    const priceCurrency = getCurrencyForLocale(locale)
    const plans = t.raw("pricing.plans") as PCOptimizationPlan[]
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
                additionalProperty: plan.features.map(f => ({
                    "@type": "PropertyValue",
                    name: "Feature",
                    value: f,
                })),
            },
        })),
    } as Record<string, unknown>

    const breadcrumbs = [
        {
            name: t("hero.badge"),
            url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/pc-optimization`,
        },
    ]

    return { howTo, offerCatalog, breadcrumbs }
}
