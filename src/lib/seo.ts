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
}

const SITE_URL = "https://gabrieltoth.com"
const SITE_NAME = "Gabriel Toth Portfolio"
const AUTHOR_NAME = "Gabriel Toth Gonçalves"

// Default SEO configuration using next-seo
export const defaultSeoConfig: DefaultSeoProps = {
    titleTemplate: "%s | Gabriel Toth",
    defaultTitle: "Gabriel Toth - Full Stack Developer",
    description:
        "Full Stack Developer and Data Scientist specialized in React, Next.js, TypeScript, Node.js, and AI/ML technologies.",
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
                alt: "Gabriel Toth - Full Stack Developer",
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
    ],
    additionalLinkTags: [
        {
            rel: "icon",
            href: "/favicon.ico",
        },
        {
            rel: "apple-touch-icon",
            href: "/apple-touch-icon.png",
            sizes: "180x180",
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
    ],
}

// Generate page-specific SEO configuration
export function generateSeoConfig(options: SeoConfigOptions) {
    const {
        locale,
        path = "",
        title,
        description,
        keywords = [],
        noIndex = false,
        noFollow = false,
    } = options
    const isPortuguese = locale === "pt-BR"

    const fullUrl = `${SITE_URL}${locale === "en" ? "" : `/${locale}`}${path}`

    const defaultTitle = isPortuguese
        ? "Gabriel Toth Gonçalves - Desenvolvedor Full Stack"
        : "Gabriel Toth Gonçalves - Full Stack Developer"

    const defaultDescription = isPortuguese
        ? "Desenvolvedor Full Stack e Cientista de Dados especializado em React, Next.js, TypeScript, Node.js e tecnologias de IA/ML."
        : "Full Stack Developer and Data Scientist specialized in React, Next.js, TypeScript, Node.js, and AI/ML technologies."

    const pageTitle = title || defaultTitle
    const pageDescription = description || defaultDescription

    // Default keywords in both languages
    const defaultKeywords = isPortuguese
        ? [
              "desenvolvedor full stack",
              "react",
              "nextjs",
              "typescript",
              "nodejs",
              "inteligência artificial",
              "machine learning",
              "desenvolvimento web",
              "gabriel toth",
              "programador",
              "javascript",
              "python",
              "data science",
          ]
        : [
              "full stack developer",
              "react",
              "nextjs",
              "typescript",
              "nodejs",
              "artificial intelligence",
              "machine learning",
              "web development",
              "gabriel toth",
              "programmer",
              "javascript",
              "python",
              "data science",
          ]

    const allKeywords = [...new Set([...defaultKeywords, ...keywords])]

    let robotsContent = "index, follow"
    if (noIndex) robotsContent = "noindex"
    if (noFollow) robotsContent += ", nofollow"
    if (!noIndex && !noFollow) {
        robotsContent +=
            ", max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    }

    return {
        title: pageTitle,
        description: pageDescription,
        canonical: fullUrl,
        openGraph: {
            title: pageTitle,
            description: pageDescription,
            url: fullUrl,
            locale: isPortuguese ? "pt_BR" : "en_US",
            alternateLocale: isPortuguese ? "en_US" : "pt_BR",
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
    }
}

// Generate structured data for person (Gabriel Toth)
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
            ? "Desenvolvedor Full Stack e Cientista de Dados especializado em React, Next.js, TypeScript e Node.js"
            : "Full Stack Developer and Data Scientist specialized in React, Next.js, TypeScript and Node.js",
        url: SITE_URL,
        sameAs: [
            "https://github.com/gabrieltoth",
            "https://linkedin.com/in/gabriel-toth",
            "https://twitter.com/gabrieltoth",
        ],
        jobTitle: isPortuguese
            ? "Desenvolvedor Full Stack"
            : "Full Stack Developer",
        worksFor: {
            "@type": "Organization",
            name: "Freelancer",
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
        ],
        address: {
            "@type": "PostalAddress",
            addressCountry: "BR",
        },
    }
}

// Generate structured data for website
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
            ? "Portfólio oficial de Gabriel Toth Gonçalves - Desenvolvedor Full Stack e Cientista de Dados"
            : "Official portfolio of Gabriel Toth Gonçalves - Full Stack Developer and Data Scientist",
        publisher: {
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

// Generate robots.txt content
export function generateRobotsContent(): string {
    return `# Robots.txt for ${SITE_URL}

User-agent: *
Allow: /

# Disallow admin and private areas
Disallow: /api/
Disallow: /_next/
Disallow: /admin/
Disallow: /.well-known/

# Allow important files
Allow: /api/contact
Allow: /_next/static/

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-en.xml
Sitemap: ${SITE_URL}/sitemap-pt-BR.xml

# Crawl-delay
Crawl-delay: 1`
}
