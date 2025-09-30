import { type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "waveiglSupport" })

    const seoConfig = generateSeoConfig({
        locale,
        path: "/waveigl-support",
        title: t("hero.title"),
        description: t("hero.subtitle"),
        keywords: [],
        ogType: "website",
        ogImage: "https://www.gabrieltoth.com/og-image-waveigl.jpg",
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
            languages: {
                en: "https://www.gabrieltoth.com/en/waveigl-support",
                "pt-BR": "https://www.gabrieltoth.com/pt-BR/waveigl-support",
                es: "https://www.gabrieltoth.com/es/waveigl-support",
                de: "https://www.gabrieltoth.com/de/waveigl-support",
                "x-default":
                    "https://www.gabrieltoth.com/pt-BR/waveigl-support",
            },
        },
    }
}
