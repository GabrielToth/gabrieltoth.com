import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { type Locale } from "@/lib/i18n"
import { buildPrivacyPolicyStructured } from "./privacy-policy-structured"

interface PrivacyPolicyPageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./privacy-policy-metadata"

export default async function PrivacyPolicyPage({
    params,
}: PrivacyPolicyPageProps) {
    const { locale } = await params
    const { breadcrumbs, webPageStructuredData, sections } =
        await buildPrivacyPolicyStructured(locale)

    return (
        <>
            <StructuredData
                locale={locale}
                type="all"
                customData={webPageStructuredData}
                breadcrumbs={breadcrumbs}
            />

            <Header />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Breadcrumbs
                        items={breadcrumbs.map((item, index) => ({
                            name: item.name,
                            href: item.url,
                            current: index === breadcrumbs.length - 1,
                        }))}
                        className="mb-6"
                    />

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                        <header className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {t("title")}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300">
                                {t("lastUpdated")}
                            </p>
                        </header>

                        <div className="space-y-8">
                            {sections.map((section, idx) => (
                                <section key={idx}>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                        {section.title}
                                    </h2>
                                    <p
                                        className="text-gray-700 dark:text-gray-300 leading-relaxed"
                                        style={{ whiteSpace: "pre-line" }}
                                    >
                                        {section.content}
                                    </p>
                                </section>
                            ))}
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                {t("complianceNote", {
                                    default:
                                        "This policy complies with the General Data Protection Law (LGPD) and other applicable regulations.",
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer locale={locale} />
        </>
    )
}

export const revalidate = 3600
