import { useLocale } from "@/hooks/use-locale"
import { generateSeoConfig } from "@/lib/seo"
import { type NextSeoProps } from "next-seo"

interface UseSeoOptions {
    title?: string
    description?: string
    keywords?: string[]
    path?: string
    noIndex?: boolean
    noFollow?: boolean
    customOpenGraph?: Partial<NextSeoProps["openGraph"]>
    customStructuredData?: Record<string, unknown>
}

export function useSeo(options: UseSeoOptions = {}) {
    const { locale } = useLocale()

    const {
        title,
        description,
        keywords = [],
        path = "",
        noIndex = false,
        noFollow = false,
        customOpenGraph,
        customStructuredData,
    } = options

    const seoConfig = generateSeoConfig({
        locale,
        path,
        title,
        description,
        keywords,
        noIndex,
        noFollow,
    })

    // Convert to NextSeo format
    const nextSeoConfig: NextSeoProps = {
        title: seoConfig.title,
        description: seoConfig.description,
        canonical: seoConfig.canonical,
        openGraph: {
            ...seoConfig.openGraph,
            ...customOpenGraph,
        },
        additionalMetaTags: seoConfig.additionalMetaTags,
        languageAlternates: seoConfig.languageAlternates?.map(alt => ({
            hrefLang: alt.hrefLang,
            href: alt.href,
        })),
    }

    return {
        nextSeoConfig,
        structuredData: customStructuredData,
        locale,
        canonical: seoConfig.canonical,
    }
}
