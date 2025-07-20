import PCOptimizationLanding from "@/app/[locale]/pc-optimization/pc-optimization-landing"
import Footer from "@/components/layout/footer"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import LanguageSelector from "@/components/ui/language-selector"
import { type Locale } from "@/lib/i18n"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./pc-optimization-metadata"

export default async function PCOptimizationPage({ params }: PageProps) {
    const { locale } = await params

    return (
        <>
            <div className="min-h-screen bg-white dark:bg-gray-900">
                {/* Language Selector for Landing Page */}
                <div className="container mx-auto px-4 py-4 flex justify-end">
                    <LanguageSelector />
                </div>

                <div className="container mx-auto px-4 pb-8">
                    <Breadcrumbs className="mb-6" />
                    <PCOptimizationLanding locale={locale} />
                </div>
            </div>
            <Footer locale={locale} />
        </>
    )
}
