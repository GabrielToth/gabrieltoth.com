import AboutSection from "@/app/[locale]/home/about-section"
import ChannelManagementSection from "@/app/[locale]/home/channel-management-section"
import ContactSection from "@/app/[locale]/home/contact-section"
import HeroSection from "@/app/[locale]/home/hero-section"
import ProjectsSection from "@/app/[locale]/home/projects-section"
import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"

export default function HomePage() {
    return (
        <main className="min-h-screen bg-white dark:bg-gray-900">
            <Header />
            <HeroSection />
            <AboutSection />
            <ProjectsSection />
            <ChannelManagementSection />
            <ContactSection />
            <Footer locale="pt-BR" />
        </main>
    )
}
