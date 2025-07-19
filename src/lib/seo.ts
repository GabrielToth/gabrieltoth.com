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
    potentialAction: {
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

const SITE_URL = "https://gabrieltoth.com"
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
            rel: "preconnect",
            href: "https://fonts.googleapis.com",
        },
        {
            rel: "preconnect",
            href: "https://fonts.gstatic.com",
            crossOrigin: "anonymous",
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

    const isPortuguese = locale === "pt-BR"
    const fullUrl = `${SITE_URL}${locale === "en" ? "" : `/${locale}`}${path}`

    const defaultTitle = isPortuguese
        ? "Gabriel Toth Gonçalves - Desenvolvedor Full Stack & Cientista de Dados"
        : "Gabriel Toth Gonçalves - Full Stack Developer & Data Scientist"

    const defaultDescription = isPortuguese
        ? "Desenvolvedor Full Stack e Cientista de Dados especialista em React, Next.js, TypeScript, Node.js e tecnologias de IA/ML. Serviços profissionais de desenvolvimento web e consultoria digital."
        : "Expert Full Stack Developer and Data Scientist specializing in React, Next.js, TypeScript, Node.js, and AI/ML technologies. Professional web development services and digital consulting."

    const pageTitle = title || defaultTitle
    const pageDescription = description || defaultDescription

    // Enhanced keywords with semantic variations
    const defaultKeywords = isPortuguese
        ? [
              "gabriel toth",
              "desenvolvedor full stack",
              "cientista de dados",
              "react developer",
              "nextjs specialist",
              "typescript expert",
              "nodejs developer",
              "inteligência artificial",
              "machine learning",
              "desenvolvimento web",
              "consultoria digital",
              "programador javascript",
              "python developer",
              "data science",
              "web development brasil",
              "freelancer desenvolvedor",
              "portifolio desenvolvedor", // cspell:disable-line
              "serviços web",
              "otimização performance",
              "seo tecnico", // cspell:disable-line
          ]
        : [
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
          ]

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
            locale: isPortuguese ? "pt_BR" : "en_US",
            alternateLocale: isPortuguese ? "en_US" : "pt_BR",
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
                property: "og:updated_time",
                content: new Date().toISOString(),
            },
            {
                name: "twitter:label1",
                content: isPortuguese ? "Escrito por" : "Written by",
            },
            {
                name: "twitter:data1",
                content: AUTHOR_NAME,
            },
            {
                name: "twitter:label2",
                content: isPortuguese ? "Idiomas" : "Languages",
            },
            {
                name: "twitter:data2",
                content: isPortuguese
                    ? "Português, Inglês"
                    : "English, Portuguese",
            },
        ],
        languageAlternates: [
            {
                hrefLang: "en",
                href: `${SITE_URL}${path}`,
            },
            {
                hrefLang: "pt-BR",
                href: `${SITE_URL}/pt-BR${path}`,
            },
            {
                hrefLang: "x-default",
                href: `${SITE_URL}${path}`,
            },
        ],
        breadcrumbs,
    }
}

// Enhanced Person structured data
export function generatePersonStructuredData(
    locale: Locale
): StructuredDataPerson {
    const isPortuguese = locale === "pt-BR"

    return {
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Gabriel Toth Gonçalves",
        alternateName: "Gabriel Toth",
        description: isPortuguese
            ? "Desenvolvedor Full Stack e Cientista de Dados especializado em React, Next.js, TypeScript, Node.js e tecnologias de IA/ML"
            : "Full Stack Developer and Data Scientist specialized in React, Next.js, TypeScript, Node.js, and AI/ML technologies",
        url: SITE_URL,
        image: `${SITE_URL}/profile-image.jpg`,
        email: AUTHOR_EMAIL,
        telephone: AUTHOR_PHONE,
        sameAs: [
            "https://github.com/gabrieltoth",
            "https://linkedin.com/in/gabriel-toth",
            "https://twitter.com/gabrieltoth",
            "https://instagram.com/gabrieltoth",
            "https://youtube.com/@gabrieltoth",
        ],
        jobTitle: isPortuguese
            ? "Desenvolvedor Full Stack & Cientista de Dados"
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
    const isPortuguese = locale === "pt-BR"

    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        alternateName: "Gabriel Toth",
        url: SITE_URL,
        description: isPortuguese
            ? "Portfólio oficial de Gabriel Toth Gonçalves - Desenvolvedor Full Stack e Cientista de Dados especializado em tecnologias modernas"
            : "Official portfolio of Gabriel Toth Gonçalves - Full Stack Developer and Data Scientist specialized in modern technologies",
        publisher: {
            "@type": "Person",
            name: AUTHOR_NAME,
        },
        mainEntity: {
            "@type": "Person",
            name: AUTHOR_NAME,
        },
        potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
        },
    }
}

// Organization structured data
export function generateOrganizationStructuredData(
    locale: Locale
): StructuredDataOrganization {
    const isPortuguese = locale === "pt-BR"

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
            "https://github.com/gabrieltoth",
            "https://linkedin.com/in/gabriel-toth",
            "https://twitter.com/gabrieltoth",
        ],
        description: isPortuguese
            ? "Empresa de tecnologia especializada em desenvolvimento web, ciência de dados e soluções de IA"
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
User-agent: Googlebot # cspell:disable-line
Crawl-delay: 1

User-agent: Bingbot # cspell:disable-line
Crawl-delay: 1

User-agent: facebookexternalhit # cspell:disable-line
Allow: /

User-agent: Twitterbot # cspell:disable-line
Allow: /

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-en.xml
Sitemap: ${SITE_URL}/sitemap-pt-BR.xml

# Host
Host: ${SITE_URL}`
}
