import Footer from "@/components/layout/footer"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"
import { generateMetadata } from "./channel-management-metadata"
import ChannelManagementView from "./channel-management-view"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata }

export default async function ChannelManagementPage({ params }: PageProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "channelManagement" })

    // Generate structured data for the service
    const serviceStructuredData = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "ViraTrend - Digital Growth Consulting",
        description: t("about.description"),
        provider: {
            "@type": "Person",
            name: "Gabriel Toth Gonçalves",
            url: "https://gabrieltoth.com",
        },
        category: "Digital Marketing Consulting",
        url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/channel-management`,
        offers: {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            priceCurrency: "BRL",
            priceRange: "$$",
            description: t("services.subtitle"),
        },
        areaServed: {
            "@type": "Country",
            name: "Brazil",
        },
        serviceType: "Digital Marketing",
        additionalType: "https://schema.org/ConsultingService",
        aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "5.0",
            ratingCount: "50",
            bestRating: "5",
            worstRating: "1",
        },
    }

    const faqs = (
        t.raw("faq.items") as Array<{ question: string; answer: string }>
    ).map((item: any) => ({ question: item.question, answer: item.answer }))

    // Custom breadcrumbs
    const breadcrumbs = [
        {
            name: t("services.title"),
            url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}`,
        },
        {
            name: t("hero.badge"),
            url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/channel-management`,
        },
    ]

    return (
        <>
            <StructuredData
                locale={locale}
                type="all"
                customData={serviceStructuredData}
                breadcrumbs={breadcrumbs}
                faqs={faqs}
            />

            <main className="min-h-screen bg-white dark:bg-gray-900 relative">
                <ChannelManagementView locale={locale} />

                {/* Breadcrumbs overlay */}
                <div className="absolute top-0 left-0 z-40 pointer-events-none">
                    <div className="container mx-auto px-4 py-8">
                        <div className="pointer-events-auto">
                            <Breadcrumbs
                                items={breadcrumbs.map((item, index) => ({
                                    name: item.name,
                                    href: item.url.replace(
                                        "https://gabrieltoth.com",
                                        ""
                                    ),
                                    current: index === breadcrumbs.length - 1,
                                }))}
                                hideHome={true}
                                className="mb-6"
                            />
                        </div>
                    </div>
                </div>

                <Footer locale={locale} />
            </main>
        </>
    )
}

export const revalidate = 3600
