import Footer from "@/components/layout/footer"
import StructuredData from "@/components/seo/structured-data"
import { type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"
import AboutSection from "../home/about-section"
import ChannelManagementSection from "../home/channel-management-section"
import ContactSection from "../home/contact-section"
import ProjectsSection from "../home/projects-section"

interface AboutPageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: AboutPageProps): Promise<Metadata> {
    const { locale } = await params

    const seoConfig = generateSeoConfig({
        locale,
        path: "/quem-sou-eu",
        title: undefined,
        description: undefined,
        keywords: [],
        ogType: "website",
        ogImage: "https://www.gabrieltoth.com/og-image-home.jpg",
    })

    return {
        title: seoConfig.title,
        description: seoConfig.description,
        openGraph: {
            title: seoConfig.openGraph?.title,
            description: seoConfig.openGraph?.description,
            url: seoConfig.canonical,
            type: seoConfig.openGraph?.type as "website",
            locale: seoConfig.openGraph?.locale,
        },
    }
}

export default async function AboutPage({ params }: AboutPageProps) {
    const { locale } = await params

    const seoConfig = generateSeoConfig({
        locale,
        path: "/quem-sou-eu",
        title: undefined,
        description: undefined,
        keywords: [],
        ogType: "website",
        ogImage: "https://www.gabrieltoth.com/og-image-home.jpg",
    })

    return (
        <>
            <StructuredData locale={locale} type="both" />
            <main className="min-h-screen bg-white dark:bg-gray-900">
                <AboutSection params={{ locale }} />
                <ChannelManagementSection params={{ locale }} />
                <ProjectsSection />
                <ContactSection />
            </main>
            <Footer locale={locale} />
        </>
    )
}

export const revalidate = 3600
