import { type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"

interface HomePageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: HomePageProps): Promise<Metadata> {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"
    const isSpanish = locale === "es"
    const isGerman = locale === "de"

    // Title by language
    const getTitle = () => {
        if (isPortuguese)
            return "Gabriel Toth Gonçalves - Desenvolvedor Full Stack & Cientista de Dados"
        if (isSpanish)
            return "Gabriel Toth Gonçalves - Desarrollador Full Stack y Científico de Datos"
        if (isGerman)
            return "Gabriel Toth Gonçalves - Full Stack Entwickler & Datenwissenschaftler"
        return "Gabriel Toth Gonçalves - Full Stack Developer & Data Scientist"
    }

    // Description by language
    const getDescription = () => {
        if (isPortuguese)
            return "Portfólio de Gabriel Toth Gonçalves - Desenvolvedor Full Stack e Cientista de Dados especializado em React, Next.js, TypeScript, Node.js e tecnologias de IA/ML. Serviços profissionais de desenvolvimento web e consultoria digital."
        if (isSpanish)
            return "Portafolio de Gabriel Toth Gonçalves - Desarrollador Full Stack y Científico de Datos especializado en React, Next.js, TypeScript, Node.js y tecnologías de IA/ML. Servicios profesionales de desarrollo web y consultoría digital."
        if (isGerman)
            return "Portfolio von Gabriel Toth Gonçalves - Full Stack Entwickler und Datenwissenschaftler spezialisiert auf React, Next.js, TypeScript, Node.js und KI/ML-Technologien. Professionelle Webentwicklungsdienste und digitale Beratung."
        return "Gabriel Toth Gonçalves Portfolio - Full Stack Developer and Data Scientist specialized in React, Next.js, TypeScript, Node.js, and AI/ML technologies. Professional web development services and digital consulting."
    }

    // Keywords by language
    const getKeywords = () => {
        if (isPortuguese)
            return [
                "gabriel toth",
                "desenvolvedor full stack",
                "cientista de dados",
                "react",
                "nextjs",
                "typescript",
                "nodejs",
                "inteligência artificial",
                "machine learning",
                "power bi",
                "sql",
                "desenvolvimento web",
                "consultoria digital",
            ]
        if (isSpanish)
            return [
                "gabriel toth",
                "desarrollador full stack",
                "científico de datos",
                "react",
                "nextjs",
                "typescript",
                "nodejs",
                "inteligencia artificial",
                "machine learning",
                "power bi",
                "sql",
                "desarrollo web",
                "consultoría digital",
            ]
        if (isGerman)
            return [
                "gabriel toth",
                "full stack entwickler",
                "datenwissenschaftler",
                "react",
                "nextjs",
                "typescript",
                "nodejs",
                "künstliche intelligenz",
                "machine learning",
                "power bi",
                "sql",
                "webentwicklung",
                "digitale beratung",
            ]
        return [
            "gabriel toth",
            "full stack developer",
            "data scientist",
            "react",
            "nextjs",
            "typescript",
            "nodejs",
            "artificial intelligence",
            "machine learning",
            "power bi",
            "sql",
            "web development",
            "digital consulting",
        ]
    }

    const seoConfig = generateSeoConfig({
        locale,
        path: "",
        title: getTitle(),
        description: getDescription(),
        keywords: getKeywords(),
        ogType: "website",
        ogImage: "https://gabrieltoth.com/og-image-home.jpg",
    })

    return {
        title: seoConfig.title,
        description: seoConfig.description,
        keywords: seoConfig.additionalMetaTags?.find(
            tag => tag.name === "keywords"
        )?.content,
        robots: seoConfig.additionalMetaTags?.find(tag => tag.name === "robots")
            ?.content,
        openGraph: {
            title: seoConfig.openGraph?.title,
            description: seoConfig.openGraph?.description,
            url: seoConfig.canonical,
            type: seoConfig.openGraph?.type as "website",
            locale: seoConfig.openGraph?.locale,
            images: seoConfig.openGraph?.images?.map(img => ({
                url: img.url!,
                width: img.width,
                height: img.height,
                alt: img.alt!,
                type: img.type,
            })),
            siteName: "Gabriel Toth Portfolio",
        },
        twitter: {
            card: seoConfig.twitter?.card as "summary_large_image",
            title: seoConfig.twitter?.title,
            description: seoConfig.twitter?.description,
            images: seoConfig.twitter?.images,
            creator: seoConfig.twitter?.creator,
            site: seoConfig.twitter?.site,
        },
        alternates: {
            canonical: (() => {
                if (isPortuguese) return "https://gabrieltoth.com/pt-BR"
                if (isSpanish) return "https://gabrieltoth.com/es"
                if (isGerman) return "https://gabrieltoth.com/de"
                return "https://gabrieltoth.com/en"
            })(),
            languages: {
                en: "https://gabrieltoth.com/en",
                "pt-BR": "https://gabrieltoth.com/pt-BR",
                es: "https://gabrieltoth.com/es",
                de: "https://gabrieltoth.com/de",
                "x-default": "https://gabrieltoth.com/en",
            },
        },
    }
}
