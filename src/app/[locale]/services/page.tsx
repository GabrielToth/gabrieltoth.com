import ServicesSubmenu from "@/app/[locale]/services/services-submenu"
import Footer from "@/components/layout/footer"
import { type Locale } from "@/lib/i18n"
import { generateServicesMetadata } from "@/lib/metadata/services-metadata"
import { getLocalizedPath } from "@/lib/url-mapping"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

interface ServicesPageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: ServicesPageProps): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "services" })

    return generateServicesMetadata(locale, (key: string) => t(key))
}

export default async function ServicesPage({ params }: ServicesPageProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "services" })

    const services = [
        {
            key: "channel-management",
            titleKey: "landing.channelManagementTitle",
            descKey: "landing.channelManagementDescription",
        },
        {
            key: "pc-optimization",
            titleKey: "landing.pcOptimizationTitle",
            descKey: "landing.pcOptimizationDescription",
        },
        {
            key: "amazon-affiliate",
            titleKey: "landing.affiliateTitle",
            descKey: "landing.affiliateDescription",
        },
        {
            key: "iq-test",
            titleKey: "landing.iqTestTitle",
            descKey: "landing.iqTestDescription",
        },
        {
            key: "personality-test",
            titleKey: "landing.personalityTestTitle",
            descKey: "landing.personalityTestDescription",
        },
    ]

    return (
        <>
            <main className="min-h-screen bg-[#1a1a1a] text-white">
                {/* Hero Section */}
                <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-[#3b82f6]">
                                {t("landing.title")}
                            </h1>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                                {t("landing.subtitle")}
                            </p>
                        </div>

                        {/* Submenu */}
                        <div className="mb-16">
                            <ServicesSubmenu locale={locale} />
                        </div>

                        {/* Service Cards */}
                        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
                            {services.slice(0, 4).map(service => (
                                <Link
                                    key={service.key}
                                    href={getLocalizedPath(service.key, locale)}
                                    className="group bg-[#2d2d2d] border border-neutral-700 rounded-lg p-8 hover:border-blue-500 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                            {t(service.titleKey)}
                                        </h2>
                                        <svg
                                            className="w-6 h-6 text-blue-500 transform group-hover:translate-x-1 transition-transform"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-gray-400">
                                        {t(service.descKey)}
                                    </p>
                                </Link>
                            ))}
                        </div>

                        {/* Approach Section */}
                        <div className="bg-[#242424] border border-neutral-700 rounded-lg p-8 max-w-4xl mx-auto">
                            <h2 className="text-3xl font-bold mb-6 text-blue-400">
                                {t("landing.approach.title")}
                            </h2>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-[#2d2d2d] border border-neutral-700 rounded-lg p-6">
                                    <h3 className="text-xl font-bold mb-3 text-white">
                                        {t("landing.approach.qualityFirst")}
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        {t("landing.approach.qualityFirstText")}
                                    </p>
                                </div>
                                <div className="bg-[#2d2d2d] border border-neutral-700 rounded-lg p-6">
                                    <h3 className="text-xl font-bold mb-3 text-white">
                                        {t(
                                            "landing.approach.tailoredSolutions"
                                        )}
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        {t(
                                            "landing.approach.tailoredSolutionsText"
                                        )}
                                    </p>
                                </div>
                                <div className="bg-[#2d2d2d] border border-neutral-700 rounded-lg p-6">
                                    <h3 className="text-xl font-bold mb-3 text-white">
                                        {t("landing.approach.resultsDriven")}
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        {t(
                                            "landing.approach.resultsDrivenText"
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer locale={locale} />
        </>
    )
}

export const revalidate = 3600
