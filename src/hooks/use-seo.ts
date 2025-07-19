import { getBreadcrumbsForStructuredData } from "@/components/ui/breadcrumbs"
import { useLocale } from "@/hooks/use-locale"
import { generateSeoConfig } from "@/lib/seo"
import { type NextSeoProps } from "next-seo"
import { usePathname } from "next/navigation"

interface BreadcrumbItem {
    name: string
    url: string
}

interface FAQItem {
    question: string
    answer: string
}

interface UseSeoOptions {
    title?: string
    description?: string
    keywords?: string[]
    path?: string
    noIndex?: boolean
    noFollow?: boolean
    ogType?: "website" | "article" | "product" | "service"
    ogImage?: string
    twitterCard?: "summary" | "summary_large_image" | "app" | "player"
    customOpenGraph?: Partial<NextSeoProps["openGraph"]>
    customStructuredData?: Record<string, unknown>
    breadcrumbs?: BreadcrumbItem[]
    autoBreadcrumbs?: boolean
    faqs?: FAQItem[]
    structuredDataType?:
        | "person"
        | "website"
        | "organization"
        | "breadcrumb"
        | "faq"
        | "both"
        | "all"
}

export function useSeo(options: UseSeoOptions = {}) {
    const { locale } = useLocale()
    const pathname = usePathname()

    const {
        title,
        description,
        keywords = [],
        path = "",
        noIndex = false,
        noFollow = false,
        ogType = "website",
        ogImage,
        twitterCard = "summary_large_image",
        customOpenGraph,
        customStructuredData,
        breadcrumbs,
        autoBreadcrumbs = true,
        faqs = [],
        structuredDataType = "both",
    } = options

    const seoConfig = generateSeoConfig({
        locale,
        path,
        title,
        description,
        keywords,
        noIndex,
        noFollow,
        ogType,
        ogImage,
        twitterCard,
    })

    // Generate breadcrumbs if auto is enabled and no custom breadcrumbs provided
    const finalBreadcrumbs =
        breadcrumbs ||
        (autoBreadcrumbs
            ? getBreadcrumbsForStructuredData(pathname, locale)
            : [])

    // Convert to NextSeo format
    const nextSeoConfig: NextSeoProps = {
        title: seoConfig.title,
        description: seoConfig.description,
        canonical: seoConfig.canonical,
        openGraph: {
            ...seoConfig.openGraph,
            ...customOpenGraph,
        },
        twitter: {
            ...seoConfig.twitter,
        },
        additionalMetaTags: seoConfig.additionalMetaTags,
        languageAlternates: seoConfig.languageAlternates?.map(alt => ({
            hrefLang: alt.hrefLang,
            href: alt.href,
        })),
    }

    // Prepare structured data props
    const structuredDataProps = {
        locale,
        type: structuredDataType,
        customData: customStructuredData,
        breadcrumbs: finalBreadcrumbs,
        faqs,
    }

    return {
        nextSeoConfig,
        structuredDataProps,
        breadcrumbs: finalBreadcrumbs,
        locale,
        canonical: seoConfig.canonical,
        ogImage: seoConfig.openGraph?.images?.[0]?.url,
    }
}

// Hook specifically for FAQ pages
export function useFAQSeo(
    faqs: FAQItem[],
    baseOptions: Omit<UseSeoOptions, "faqs" | "structuredDataType"> = {}
) {
    return useSeo({
        ...baseOptions,
        faqs,
        structuredDataType: "all",
        ogType: "article",
    })
}

// Hook specifically for service pages
export function useServiceSeo(
    serviceData: Record<string, unknown>,
    baseOptions: Omit<UseSeoOptions, "customStructuredData" | "ogType"> = {}
) {
    return useSeo({
        ...baseOptions,
        customStructuredData: serviceData,
        ogType: "service",
        structuredDataType: "all",
    })
}

// Hook specifically for article/blog pages
export function useArticleSeo(
    articleData: Record<string, unknown>,
    baseOptions: Omit<UseSeoOptions, "customStructuredData" | "ogType"> = {}
) {
    return useSeo({
        ...baseOptions,
        customStructuredData: articleData,
        ogType: "article",
        structuredDataType: "all",
    })
}
