import { type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"

interface TermsOfServicePageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: TermsOfServicePageProps): Promise<Metadata> {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    const seoConfig = generateSeoConfig({
        locale,
        path: "/terms-of-service",
        title: isPortuguese
            ? "Termos de Serviço - Gabriel Toth"
            : "Terms of Service - Gabriel Toth",
        description: isPortuguese
            ? "Termos de serviço da Gabriel Toth. Conheça as condições de uso de nossos serviços de consultoria digital, otimização de PC e desenvolvimento."
            : "Gabriel Toth terms of service. Learn about the usage conditions for our digital consulting, PC optimization and development services.",
        keywords: isPortuguese
            ? [
                  "termos de serviço",
                  "condições de uso",
                  "contrato",
                  "serviços",
                  "gabriel toth",
                  "consultoria",
              ]
            : [
                  "terms of service",
                  "terms of use",
                  "contract",
                  "services",
                  "gabriel toth",
                  "consulting",
              ],
        ogType: "website",
        ogImage: "https://gabrieltoth.com/og-image-terms.jpg",
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
            canonical: isPortuguese
                ? "https://gabrieltoth.com/pt-BR/terms-of-service"
                : "https://gabrieltoth.com/en/terms-of-service",
            languages: {
                en: "https://gabrieltoth.com/en/terms-of-service",
                "pt-BR": "https://gabrieltoth.com/pt-BR/terms-of-service",
                "x-default": "https://gabrieltoth.com/en/terms-of-service",
            },
        },
    }
}
