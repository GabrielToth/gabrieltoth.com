import WaveIGLSupportClientPage from "@/app/[locale]/waveigl-support/waveigl-support-client-page"
import Footer from "@/components/layout/footer"
import LanguageSelectorWrapper from "@/components/layout/language-selector-wrapper"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./waveigl-support-metadata"

export default async function WaveIGLSupportPage({ params }: PageProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "waveiglSupport" })
    const translations = (await import(`@/i18n/${locale}/waveiglSupport.json`))
        .default

    // Organization structured data from i18n
    const organizationStructuredData = t.raw(
        "structuredData.organization"
    ) as Record<string, unknown>

    // FAQ structured data from i18n
    const faqs = t.raw("structuredData.faqs") as Array<{
        question: string
        answer: string
    }>

    // Breadcrumbs with proper translation
    const breadcrumbs = [
        {
            name: t("hero.badge"),
            href: `/${locale}/waveigl-support`,
        },
    ]

    return (
        <>
            <StructuredData
                locale={locale}
                type="all"
                customData={organizationStructuredData}
                faqs={faqs}
            />

            <main className="min-h-screen bg-white dark:bg-gray-900 relative">
                {/* Language + Theme */}
                <div className="fixed top-4 right-4 z-50">
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
                        <LanguageSelectorWrapper
                            variant="default"
                            includeThemeToggle={true}
                        />
                    </div>
                </div>
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

export const revalidate = 3600
