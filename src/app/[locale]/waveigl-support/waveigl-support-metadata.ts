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
        path: "/waveigl-support",
        title: isPortuguese
            ? "Apoie a Comunidade WaveIGL - Desenvolvimento do Ecossistema - Gabriel Toth"
            : "Support WaveIGL Community - Ecosystem Development - Gabriel Toth",
        description: isPortuguese
            ? "Ajude a construir o futuro da comunidade WaveIGL. Suas doações financiam o desenvolvimento de plataformas, ferramentas e recursos para nossa comunidade de mais de 2 milhões de espectadores."
            : "Help build the future of WaveIGL community. Your donations fund the development of platforms, tools and resources for our community of over 2 million viewers.",
        keywords: isPortuguese
            ? [
                  "waveigl",
                  "comunidade gaming",
                  "doação",
                  "apoio",
                  "desenvolvimento",
                  "ecossistema",
                  "youtube",
                  "gabriel toth",
                  "gaming community",
              ]
            : [
                  "waveigl",
                  "gaming community",
                  "donation",
                  "support",
                  "development",
                  "ecosystem",
                  "youtube",
                  "gabriel toth",
                  "gaming community",
              ],
        ogType: "website",
        ogImage: "https://gabrieltoth.com/og-image-waveigl.jpg",
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
                ? "https://gabrieltoth.com/pt-BR/waveigl-support"
                : "https://gabrieltoth.com/en/waveigl-support",
            languages: {
                en: "https://gabrieltoth.com/en/waveigl-support",
                "pt-BR": "https://gabrieltoth.com/pt-BR/waveigl-support",
                "x-default": "https://gabrieltoth.com/en/waveigl-support",
            },
        },
    }
}
