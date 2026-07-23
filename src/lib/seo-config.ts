// SEO Configuration
// Split from seo.ts — constants and config generators

import { type Locale } from "@/lib/i18n"

import { type DefaultSeoProps, type SeoConfigOptions } from "./seo-types"

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

    const defaultTitle = titleByLocale[locale] ?? titleByLocale["en"]
    const defaultDescription =
        descriptionByLocale[locale] ?? descriptionByLocale["en"]

    const pageTitle = title || defaultTitle
    const pageDescription = description || defaultDescription

    // Enhanced keywords with semantic variations
    const ogLocaleByLocale: Record<Locale, string> = {
        "pt-BR": "pt_BR",
        es: "es_ES",
        de: "de_DE",
        en: "en_US",
    }

    const writtenByLabelByLocale: Record<Locale, string> = {
        "pt-BR": "Escrito por",
        es: "Escrito por",
        de: "Geschrieben von",
        en: "Written by",
    }

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

    const defaultKeywords = keywordsByLocale[locale] ?? []

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
            locale: ogLocaleByLocale[locale] ?? ogLocaleByLocale["en"],
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
                    writtenByLabelByLocale[locale] ??
                    writtenByLabelByLocale["en"],
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
