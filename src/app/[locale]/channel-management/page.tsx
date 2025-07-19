import StructuredData from "@/components/seo/structured-data"
import { type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"
import ChannelManagementView from "./channel-management-view"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    const seoConfig = generateSeoConfig({
        locale,
        path: "/channel-management",
        title: isPortuguese
            ? "ViraTrend - Consultoria de Crescimento Digital - Gabriel Toth"
            : "ViraTrend - Digital Growth Consulting - Gabriel Toth",
        description: isPortuguese
            ? "ViraTrend: Transforme seu canal em uma máquina de crescimento. Consultoria especializada em analytics, otimização de conteúdo e estratégias de monetização para criadores de conteúdo."
            : "ViraTrend: Transform your channel into a growth machine. Specialized consulting in analytics, content optimization and monetization strategies for content creators.",
        keywords: isPortuguese
            ? [
                  "ViraTrend",
                  "consultoria crescimento digital",
                  "consultoria youtube",
                  "analytics",
                  "otimização de conteúdo",
                  "monetização",
                  "crescimento de canal",
              ]
            : [
                  "ViraTrend",
                  "digital growth consulting",
                  "youtube consulting",
                  "analytics",
                  "content optimization",
                  "monetization",
                  "channel growth",
              ],
    })

    return {
        title: seoConfig.title,
        description: seoConfig.description,
        keywords: seoConfig.additionalMetaTags?.find(
            tag => tag.name === "keywords"
        )?.content,
        robots: seoConfig.additionalMetaTags?.find(tag => tag.name === "robots")
            ?.content,
        openGraph: {
            title: seoConfig.openGraph?.title,
            description: seoConfig.openGraph?.description,
            url: seoConfig.canonical,
            type: "website",
            locale: seoConfig.openGraph?.locale,
            images: [
                {
                    url: "https://gabrieltoth.com/og-image-viratrend.jpg",
                    width: 1200,
                    height: 630,
                    alt: seoConfig.title,
                    type: "image/jpeg",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: seoConfig.title,
            description: seoConfig.description,
        },
        alternates: {
            canonical: seoConfig.canonical,
            languages: {
                en: "https://gabrieltoth.com/channel-management",
                "pt-BR": "https://gabrieltoth.com/pt-BR/channel-management",
                "x-default": "https://gabrieltoth.com/channel-management",
            },
        },
    }
}

export default async function ChannelManagementPage({ params }: PageProps) {
    const { locale } = await params

    // Generate structured data for the service
    const serviceStructuredData = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "ViraTrend - Digital Growth Consulting",
        description:
            locale === "pt-BR"
                ? "Consultoria especializada em crescimento digital para criadores de conteúdo"
                : "Specialized digital growth consulting for content creators",
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
            description:
                locale === "pt-BR"
                    ? "Consultoria personalizada para crescimento de canais"
                    : "Personalized channel growth consulting",
        },
        areaServed: {
            "@type": "Country",
            name: "Brazil",
        },
        serviceType: "Digital Marketing",
        additionalType: "https://schema.org/ConsultingService",
    }

    return (
        <>
            <StructuredData
                locale={locale}
                type="person"
                customData={serviceStructuredData}
            />
            <ChannelManagementView locale={locale} />
        </>
    )
}
