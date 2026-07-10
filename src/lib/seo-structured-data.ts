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
        description:
            locale === "pt-BR"
                ? "Desenvolvedor Full Stack e Cientista de Dados especializado em React, Next.js, TypeScript, Node.js e tecnologias de IA/ML"
                : locale === "es"
                  ? "Desarrollador Full Stack y Científico de Datos especializado en React, Next.js, TypeScript, Node.js y tecnologías de IA/ML"
                  : locale === "de"
                    ? "Full Stack Entwickler und Datenwissenschaftler spezialisiert auf React, Next.js, TypeScript, Node.js und KI/ML-Technologien"
                    : "Full Stack Developer and Data Scientist specialized in React, Next.js, TypeScript, Node.js, and AI/ML technologies",
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
            "https://trovo.live/ogabrieltoth",
            "https://dlive.tv/ogabrieltoth",
            "https://odysee.com/@ogabrieltoth",
        ],
        jobTitle:
            locale === "pt-BR"
                ? "Desenvolvedor Full Stack & Cientista de Dados"
                : locale === "es"
                  ? "Desarrollador Full Stack y Científico de Datos"
                  : locale === "de"
                    ? "Full Stack Entwickler & Datenwissenschaftler"
                    : "Full Stack Developer & Data Scientist",
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
        description:
            locale === "pt-BR"
                ? "Portfólio oficial de Gabriel Toth Gonçalves - Desenvolvedor Full Stack e Cientista de Dados especializado em tecnologias modernas"
                : locale === "es"
                  ? "Portafolio oficial de Gabriel Toth Gonçalves - Desarrollador Full Stack y Científico de Datos especializado en tecnologías modernas"
                  : locale === "de"
                    ? "Offizielles Portfolio von Gabriel Toth Gonçalves - Full Stack Entwickler und Datenwissenschaftler, spezialisiert auf moderne Technologien"
                    : "Official portfolio of Gabriel Toth Gonçalves - Full Stack Developer and Data Scientist specialized in modern technologies",
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
            "https://trovo.live/ogabrieltoth",
            "https://dlive.tv/ogabrieltoth",
            "https://odysee.com/@ogabrieltoth",
        ],
        description:
            locale === "pt-BR"
                ? "Empresa de tecnologia especializada em desenvolvimento web, ciência de dados e soluções de IA"
                : locale === "es"
                  ? "Empresa de tecnología especializada en desarrollo web, ciencia de datos y soluciones de IA"
                  : locale === "de"
                    ? "Technologieunternehmen, spezialisiert auf Webentwicklung, Data Science und KI-Lösungen"
                    : "Technology company specialized in web development, data science and AI solutions",
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
