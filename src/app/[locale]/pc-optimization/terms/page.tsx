import PageHeader from "@/components/layout/page-header"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

interface PageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./terms-metadata"

export default async function PCOptimizationTermsPage({ params }: PageProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "pcOptimizationTerms" })
    const tHero = await getTranslations({ locale, namespace: "pcOptimizationTermsPageHero" })

    const localePrefix = locale === "en" ? "" : `/${locale}`

    const breadcrumbs = [
        {
            name: t("breadcrumbs.home"),
            url: `https://www.gabrieltoth.com${localePrefix}`,
        },
        {
            name: t("breadcrumbs.pcOptimization"),
            url: `https://www.gabrieltoth.com${localePrefix}/pc-optimization`,
        },
        {
            name: t("breadcrumbs.terms"),
            url: `https://www.gabrieltoth.com${localePrefix}/pc-optimization/terms`,
        },
    ]

    const items = {
        generalTerms: t.raw("generalTerms.items") as string[],
        warranties: t.raw("warranties.items") as string[],
        requirements: t.raw("requirements.items") as string[],
        warnings: t.raw("warnings.items") as string[],
    }

    return (
        <>
            <StructuredData
                locale={locale}
                type="all"
                breadcrumbs={breadcrumbs}
            />

            <main className="min-h-screen bg-muted dark:bg-background">
                <PageHeader
                    eyebrow={tHero("hero.badge")}
                    title={tHero("hero.title")}
                    subtitle={tHero("hero.subtitle")}
                />

                <div className="py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <Breadcrumbs
                            items={breadcrumbs.map((item, index) => ({
                                name: item.name,
                                href: item.url,
                                current: index === breadcrumbs.length - 1,
                            }))}
                            className="mb-6"
                        />

                        <div className="bg-card shadow-xl rounded-lg p-8">
                            <div className="space-y-12">
                                {/* General Terms */}
                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-foreground dark:text-foreground mb-4">
                                        {t("generalTerms.title")}
                                    </h2>
                                    <div className="space-y-4">
                                        {items.generalTerms.map(
                                            (item, index) => (
                                                <div
                                                    key={index}
                                                    className="p-4 bg-primary/5 dark:bg-primary/10 rounded-lg"
                                                >
                                                    <p className="text-foreground dark:text-foreground">
                                                        {item}
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </section>

                                {/* Warranties */}
                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-foreground dark:text-foreground mb-4">
                                        {t("warranties.title")}
                                    </h2>
                                    <div className="space-y-3">
                                        {items.warranties.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start"
                                            >
                                                <span className="text-green-500 mr-2 mt-1">
                                                    ✓
                                                </span>
                                                <p className="text-foreground dark:text-foreground">
                                                    {item}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Requirements */}
                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-foreground dark:text-foreground mb-4">
                                        {t("requirements.title")}
                                    </h2>
                                    <div className="space-y-3">
                                        {items.requirements.map(
                                            (item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-start"
                                                >
                                                    <span className="text-primary mr-2 mt-1">
                                                        📋
                                                    </span>
                                                    <p className="text-foreground dark:text-foreground">
                                                        {item}
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </section>

                                {/* Warnings */}
                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-foreground dark:text-foreground mb-4">
                                        {t("warnings.title")}
                                    </h2>
                                    <div className="space-y-3">
                                        {items.warnings.map((item, index) => (
                                            <div
                                                key={index}
                                                className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400"
                                            >
                                                <p className="text-foreground dark:text-foreground">
                                                    {item}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Payment Terms */}
                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-foreground dark:text-foreground mb-4">
                                        {t("payment.title")}
                                    </h2>
                                    <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <p className="text-foreground dark:text-foreground">
                                            {t("payment.text")}
                                        </p>
                                    </div>
                                </section>

                                {/* Support */}
                                <section className="mb-8">
                                    <h2 className="text-2xl font-semibold text-foreground dark:text-foreground mb-4">
                                        {t("support.title")}
                                    </h2>
                                    <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <p className="text-foreground dark:text-foreground">
                                            {t("support.text")}
                                        </p>
                                    </div>
                                </section>

                                {/* Footer */}
                                <div className="border-t border-border dark:border-border pt-6 text-center">
                                    <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4">
                                        {t("footer.agreement")}
                                    </p>
                                    <Link
                                        href={`/${locale}/pc-optimization`}
                                        className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors"
                                    >
                                        {t("footer.backLink")}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
