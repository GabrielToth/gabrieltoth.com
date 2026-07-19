import PageHeader from "@/components/layout/page-header"
import StructuredData from "@/components/seo/structured-data"
import { type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

interface PersonalityPageProps {
    params: Promise<{ locale: Locale }>
}

export default async function PersonalityTestLanding({
    params,
}: PersonalityPageProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "personality" })
    const tHero = await getTranslations({ locale, namespace: "personalityTestPageHero" })

    return (
        <>
            <StructuredData locale={locale} type="both" />
            <main className="min-h-screen bg-card dark:bg-background">
                <PageHeader
                    eyebrow={tHero("hero.badge")}
                    title={tHero("hero.title")}
                    subtitle={tHero("hero.subtitle")}
                >
                    <div className="mt-8">
                        <Link
                            href={`/${locale}/personality-test/step/1`}
                            className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-white hover:bg-primary/90 shadow-lg shadow-black/10"
                        >
                            {t("cta.start")}
                        </Link>
                    </div>
                </PageHeader>

                <section className="py-16 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-foreground dark:text-foreground mb-4">
                                {t("landing.h2")}
                            </h2>
                            <p className="text-foreground dark:text-foreground mb-3 max-w-3xl">
                                {t("landing.p1")}
                            </p>
                            <p className="text-muted-foreground dark:text-foreground text-sm max-w-3xl">
                                {t("landing.p2")}
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

export async function generateMetadata({
    params,
}: PersonalityPageProps): Promise<Metadata> {
    const { locale } = await params
    const seoConfig = generateSeoConfig({
        locale,
        path: "/personality-test",
        ogType: "website",
    })
    return {
        title: seoConfig.title,
        description: seoConfig.description,
        openGraph: {
            ...seoConfig.openGraph,
        },
        twitter: {
            ...seoConfig.twitter,
        },
        alternates: {
            canonical: seoConfig.canonical,
            languages: {
                en: "https://www.gabrieltoth.com/en/personality-test/",
                "pt-BR": "https://www.gabrieltoth.com/pt-BR/personality-test/",
                es: "https://www.gabrieltoth.com/es/personality-test/",
                de: "https://www.gabrieltoth.com/de/personality-test/",
                "x-default":
                    "https://www.gabrieltoth.com/pt-BR/personality-test/",
            },
        },
    }
}
