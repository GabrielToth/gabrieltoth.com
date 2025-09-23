import Footer from "@/components/layout/footer"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { type Locale } from "@/lib/i18n"
import { getPCOptimizationBreadcrumbs } from "./pc-optimization-breadcrumbs"
import PCOptimizationView from "./pc-optimization-view"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./pc-optimization-metadata"

export default async function PCOptimizationPage({ params }: PageProps) {
    const { locale } = await params
    const breadcrumbs = getPCOptimizationBreadcrumbs(locale)

    return (
        <>
            <main className="min-h-screen bg-white dark:bg-gray-900 relative">
                <PCOptimizationView locale={locale} />

                {/* Breadcrumbs overlay */}
                <div className="absolute top-0 left-0 z-40 pointer-events-none">
                    <div className="container mx-auto px-4 py-8">
                        <div className="pointer-events-auto">
                            <Breadcrumbs
                                items={breadcrumbs.map((item, index) => ({
                                    name: item.name,
                                    href: item.url.replace(
                                        "https://gabrieltoth.com",
                                        ""
                                    ),
                                    current: index === breadcrumbs.length - 1,
                                }))}
                                hideHome={true}
                                className="mb-6"
                            />
                        </div>
                    </div>
                </div>

                <Footer locale={locale} />
            </main>
        </>
    )
}

export const revalidate = 3600
