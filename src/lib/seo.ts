import { type Locale } from "@/lib/i18n"
import { type DefaultSeoProps } from "next-seo"

interface SeoConfigOptions {
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

interface BreadcrumbItem {
    name: string
    url: string
}

interface StructuredDataPerson {
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

interface StructuredDataWebsite {
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

interface StructuredDataOrganization {
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

interface StructuredDataBreadcrumb {
    "@context": string
    "@type": string
    itemListElement: Array<{
        "@type": string
        position: number
        name: string
        item: string
    }>
}

interface StructuredDataFAQ {
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

const SITE_URL = "https://www.gabrieltoth.com"
const SITE_NAME = "Gabriel Toth Portfolio"
const AUTHOR_NAME = "Gabriel Toth Gonçalves"
const AUTHOR_EMAIL = "contato@gabrieltoth.com"
const AUTHOR_PHONE = "+55 11 99999-9999"

// Enhanced default SEO configuration
export const defaultSeoConfig: DefaultSeoProps = {
    titleTemplate: "%s | Gabriel Toth",
    defaultTitle: "Gabriel Toth - Full Stack Developer & Data Scientist",
    description:
        "Expert Full Stack Developer and Data Scientist specializing in React, Next.js, TypeScript, Node.js, and AI/ML technologies. Professional web development services and digital consulting.",
    canonical: SITE_URL,
    openGraph: {
        type: "website",
        locale: "en_US",
        url: SITE_URL,
        siteName: SITE_NAME,
        images: [
            {
                url: `${SITE_URL}/og-image.jpg`,
                width: 1200,
                height: 630,
                alt: "Gabriel Toth - Full Stack Developer & Data Scientist",
                type: "image/jpeg",
            },
            {
                url: `${SITE_URL}/og-image-square.jpg`,
                width: 1080,
                height: 1080,
                alt: "Gabriel Toth - Profile Image",
                type: "image/jpeg",
            },
        ],
    },
    twitter: {
        handle: "@gabrieltoth",
        site: "@gabrieltoth",
        cardType: "summary_large_image",
    },
    additionalMetaTags: [
        {
            name: "viewport",
            content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
        {
            name: "theme-color",
            content: "#000000",
        },
        {
            name: "msapplication-TileColor",
            content: "#000000",
        },
        {
            name: "apple-mobile-web-app-capable",
            content: "yes",
        },
        {
            name: "apple-mobile-web-app-status-bar-style",
            content: "black-translucent",
        },
        {
            name: "format-detection",
            content: "telephone=no",
        },
        {
            name: "robots",
            content:
                "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
        },
        {
            name: "author",
            content: AUTHOR_NAME,
        },
        {
            name: "creator",
            content: AUTHOR_NAME,
        },
        {
            name: "publisher",
            content: AUTHOR_NAME,
        },
        {
            name: "language",
            content: "English, Portuguese",
        },
        {
            name: "geo.region",
            content: "BR",
        },
        {
            name: "geo.country",
            content: "Brazil",
        },
        {
            name: "coverage",
            content: "Worldwide",
        },
        {
            name: "distribution",
            content: "Global",
        },
        {
            name: "rating",
            content: "General",
        },
        {
            name: "referrer",
            content: "origin-when-cross-origin",
        },
        {
            property: "og:email",
            content: AUTHOR_EMAIL,
        },
        {
            property: "og:phone_number",
            content: AUTHOR_PHONE,
        },
        {
            property: "og:latitude",
            content: "-23.5505",
        },
        {
            property: "og:longitude",
            content: "-46.6333",
        },
        {
            property: "og:street-address",
            content: "São Paulo, SP",
        },
        {
            property: "og:locality",
            content: "São Paulo",
        },
        {
            property: "og:region",
            content: "SP",
        },
        {
            property: "og:postal-code",
            content: "01000-000",
        },
        {
            property: "og:country-name",
            content: "Brazil",
        },
        {
            name: "twitter:creator",
            content: "@gabrieltoth",
        },
        {
            name: "application-name",
            content: SITE_NAME,
        },
        {
            name: "apple-mobile-web-app-title",
            content: SITE_NAME,
        },
        {
            name: "msapplication-TileImage",
            content: "/ms-icon-144x144.png",
        },
    ],
    additionalLinkTags: [
        {
            rel: "icon",
            href: "/favicon.ico",
        },
        {
            rel: "icon",
            type: "image/png",
            sizes: "16x16",
            href: "/favicon-16x16.png",
        },
        {
            rel: "icon",
            type: "image/png",
            sizes: "32x32",
            href: "/favicon-32x32.png",
        },
        {
            rel: "apple-touch-icon",
            href: "/apple-touch-icon.png",
            sizes: "180x180",
        },
        {
            rel: "mask-icon",
            href: "/safari-pinned-tab.svg",
            color: "#000000",
        },
        {
            rel: "manifest",
            href: "/manifest.json",
        },
        {
            rel: "dns-prefetch",
            href: "https://vercel-insights.com",
        },
        {
            rel: "dns-prefetch",
            href: "https://vitals.vercel-analytics.com",
        },
        {
            rel: "preload",
            href: "/og-image.jpg",
            as: "image",
            type: "image/jpeg",
        },
    ],
}

// Enhanced SEO configuration generator
export function generateSeoConfig(options: SeoConfigOptions) {
    const {
        locale,
        path = "",
        title,
        description,
        keywords = [],
        noIndex = false,
        noFollow = false,
        ogType = "website",
        ogImage,
        twitterCard = "summary_large_image",
        breadcrumbs = [],
    } = options

    // Always use locale-prefixed canonical to avoid redirect chains
    const localeSegment = `/${locale}`
    const fullUrl = `${SITE_URL}${localeSegment}${path}`.replace(
        /(?<!\/)$/,
        "/"
    )

    const titleByLocale: Record<Locale, string> = {
        en: "Gabriel Toth Gonçalves - Full Stack Developer & Data Scientist",
        "pt-BR":
            "Gabriel Toth Gonçalves - Desenvolvedor Full Stack & Cientista de Dados",
        es: "Gabriel Toth Gonçalves - Desarrollador Full Stack y Científico de Datos",
        de: "Gabriel Toth Gonçalves - Full Stack Entwickler & Datenwissenschaftler",
    }

    const descriptionByLocale: Record<Locale, string> = {
        en: "Expert Full Stack Developer and Data Scientist specializing in React, Next.js, TypeScript, Node.js, and AI/ML technologies. Professional web development services and digital consulting.",
        "pt-BR":
            "Desenvolvedor Full Stack e Cientista de Dados especialista em React, Next.js, TypeScript, Node.js e tecnologias de IA/ML. Serviços profissionais de desenvolvimento web e consultoria digital.",
        es: "Desarrollador Full Stack y Científico de Datos especializado en React, Next.js, TypeScript, Node.js y tecnologías de IA/ML. Servicios profesionales de desarrollo web y consultoría digital.",
        de: "Full Stack Entwickler und Datenwissenschaftler mit Spezialisierung auf React, Next.js, TypeScript, Node.js und KI/ML-Technologien. Professionelle Webentwicklung und digitale Beratung.",
    }

    const defaultTitle = titleByLocale[locale]
    const defaultDescription = descriptionByLocale[locale]

    const pageTitle = title || defaultTitle
    const pageDescription = description || defaultDescription

    // Enhanced keywords with semantic variations
    const keywordsByLocale: Record<Locale, string[]> = {
        en: [
            "gabriel toth",
            "full stack developer",
            "data scientist",
            "react developer",
            "nextjs specialist",
            "typescript expert",
            "nodejs developer",
            "artificial intelligence",
            "machine learning",
            "web development",
            "digital consulting",
            "javascript programmer",
            "python developer",
            "data science",
            "web development brazil",
            "freelance developer",
            "developer portfolio",
            "web services",
            "performance optimization",
            "technical seo",
        ],
        "pt-BR": [
            "gabriel toth",
            "desenvolvedor full stack",
            "cientista de dados",
            "react",
            "nextjs",
            "typescript",
            "nodejs",
            "inteligência artificial",
            "machine learning",
            "desenvolvimento web",
            "consultoria digital",
            "programador javascript",
            "python",
            "data science",
            "web brasil",
            "freelancer desenvolvedor",
            "portfólio desenvolvedor",
            "serviços web",
            "otimização de performance",
            "seo técnico",
        ],
        es: [
            "gabriel toth",
            "desarrollador full stack",
            "científico de datos",
            "react",
            "nextjs",
            "typescript",
            "nodejs",
            "inteligencia artificial",
            "aprendizaje automático",
            "desarrollo web",
            "consultoría digital",
            "programador javascript",
            "python",
            "data science",
            "web brasil",
            "freelance",
            "portafolio desarrollador",
            "servicios web",
            "optimización de rendimiento",
            "seo técnico",
        ],
        de: [
            "gabriel toth",
            "full stack entwickler",
            "datenwissenschaftler",
            "react",
            "nextjs",
            "typescript",
            "nodejs",
            "künstliche intelligenz",
            "maschinenlernen",
            "webentwicklung",
            "digitale beratung",
            "javascript programmierer",
            "python",
            "data science",
            "web brasil",
            "freelance entwickler",
            "entwickler portfolio",
            "webdienste",
            "leistungsoptimierung",
            "technisches seo",
        ],
    }

    const defaultKeywords = keywordsByLocale[locale]

    const allKeywords = [...new Set([...defaultKeywords, ...keywords])]

    let robotsContent = "index, follow"
    if (noIndex) robotsContent = "noindex"
    if (noFollow) robotsContent += ", nofollow"
    if (!noIndex && !noFollow) {
        robotsContent +=
            ", max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    }

    // Dynamic OG image based on page
    const defaultOgImage = `${SITE_URL}/og-image.jpg`
    const finalOgImage = ogImage || defaultOgImage

    return {
        title: pageTitle,
        description: pageDescription,
        canonical: fullUrl,
        openGraph: {
            title: pageTitle,
            description: pageDescription,
            url: fullUrl,
            type: ogType,
            locale:
                locale === "pt-BR"
                    ? "pt_BR"
                    : locale === "es"
                      ? "es_ES"
                      : locale === "de"
                        ? "de_DE"
                        : "en_US",
            alternateLocale: "en_US",
            images: [
                {
                    url: finalOgImage,
                    width: 1200,
                    height: 630,
                    alt: pageTitle,
                    type: "image/jpeg",
                },
            ],
            siteName: SITE_NAME,
        },
        twitter: {
            card: twitterCard,
            title: pageTitle,
            description: pageDescription,
            images: [finalOgImage],
            creator: "@gabrieltoth",
            site: "@gabrieltoth",
        },
        additionalMetaTags: [
            {
                name: "keywords",
                content: allKeywords.join(", "),
            },
            {
                name: "robots",
                content: robotsContent,
            },
            {
                name: "twitter:label1",
                content:
                    locale === "pt-BR"
                        ? "Escrito por"
                        : locale === "es"
                          ? "Escrito por"
                          : locale === "de"
                            ? "Geschrieben von"
                            : "Written by",
            },
            {
                name: "twitter:data1",
                content: AUTHOR_NAME,
            },
            { name: "twitter:label2", content: "Languages" },
            {
                name: "twitter:data2",
                content: "English, Portuguese, Spanish, German",
            },
        ],
        languageAlternates: [
            {
                hrefLang: "en",
                href: `${SITE_URL}/en${path}`.replace(/(?<!\/)$/, "/"),
            },
            {
                hrefLang: "pt-BR",
                href: `${SITE_URL}/pt-BR${path}`.replace(/(?<!\/)$/, "/"),
            },
            {
                hrefLang: "es",
                href: `${SITE_URL}/es${path}`.replace(/(?<!\/)$/, "/"),
            },
            {
                hrefLang: "de",
                href: `${SITE_URL}/de${path}`.replace(/(?<!\/)$/, "/"),
            },
            {
                hrefLang: "x-default",
                href: `${SITE_URL}/pt-BR${path}`.replace(/(?<!\/)$/, "/"),
            },
        ],
        breadcrumbs,
    }
}

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
        logo: `${SITE_URL}/logo.png`,
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

// Get all pages for sitemap generation
export function getAllPages(): Array<{
    path: string
    priority: number
    changefreq: string
}> {
    return [
        { path: "", priority: 1.0, changefreq: "weekly" }, // Home
        { path: "/channel-management", priority: 0.8, changefreq: "monthly" },
        { path: "/editors", priority: 0.8, changefreq: "monthly" },
        { path: "/pc-optimization", priority: 0.8, changefreq: "monthly" },
        { path: "/pc-optimization/terms", priority: 0.3, changefreq: "yearly" },
        { path: "/waveigl-support", priority: 0.7, changefreq: "monthly" },
        { path: "/amazon-affiliate", priority: 0.6, changefreq: "monthly" },
        { path: "/iq-test", priority: 0.7, changefreq: "weekly" },
        { path: "/personality-test", priority: 0.7, changefreq: "weekly" },
        { path: "/privacy-policy", priority: 0.3, changefreq: "yearly" },
        { path: "/terms-of-service", priority: 0.3, changefreq: "yearly" },
    ]
}

// Enhanced robots.txt generator
export function generateRobotsContent(): string {
    return `# Robots.txt for ${SITE_URL}
# Generated automatically

User-agent: *
Allow: /

# Disallow admin and private areas
Disallow: /api/
Disallow: /_next/
Disallow: /admin/
Disallow: /.well-known/
Disallow: /404
Disallow: /500

# Allow important files
Allow: /api/contact
Allow: /_next/static/
Allow: /_next/image

# Specific bot instructions
User-agent: Googlebot
Crawl-delay: 1

User-agent: Bingbot
Crawl-delay: 1

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-en.xml
Sitemap: ${SITE_URL}/sitemap-pt-BR.xml
Sitemap: ${SITE_URL}/sitemap-es.xml
Sitemap: ${SITE_URL}/sitemap-de.xml

# Host
Host: www.gabrieltoth.com`
}
