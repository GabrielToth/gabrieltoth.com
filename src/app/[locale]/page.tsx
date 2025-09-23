import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"
import StructuredData from "@/components/seo/structured-data"
import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"
import { generateMetadata } from "./home-metadata"
import AboutSection from "./home/about-section"
import ChannelManagementSection from "./home/channel-management-section"
import ContactSection from "./home/contact-section"
import HeroSection from "./home/hero-section"
import ProjectsSection from "./home/projects-section"

interface HomePageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata }

export default async function HomePage({ params }: HomePageProps) {
    const { locale } = await params
    const th = await getTranslations({ locale, namespace: "home" })
    const homepageStructuredData = th.raw(
        "structuredData.profilePage"
    ) as Record<string, unknown>

    return (
        <>
            <StructuredData
                locale={locale}
                type="all"
                customData={homepageStructuredData}
            />

            <main className="min-h-screen bg-white dark:bg-gray-900">
                <Header />
                <HeroSection locale={locale} />
                <AboutSection params={{ locale }} />
                <ProjectsSection />
                <ChannelManagementSection params={{ locale }} />
                <ContactSection />
                <Footer locale={locale} />
            </main>
        </>
    )
}

export const revalidate = 3600
