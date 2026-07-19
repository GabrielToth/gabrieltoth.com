import Footer from "@/components/layout/footer"
import PageHeader from "@/components/layout/page-header"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { locales, type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"
import { buildTermsOfServiceStructured } from "./terms-of-service-structured"
import { type TermsContent } from "./terms-of-service-types"

interface TermsOfServicePageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./terms-of-service-metadata"

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}

export default async function TermsOfServicePage({
    params,
}: TermsOfServicePageProps) {
    const { locale } = await params
    const { breadcrumbs, webPageStructuredData, content } =
        await buildTermsOfServiceStructured(locale)
    const tHero = await getTranslations({ locale, namespace: "termsOfServicePageHero" })
    const typed: TermsContent = content

    return (
        <>
            <StructuredData
                locale={locale}
                type="all"
                customData={webPageStructuredData}
                breadcrumbs={breadcrumbs}
            />

            <main className="min-h-screen bg-muted dark:bg-background">
                <PageHeader
                    eyebrow={tHero("hero.badge")}
                    title={tHero("hero.title")}
                    subtitle={tHero("hero.subtitle")}
                />

                <div className="py-12">
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

                        <div className="bg-card rounded-lg shadow-lg p-8">
                            <div className="space-y-8">
                                {/* Acceptance of Terms */}
                                <section>
                                    <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-3">
                                        {typed.acceptance.title}
                                    </h2>
                                    <p className="text-foreground dark:text-foreground leading-relaxed">
                                        {typed.acceptance.text}
                                    </p>
                                </section>

                                {/* Service Description */}
                                <section>
                                    <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-3">
                                        {typed.services.title}
                                    </h2>
                                    <p className="text-foreground dark:text-foreground leading-relaxed">
                                        {typed.services.text}
                                    </p>
                                </section>

                                {/* User Responsibilities */}
                                <section>
                                    <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-3">
                                        {typed.responsibilities.title}
                                    </h2>
                                    <p className="text-foreground dark:text-foreground leading-relaxed">
                                        {typed.responsibilities.text}
                                    </p>
                                </section>

                                {/* Limitation of Liability */}
                                <section>
                                    <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-3">
                                        {typed.limitations.title}
                                    </h2>
                                    <p className="text-foreground dark:text-foreground leading-relaxed">
                                        {typed.limitations.text}
                                    </p>
                                </section>

                                {/* Privacy */}
                                <section>
                                    <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-3">
                                        {typed.privacy.title}
                                    </h2>
                                    <p className="text-foreground dark:text-foreground leading-relaxed">
                                        {typed.privacy.text}
                                    </p>
                                </section>

                                {/* Terms Modifications */}
                                <section>
                                    <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-3">
                                        {typed.modifications.title}
                                    </h2>
                                    <p className="text-foreground dark:text-foreground leading-relaxed">
                                        {typed.modifications.text}
                                    </p>
                                </section>

                                {/* Termination */}
                                <section>
                                    <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-3">
                                        {typed.termination.title}
                                    </h2>
                                    <p className="text-foreground dark:text-foreground leading-relaxed">
                                        {typed.termination.text}
                                    </p>
                                </section>

                                {/* Governing Law */}
                                <section>
                                    <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-3">
                                        {typed.governing.title}
                                    </h2>
                                    <p className="text-foreground dark:text-foreground leading-relaxed">
                                        {typed.governing.text}
                                    </p>
                                </section>

                                {/* Contact */}
                                <section>
                                    <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-3">
                                        {typed.contact.title}
                                    </h2>
                                    <p className="text-foreground dark:text-foreground leading-relaxed">
                                        {typed.contact.text}
                                    </p>
                                </section>
                            </div>

                            <div className="mt-12 pt-8 border-t border-border dark:border-border">
                                <p className="text-sm text-muted-foreground dark:text-muted-foreground text-center">
                                    {typed.lastUpdated}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer locale={locale} />
        </>
    )
}

export const revalidate = 3600
