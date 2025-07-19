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
        path: "/pc-optimization/terms",
        title: isPortuguese
            ? "Termos de Otimização de PC - Gabriel Toth"
            : "PC Optimization Terms - Gabriel Toth",
        description: isPortuguese
            ? "Termos e condições específicos para serviços de otimização de PC Gaming. Conheça as condições de uso, garantias e responsabilidades."
            : "Specific terms and conditions for Gaming PC optimization services. Learn about usage conditions, warranties and responsibilities.",
        keywords: isPortuguese
            ? [
                  "termos otimização pc",
                  "condições uso",
                  "garantia pc",
                  "responsabilidades",
                  "gabriel toth",
              ]
            : [
                  "pc optimization terms",
                  "usage conditions",
                  "pc warranty",
                  "responsibilities",
                  "gabriel toth",
              ],
        ogType: "website",
        ogImage: "https://gabrieltoth.com/og-image-pc-optimization.jpg",
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
                ? "https://gabrieltoth.com/pt-BR/pc-optimization/terms"
                : "https://gabrieltoth.com/en/pc-optimization/terms",
            languages: {
                en: "https://gabrieltoth.com/en/pc-optimization/terms",
                "pt-BR": "https://gabrieltoth.com/pt-BR/pc-optimization/terms",
                "x-default": "https://gabrieltoth.com/en/pc-optimization/terms",
            },
        },
    }
}
