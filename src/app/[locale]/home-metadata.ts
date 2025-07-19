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

    const seoConfig = generateSeoConfig({
        locale,
        path: "",
        title: isPortuguese
            ? "Gabriel Toth Gonçalves - Desenvolvedor Full Stack & Cientista de Dados"
            : "Gabriel Toth Gonçalves - Full Stack Developer & Data Scientist",
        description: isPortuguese
            ? "Portfólio de Gabriel Toth Gonçalves - Desenvolvedor Full Stack e Cientista de Dados especializado em React, Next.js, TypeScript, Node.js e tecnologias de IA/ML. Serviços profissionais de desenvolvimento web e consultoria digital."
            : "Gabriel Toth Gonçalves Portfolio - Full Stack Developer and Data Scientist specialized in React, Next.js, TypeScript, Node.js, and AI/ML technologies. Professional web development services and digital consulting.",
        keywords: isPortuguese
            ? [
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
            : [
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
              ],
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
            canonical: isPortuguese
                ? "https://gabrieltoth.com/pt-BR"
                : "https://gabrieltoth.com/en",
            languages: {
                en: "https://gabrieltoth.com/en",
                "pt-BR": "https://gabrieltoth.com/pt-BR",
                "x-default": "https://gabrieltoth.com/en",
            },
        },
    }
}
