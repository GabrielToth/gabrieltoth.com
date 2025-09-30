import { type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
    const { locale } = await params

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
                    url: "https://gabrieltoth.com/og-image.jpg",
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
            languages: {
                en: "https://gabrieltoth.com/en",
                "pt-BR": "https://gabrieltoth.com/pt-BR",
                es: "https://gabrieltoth.com/es",
                de: "https://gabrieltoth.com/de",
                "x-default": "https://gabrieltoth.com/pt-BR",
            },
        },
    }
}
