import AboutSection from "@/app/[locale]/home/about-section"
import ChannelManagementSection from "@/app/[locale]/home/channel-management-section"
import ContactSection from "@/app/[locale]/home/contact-section"
import HeroSection from "@/app/[locale]/home/hero-section"
import ProjectsSection from "@/app/[locale]/home/projects-section"
import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { type Locale } from "@/lib/i18n"
import { generateMetadata } from "./home-metadata"

interface HomePageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata }

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
                <div className="container mx-auto px-4 pt-20">
                    <Breadcrumbs className="mb-6" hideHome={true} />
                </div>
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
