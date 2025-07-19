import StructuredData from "@/components/seo/structured-data"
import { locales, type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"
import LocaleProvider from "./locale-provider"

interface LocaleLayoutProps {
    children: React.ReactNode
    params: Promise<{ locale: Locale }>
}

export async function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    // Use the new centralized SEO configuration
    const seoConfig = generateSeoConfig({
        locale,
        path: "",
        title: isPortuguese
            ? "Gabriel Toth Gonçalves - Desenvolvedor Full Stack"
            : "Gabriel Toth Gonçalves - Full Stack Developer",
        description: isPortuguese
            ? "Portfólio de Gabriel Toth Gonçalves - Desenvolvedor Full Stack especializado em React, Next.js, TypeScript e Node.js"
            : "Gabriel Toth Gonçalves Portfolio - Full Stack Developer specialized in React, Next.js, TypeScript and Node.js",
        keywords: isPortuguese
            ? [
                  "portfólio",
                  "desenvolvedor full stack",
                  "react",
                  "nextjs",
                  "typescript",
                  "nodejs",
              ]
            : [
                  "portfolio",
                  "full stack developer",
                  "react",
                  "nextjs",
                  "typescript",
                  "nodejs",
              ],
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
            canonical: seoConfig.canonical,
            languages: {
                en: "https://gabrieltoth.com",
                "pt-BR": "https://gabrieltoth.com/pt-BR",
                "x-default": "https://gabrieltoth.com",
            },
        },
    }
}

export default async function LocaleLayout({
    children,
    params,
}: LocaleLayoutProps) {
    const { locale } = await params

    return (
        <LocaleProvider locale={locale}>
            <StructuredData locale={locale} type="both" />
            {children}
        </LocaleProvider>
    )
}
