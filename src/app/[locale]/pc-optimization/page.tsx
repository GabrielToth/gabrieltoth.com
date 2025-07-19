import PCOptimizationLanding from "@/app/[locale]/pc-optimization/pc-optimization-landing"
import Footer from "@/components/layout/footer"
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
                <div className="container mx-auto px-4 py-8">
                    <PCOptimizationLanding locale={locale} />
                </div>
            </div>
            <Footer locale={locale} />
        </>
    )
}
