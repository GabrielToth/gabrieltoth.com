// SEO Structured Data
// Split from seo.ts — structured data generation functions

import { type Locale } from "@/lib/i18n"

import {
    type BreadcrumbItem,
    type StructuredDataBreadcrumb,
    type StructuredDataFAQ,
    type StructuredDataOrganization,
    type StructuredDataPerson,
    type StructuredDataWebsite,
} from "./seo-types"

import enSeo from "@/i18n/en/seo.json"
import ptBrSeo from "@/i18n/pt-BR/seo.json"
import esSeo from "@/i18n/es/seo.json"
import deSeo from "@/i18n/de/seo.json"

interface SeoMessages {
    personDescription: string
    personJobTitle: string
    websiteDescription: string
    organizationDescription: string
}

const seoMessages: Record<Locale, SeoMessages> = {
    en: enSeo as SeoMessages,
    "pt-BR": ptBrSeo as SeoMessages,
    es: esSeo as SeoMessages,
    de: deSeo as SeoMessages,
}

const SITE_URL = "https://www.gabrieltoth.com"
const SITE_NAME = "Gabriel Toth Portfolio"
const AUTHOR_NAME = "Gabriel Toth Gonçalves"
const AUTHOR_EMAIL = "contato@gabrieltoth.com"
const AUTHOR_PHONE = "+55 11 99999-9999"

// Enhanced Person structured data
export function generatePersonStructuredData(
    locale: Locale
): StructuredDataPerson {
    return {
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Gabriel Toth Gonçalves",
        alternateName: "Gabriel Toth",
        description: seoMessages[locale]?.personDescription ?? seoMessages.en.personDescription,
        url: SITE_URL,
        image: `${SITE_URL}/profile-image.jpg`,
        email: AUTHOR_EMAIL,
        telephone: AUTHOR_PHONE,
        sameAs: [
            "https://github.com/GabrielToth",
            "https://www.facebook.com/ogabrieltoth",
            "https://www.youtube.com/@ogabrieltoth",
            "https://twitter.com/ogabrieltoth",
            "https://x.com/ogabrieltoth",
            "https://www.linkedin.com/in/ogabrieltoth",
            "https://www.instagram.com/ogabrieltoth",
            "https://kick.com/ogabrieltoth",
            "https://dlive.tv/ogabrieltoth",
        ],
        jobTitle: seoMessages[locale]?.personJobTitle ?? seoMessages.en.personJobTitle,
        worksFor: {
            "@type": "Organization",
            name: "Gabriel Toth Tech",
        },
        knowsAbout: [
            "React",
            "Next.js",
            "TypeScript",
            "Node.js",
            "JavaScript",
            "Python",
            "Machine Learning",
            "Data Science",
            "Web Development",
            "Frontend Development",
            "Backend Development",
            "Full Stack Development",
            "Artificial Intelligence",
            "Database Design",
            "API Development",
            "Performance Optimization",
            "SEO Technical",
            "Digital Marketing",
            "Project Management",
            "Agile Methodologies",
        ],
        address: {
            "@type": "PostalAddress",
            addressCountry: "BR",
        },
    }
}

// Enhanced Website structured data
export function generateWebsiteStructuredData(
    locale: Locale
): StructuredDataWebsite {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        alternateName: "Gabriel Toth",
        url: SITE_URL,
        description: seoMessages[locale]?.websiteDescription ?? seoMessages.en.websiteDescription,
        publisher: {
            "@type": "Person",
            name: AUTHOR_NAME,
        },
        mainEntity: {
            "@type": "Person",
            name: AUTHOR_NAME,
        },
    }
}

// Organization structured data
export function generateOrganizationStructuredData(
    locale: Locale
): StructuredDataOrganization {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Gabriel Toth Tech",
        url: SITE_URL,
        logo: `${SITE_URL}/logo.jpg`,
        founder: {
            "@type": "Person",
            name: AUTHOR_NAME,
        },
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            email: AUTHOR_EMAIL,
            availableLanguage: ["English", "Portuguese"],
        },
        sameAs: [
            "https://github.com/GabrielToth",
            "https://www.facebook.com/ogabrieltoth",
            "https://www.youtube.com/@ogabrieltoth",
            "https://twitter.com/ogabrieltoth",
            "https://x.com/ogabrieltoth",
            "https://www.linkedin.com/in/ogabrieltoth",
            "https://www.instagram.com/ogabrieltoth",
            "https://kick.com/ogabrieltoth",
            "https://dlive.tv/ogabrieltoth",
        ],
        description: seoMessages[locale]?.organizationDescription ?? seoMessages.en.organizationDescription,
    }
}

// Breadcrumb structured data
export function generateBreadcrumbStructuredData(
    breadcrumbs: BreadcrumbItem[]
): StructuredDataBreadcrumb {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    }
}

// FAQ structured data
export function generateFAQStructuredData(
    locale: Locale,
    faqs: Array<{ question: string; answer: string }>
): StructuredDataFAQ {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(faq => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
            },
        })),
    }
}
