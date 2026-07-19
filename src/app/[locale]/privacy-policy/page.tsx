import Footer from "@/components/layout/footer"
import PageHeader from "@/components/layout/page-header"
import StructuredData from "@/components/seo/structured-data"
import Breadcrumbs from "@/components/ui/breadcrumbs"
import { locales, type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"
import { buildPrivacyPolicyStructured } from "./privacy-policy-structured"

interface PrivacyPolicyPageProps {
    params: Promise<{ locale: Locale }>
}

export { generateMetadata } from "./privacy-policy-metadata"

export function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}

export default async function PrivacyPolicyPage({
    params,
}: PrivacyPolicyPageProps) {
    const { locale } = await params
    const { breadcrumbs, webPageStructuredData, sections } =
        await buildPrivacyPolicyStructured(locale)
    const t = await getTranslations({ locale, namespace: "privacyPolicy" })
    const tHero = await getTranslations({ locale, namespace: "privacyPageHero" })

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
                            items={breadcrumbs.map((item, index) => ({
                                name: item.name,
                                href: item.url,
                                current: index === breadcrumbs.length - 1,
                            }))}
                            className="mb-6"
                        />

                        <div className="bg-card rounded-lg shadow-lg p-8">
                            <div className="space-y-8">
                                {sections.map((section, idx) => (
                                    <section key={idx}>
                                        <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-3">
                                            {section.title}
                                        </h2>
                                        <p
                                            className="text-foreground dark:text-foreground leading-relaxed"
                                            style={{ whiteSpace: "pre-line" }}
                                        >
                                            {section.content}
                                        </p>
                                    </section>
                                ))}
                            </div>

                            <div className="mt-12 pt-8 border-t border-border dark:border-border">
                                <p className="text-sm text-muted-foreground dark:text-muted-foreground text-center">
                                    {t("complianceNote", {
                                        default:
                                            "This policy complies with the General Data Protection Law (LGPD) and other applicable regulations.",
                                    })}
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
