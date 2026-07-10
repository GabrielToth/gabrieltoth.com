// SEO Type Definitions
// Split from seo.ts — interfaces only

import { type Locale } from "@/lib/i18n"

export interface DefaultSeoProps {
    titleTemplate?: string
    defaultTitle?: string
    description?: string
    canonical?: string
    openGraph?: {
        type?: string
        locale?: string
        url?: string
        siteName?: string
        images?: Array<{
            url: string
            width?: number
            height?: number
            alt?: string
            type?: string
        }>
    }
    twitter?: {
        handle?: string
        site?: string
        cardType?: string
    }
    additionalMetaTags?: Array<{
        name?: string
        property?: string
        content: string
    }>
    additionalLinkTags?: Array<{
        rel: string
        href: string
        type?: string
        sizes?: string
        color?: string
        as?: string
    }>
}

export interface SeoConfigOptions {
    locale: Locale
    path?: string
    title?: string
    description?: string
    keywords?: string[]
    noIndex?: boolean
    noFollow?: boolean
    ogType?: "website" | "article" | "product" | "service"
    ogImage?: string
    twitterCard?: "summary" | "summary_large_image" | "app" | "player"
    breadcrumbs?: BreadcrumbItem[]
}

export interface BreadcrumbItem {
    name: string
    url: string
}

export interface StructuredDataPerson {
    "@context": string
    "@type": string
    name: string
    alternateName: string
    description: string
    url: string
    sameAs: string[]
    jobTitle: string
    worksFor: {
        "@type": string
        name: string
    }
    knowsAbout: string[]
    address: {
        "@type": string
        addressCountry: string
    }
    image: string
    email: string
    telephone: string
}

export interface StructuredDataWebsite {
    "@context": string
    "@type": string
    name: string
    alternateName: string
    url: string
    description: string
    publisher: {
        "@type": string
        name: string
    }
    potentialAction?: {
        "@type": string
        target: string
        "query-input": string
    }
    mainEntity: {
        "@type": string
        name: string
    }
}

export interface StructuredDataOrganization {
    "@context": string
    "@type": string
    name: string
    url: string
    logo: string
    founder: {
        "@type": string
        name: string
    }
    contactPoint: {
        "@type": string
        contactType: string
        email: string
        availableLanguage: string[]
    }
    sameAs: string[]
    description: string
}

export interface StructuredDataBreadcrumb {
    "@context": string
    "@type": string
    itemListElement: Array<{
        "@type": string
        position: number
        name: string
        item: string
    }>
}

export interface StructuredDataFAQ {
    "@context": string
    "@type": string
    mainEntity: Array<{
        "@type": string
        name: string
        acceptedAnswer: {
            "@type": string
            text: string
        }
    }>
}
