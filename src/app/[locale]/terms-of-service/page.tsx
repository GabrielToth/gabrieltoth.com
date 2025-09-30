import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import LanguageSelector from "@/components/ui/language-selector"
import { type Locale } from "@/lib/i18n"
import { buildTermsOfServiceStructured } from "./terms-of-service-structured"
import { type TermsContent } from "./terms-of-service-types"

interface TermsOfServicePageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./terms-of-service-metadata"

export default async function TermsOfServicePage({
    params,
}: TermsOfServicePageProps) {
    const { locale } = await params
    const { breadcrumbs, webPageStructuredData, content } =
        await buildTermsOfServiceStructured(locale)
    const typed: TermsContent = content

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
                {/* Language Selector */}
                <div className="fixed top-4 right-4 z-50">
                    <LanguageSelector />
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Breadcrumbs
                        items={breadcrumbs.map(item => ({
                            name: item.name,
                            href: item.url.replace(
                                "https://www.gabrieltoth.com",
                                ""
                            ),
                        }))}
                        className="mb-6"
                    />

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                        <header className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {content.title}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300">
                                {content.lastUpdated}
                            </p>
                        </header>

                        <div className="space-y-8">
                            {/* Acceptance of Terms */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {typed.acceptance.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {typed.acceptance.text}
                                </p>
                            </section>

                            {/* Service Description */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {typed.services.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {typed.services.text}
                                </p>
                            </section>

                            {/* User Responsibilities */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {typed.responsibilities.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {typed.responsibilities.text}
                                </p>
                            </section>

                            {/* Limitation of Liability */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {typed.limitations.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {typed.limitations.text}
                                </p>
                            </section>

                            {/* Privacy */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {typed.privacy.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {typed.privacy.text}
                                </p>
                            </section>

                            {/* Terms Modifications */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {typed.modifications.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {typed.modifications.text}
                                </p>
                            </section>

                            {/* Termination */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {typed.termination.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {typed.termination.text}
                                </p>
                            </section>

                            {/* Governing Law */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {typed.governing.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {typed.governing.text}
                                </p>
                            </section>

                            {/* Contact */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {typed.contact.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {typed.contact.text}
                                </p>
                            </section>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                {typed.lastUpdated}
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
