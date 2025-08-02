import { getWaveIGLSupportTranslations } from "@/app/[locale]/waveigl-support/translations"
import { getWaveIGLSupportBreadcrumbs } from "@/app/[locale]/waveigl-support/waveigl-support-breadcrumbs"
import WaveIGLSupportClientPage from "@/app/[locale]/waveigl-support/waveigl-support-client-page"
import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { type Locale } from "@/lib/i18n"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./waveigl-support-metadata"

export default async function WaveIGLSupportPage({ params }: PageProps) {
    const { locale } = await params
    const translations = getWaveIGLSupportTranslations(locale)

    // Organization structured data
    const organizationStructuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "WaveIGL",
        description: translations.organizationDescription,
        url: "https://gabrieltoth.com/waveigl-support",
        logo: "https://gabrieltoth.com/logo.png",
        sameAs: [
            "https://youtube.com/@WaveIGL",
            "https://twitch.tv/WaveIGL",
            "https://discord.gg/WaveIGL",
        ],
    }

    // FAQ structured data
    const faqs = [
        {
            question: translations.faq.question1,
            answer: translations.faq.answer1,
        },
        {
            question: translations.faq.question2,
            answer: translations.faq.answer2,
        },
        {
            question: translations.faq.question3,
            answer: translations.faq.answer3,
        },
        {
            question: translations.faq.question4,
            answer: translations.faq.answer4,
        },
    ]

    // Breadcrumbs with proper translation
    const breadcrumbs = getWaveIGLSupportBreadcrumbs(locale)

    return (
        <>
            <StructuredData
                locale={locale}
                type="all"
                customData={organizationStructuredData}
                faqs={faqs}
            />

            <Header />

            <main className="min-h-screen bg-white dark:bg-gray-900 relative">
                {/* Breadcrumbs overlay */}
                <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                    <div className="container mx-auto px-4 py-4">
                        <Breadcrumbs items={breadcrumbs} />
                    </div>
                </div>

                {/* Add padding to content to account for overlaid breadcrumbs */}
                <div className="pt-16">
                    <WaveIGLSupportClientPage translations={translations} />
                </div>

                <Footer locale={locale} />
            </main>
        </>
    )
}
