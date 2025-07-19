import { type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"

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
                  "gabriel toth",
              ]
            : [
                  "ViraTrend",
                  "digital growth consulting",
                  "youtube consulting",
                  "analytics",
                  "content optimization",
                  "monetization",
                  "channel growth",
                  "gabriel toth",
              ],
        ogType: "website",
        ogImage: "https://gabrieltoth.com/og-image-viratrend.jpg",
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
            type: seoConfig.openGraph?.type as "website",
            locale: seoConfig.openGraph?.locale,
            images: seoConfig.openGraph?.images?.map(img => ({
                url: img.url!,
                width: img.width,
                height: img.height,
                alt: img.alt!,
                type: img.type,
            })),
            siteName: "Gabriel Toth Portfolio",
        },
        twitter: {
            card: seoConfig.twitter?.card as "summary_large_image",
            title: seoConfig.twitter?.title,
            description: seoConfig.twitter?.description,
            images: seoConfig.twitter?.images,
            creator: seoConfig.twitter?.creator,
            site: seoConfig.twitter?.site,
        },
        alternates: {
            canonical: seoConfig.canonical,
            languages: {
                en: "https://gabrieltoth.com/en/channel-management",
                "pt-BR": "https://gabrieltoth.com/pt-BR/channel-management",
                "x-default": "https://gabrieltoth.com/en/channel-management",
            },
        },
    }
}
