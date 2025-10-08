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

    return (
        <>
            <StructuredData locale={locale} type="both" />
            <section className="relative">
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 dark:from-purple-900 dark:via-indigo-900 dark:to-pink-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        <div className="mb-8">
                            <div className="flex justify-between items-center">
                                <Link
                                    href={`/${locale}`}
                                    className="text-white/90 hover:text-white font-semibold"
                                >
                                    Gabriel Toth Gonçalves
                                </Link>
                                <Link
                                    href={`/${locale}/iq-test`}
                                    className="text-white/80 hover:text-white text-sm"
                                >
                                    {"IQ Test"}
                                </Link>
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                            {t("title")}
                        </h1>
                        <p className="text-white/90 mb-6 max-w-3xl">
                            {t("description")}
                        </p>
                        <h2 className="text-white text-xl font-semibold mb-2">
                            {t("landing.h2")}
                        </h2>
                        <p className="text-white/90 mb-3 max-w-3xl">
                            {t("landing.p1")}
                        </p>
                        <p className="text-white/75 text-sm mb-8 max-w-3xl">
                            {t("landing.p2")}
                        </p>
                        <Link
                            href={`/${locale}/personality-test/step/1`}
                            className="inline-flex items-center px-6 py-3 rounded-md bg-white text-gray-900 hover:bg-gray-100 shadow-lg shadow-black/10"
                        >
                            {t("cta.start")}
                        </Link>
                    </div>
                </div>
            </section>
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
