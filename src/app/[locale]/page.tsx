import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"
import AboutSection from "@/components/sections/about-section"
import ChannelManagementSection from "@/components/sections/channel-management-section"
import ContactSection from "@/components/sections/contact-section"
import HeroSection from "@/components/sections/hero-section"
import ProjectsSection from "@/components/sections/projects-section"
import { type Locale } from "@/lib/i18n"

interface HomePageProps {
    params: Promise<{ locale: Locale }>
}

export default async function HomePage({ params }: HomePageProps) {
    const { locale } = await params
    return (
        <main className="min-h-screen bg-white dark:bg-gray-900">
            <Header locale={locale} />
            <HeroSection />
            <AboutSection />
            <ProjectsSection />
            <ChannelManagementSection />
            <ContactSection />
            <Footer locale={locale} />
        </main>
    )
}
