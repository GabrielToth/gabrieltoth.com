import { defaultLocale, locales, type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"

interface PageProps {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { locale: localeParam } = await params

    // Validate locale parameter
    let locale: Locale = defaultLocale

    // Check if locale is valid
    if (
        localeParam &&
        typeof localeParam === "string" &&
        locales.includes(localeParam as Locale)
    ) {
        locale = localeParam as Locale
    }

    const seoConfig = generateSeoConfig({
        locale,
        path: "/pc-optimization/terms",
        title: undefined,
        description: undefined,
        keywords: [],
        ogType: "website",
        ogImage: "https://www.gabrieltoth.com/og-image-pc-optimization.jpg",
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
                en: "https://www.gabrieltoth.com/en/pc-optimization/terms/",
                "pt-BR":
                    "https://www.gabrieltoth.com/pt-BR/pc-optimization/terms/",
                es: "https://www.gabrieltoth.com/es/pc-optimization/terms/",
                de: "https://www.gabrieltoth.com/de/pc-optimization/terms/",
                "x-default":
                    "https://www.gabrieltoth.com/pt-BR/pc-optimization/terms/",
            },
        },
    }
}
