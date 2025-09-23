import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import LanguageSelector from "@/components/ui/language-selector"
import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"

interface TermsOfServicePageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./terms-of-service-metadata"

export default async function TermsOfServicePage({
    params,
}: TermsOfServicePageProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "termsOfService" })

    // Breadcrumbs
    const breadcrumbs = (
        t.raw("breadcrumbs") as Array<{ name: string; href: string }>
    ).map(b => ({
        name: b.name,
        url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}${b.href}`,
    }))

    // WebPage structured data
    const webPageStructuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: t("title"),
        description:
            (
                (
                    t.raw("sections") as Record<
                        string,
                        { title: string; text: string }
                    >
                )?.acceptance?.text || ""
            ).slice(0, 160) || t("title"),
        url: `https://gabrieltoth.com${locale === "en" ? "" : `/${locale}`}/terms-of-service`,
        isPartOf: {
            "@type": "WebSite",
            name: "Gabriel Toth Portfolio",
            url: "https://gabrieltoth.com",
        },
        about: {
            "@type": "Thing",
            name: t("title"),
        },
    }

    const s = t.raw("sections") as Record<
        string,
        { title: string; text: string }
    >
    const content = {
        title: t("title"),
        lastUpdated: t("lastUpdated"),
        acceptance: s.acceptance,
        services: s.services,
        responsibilities: s.responsibilities,
        limitations: s.limitations,
        privacy: s.privacy,
        modifications: s.modifications,
        termination: s.termination,
        governing: s.governing,
        contact: s.contact,
    }

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
                                "https://gabrieltoth.com",
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
                                    {content.acceptance.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.acceptance.text}
                                </p>
                            </section>

                            {/* Service Description */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.services.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.services.text}
                                </p>
                            </section>

                            {/* User Responsibilities */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.responsibilities.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.responsibilities.text}
                                </p>
                            </section>

                            {/* Limitation of Liability */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.limitations.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.limitations.text}
                                </p>
                            </section>

                            {/* Privacy */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.privacy.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.privacy.text}
                                </p>
                            </section>

                            {/* Terms Modifications */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.modifications.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.modifications.text}
                                </p>
                            </section>

                            {/* Termination */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.termination.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.termination.text}
                                </p>
                            </section>

                            {/* Governing Law */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.governing.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.governing.text}
                                </p>
                            </section>

                            {/* Contact */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {content.contact.title}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {content.contact.text}
                                </p>
                            </section>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                {t("bindingNote", {
                                    default:
                                        "This document constitutes a legally binding agreement between you and Gabriel Toth Gonçalves.",
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
