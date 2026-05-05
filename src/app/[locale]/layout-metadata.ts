import { defaultLocale, locales, type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
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
        path: "",
        title: undefined,
        description: undefined,
        keywords: [],
    })

    return {
        title: seoConfig.title,
        description: seoConfig.description,
        keywords: seoConfig.additionalMetaTags?.find(
            tag => tag.name === "keywords"
        )?.content,
        authors: [{ name: "Gabriel Toth Gonçalves" }],
        robots: seoConfig.additionalMetaTags?.find(tag => tag.name === "robots")
            ?.content,
        openGraph: {
            title: seoConfig.openGraph?.title,
            description: seoConfig.openGraph?.description,
            url: seoConfig.canonical,
            siteName: "Gabriel Toth Portfolio",
            locale: seoConfig.openGraph?.locale,
            type: "website",
            images: [
                {
                    url: "https://www.gabrieltoth.com/og-image.jpg",
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
                en: "https://www.gabrieltoth.com/en/",
                "pt-BR": "https://www.gabrieltoth.com/pt-BR/",
                es: "https://www.gabrieltoth.com/es/",
                de: "https://www.gabrieltoth.com/de/",
                "x-default": "https://www.gabrieltoth.com/pt-BR/",
            },
        },
    }
}
