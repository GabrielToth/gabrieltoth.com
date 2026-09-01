import { defaultLocale, locales, type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"

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

    const t = await getTranslations({ locale, namespace: "editors" })

    const seoConfig = generateSeoConfig({
        locale,
        path: "/editors",
        title: t("seo.title"),
        description: t("seo.description"),
        keywords: t("seo.keywords").split(", "),
        ogType: "article",
        ogImage: "https://www.gabrieltoth.com/og-image-editors.jpg",
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
            languages: Object.fromEntries(
                (seoConfig.languageAlternates || []).map(alt => [
                    alt.hrefLang,
                    alt.href,
                ])
            ),
        },
        other: {
            "theme-color": "#3b82f6",
        },
    }
}
