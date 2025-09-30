import { type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"

interface TermsOfServicePageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: TermsOfServicePageProps): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "termsOfService" })

    const seoConfig = generateSeoConfig({
        locale,
        path: "/terms-of-service",
        title: t("title"),
        description:
            (
                (
                    t.raw("sections") as Record<
                        string,
                        { title: string; text: string }
                    >
                )?.acceptance?.text || ""
            ).slice(0, 160) || t("title"),
        keywords: [],
        ogType: "website",
        ogImage: "https://www.gabrieltoth.com/og-image-terms.jpg",
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
                en: "https://www.gabrieltoth.com/en/terms-of-service",
                "pt-BR": "https://www.gabrieltoth.com/pt-BR/terms-of-service",
                es: "https://www.gabrieltoth.com/es/terms-of-service",
                de: "https://www.gabrieltoth.com/de/terms-of-service",
                "x-default":
                    "https://www.gabrieltoth.com/pt-BR/terms-of-service",
            },
        },
    }
}
