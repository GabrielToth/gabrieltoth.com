import { type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"

interface PrivacyPolicyPageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: PrivacyPolicyPageProps): Promise<Metadata> {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    const seoConfig = generateSeoConfig({
        locale,
        path: "/privacy-policy",
        title: isPortuguese
            ? "Política de Privacidade - Gabriel Toth"
            : "Privacy Policy - Gabriel Toth",
        description: isPortuguese
            ? "Política de privacidade da Gabriel Toth. Saiba como coletamos, usamos e protegemos suas informações pessoais em nossos serviços de consultoria digital e desenvolvimento."
            : "Gabriel Toth privacy policy. Learn how we collect, use and protect your personal information in our digital consulting and development services.",
        keywords: isPortuguese
            ? [
                  "política de privacidade",
                  "proteção de dados",
                  "lgpd",
                  "privacidade",
                  "gabriel toth",
                  "dados pessoais",
              ] // cspell:disable-line
            : [
                  "privacy policy",
                  "data protection",
                  "gdpr",
                  "privacy",
                  "gabriel toth",
                  "personal data",
              ],
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
            canonical: isPortuguese
                ? "https://gabrieltoth.com/pt-BR/privacy-policy"
                : "https://gabrieltoth.com/en/privacy-policy",
            languages: {
                en: "https://gabrieltoth.com/en/privacy-policy",
                "pt-BR": "https://gabrieltoth.com/pt-BR/privacy-policy",
                "x-default": "https://gabrieltoth.com/en/privacy-policy",
            },
        },
    }
}
