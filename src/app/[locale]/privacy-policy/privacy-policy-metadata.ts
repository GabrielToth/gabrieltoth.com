import { type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"

interface PrivacyPolicyPageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: PrivacyPolicyPageProps): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "privacyPolicy" })

    const seoConfig = generateSeoConfig({
        locale,
        path: "/privacy-policy",
        title: t("title"),
        description:
            (
                (
                    t.raw("sections") as Array<{
                        title: string
                        content: string
                    }>
                )[0]?.content || ""
            ).slice(0, 160) || t("title"),
        keywords: [],
        ogType: "website",
        ogImage: "https://gabrieltoth.com/og-image-privacy.jpg",
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
                en: "https://gabrieltoth.com/en/privacy-policy",
                "pt-BR": "https://gabrieltoth.com/pt-BR/privacy-policy",
                es: "https://gabrieltoth.com/es/privacy-policy",
                de: "https://gabrieltoth.com/de/privacy-policy",
                "x-default": "https://gabrieltoth.com/en/privacy-policy",
            },
        },
    }
}
