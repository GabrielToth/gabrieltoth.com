import AboutSection from "@/app/[locale]/home/about-section"
import ChannelManagementSection from "@/app/[locale]/home/channel-management-section"
import ContactSection from "@/app/[locale]/home/contact-section"
import HeroSection from "@/app/[locale]/home/hero-section"
import ProjectsSection from "@/app/[locale]/home/projects-section"
import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"
import StructuredData from "@/components/seo/structured-data"
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
                  "desenvolvimento web",
                  "consultoria digital",
                  "portifolio desenvolvedor",
              ] // cspell:disable-line
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
                  "web development",
                  "digital consulting",
                  "developer portfolio",
              ],
        ogType: "website",
        ogImage: "https://gabrieltoth.com/og-image.jpg",
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
            canonical: seoConfig.canonical,
            languages: {
                en: "https://gabrieltoth.com",
                "pt-BR": "https://gabrieltoth.com/pt-BR",
                "x-default": "https://gabrieltoth.com",
            },
        },
    }
}

export default async function HomePage({ params }: HomePageProps) {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    // Enhanced structured data for homepage
    const homepageStructuredData = {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        mainEntity: {
            "@type": "Person",
            name: "Gabriel Toth Gonçalves",
            alternateName: "Gabriel Toth",
            description: isPortuguese
                ? "Desenvolvedor Full Stack e Cientista de Dados especializado em tecnologias modernas"
                : "Full Stack Developer and Data Scientist specialized in modern technologies",
            url: "https://gabrieltoth.com",
            image: "https://gabrieltoth.com/profile-image.jpg",
            sameAs: [
                "https://github.com/gabrieltoth",
                "https://linkedin.com/in/gabriel-toth",
                "https://twitter.com/gabrieltoth",
            ],
            jobTitle: isPortuguese
                ? "Desenvolvedor Full Stack & Cientista de Dados"
                : "Full Stack Developer & Data Scientist",
            worksFor: {
                "@type": "Organization",
                name: "Gabriel Toth Tech",
            },
        },
    }

    return (
        <>
            <StructuredData
                locale={locale}
                type="all"
                customData={homepageStructuredData}
            />

            <main className="min-h-screen bg-white dark:bg-gray-900">
                <Header />
                <HeroSection />
                <AboutSection params={{ locale }} />
                <ProjectsSection />
                <ChannelManagementSection params={{ locale }} />
                <ContactSection />
                <Footer locale={locale} />
            </main>
        </>
    )
}
