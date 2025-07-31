import PCOptimizationLanding from "@/app/[locale]/pc-optimization/pc-optimization-landing"
import Footer from "@/components/layout/footer"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { type Locale } from "@/lib/i18n"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./pc-optimization-metadata"

export default async function PCOptimizationPage({ params }: PageProps) {
    const { locale } = await params

    // Custom breadcrumbs
    const breadcrumbs = [
        {
            name:
                locale === "pt-BR"
                    ? "Serviços"
                    : locale === "es"
                      ? "Servicios"
                      : locale === "de"
                        ? "Dienstleistungen"
                        : "Services",
            url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}`,
        },
        {
            name:
                locale === "pt-BR"
                    ? "Otimização de PC"
                    : locale === "es"
                      ? "Optimización de PC"
                      : locale === "de"
                        ? "PC-Optimierung"
                        : "PC Optimization",
            url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/pc-optimization`,
        },
    ]

    return (
        <>
            <main className="min-h-screen bg-white dark:bg-gray-900 relative">
                <PCOptimizationLanding locale={locale} />

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
