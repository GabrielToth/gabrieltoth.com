import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"
import AboutSection from "@/components/sections/about-section"
import ChannelManagementSection from "@/components/sections/channel-management-section"
import ContactSection from "@/components/sections/contact-section"
import HeroSection from "@/components/sections/hero-section"
import ProjectsSection from "@/components/sections/projects-section"

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
