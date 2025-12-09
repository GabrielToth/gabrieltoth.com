import Footer from "@/components/layout/footer"
import Header from "@/components/layout/header"
import StructuredData from "@/components/seo/structured-data"
import { type Locale } from "@/lib/i18n"
import { generateSeoConfig } from "@/lib/seo"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Image from "next/image"
import Link from "next/link"
import { buildIQTestStructured } from "./iq-test-structured"
interface IQTestPageProps {
    params: Promise<{ locale: Locale }>
}

export default async function IQTestPage({ params }: IQTestPageProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "iqTest" })
    const tHeader = await getTranslations({
        locale,
        namespace: "layout.header",
    })

    const { breadcrumbs, webPageStructuredData, faqs } =
        await buildIQTestStructured(locale)

    // Helper to render body content that can be a string or an array of strings
    const renderBody = (raw: unknown, limit?: number) => {
        const paragraphs = Array.isArray(raw) ? raw : [String(raw || "")]
        const limited =
            typeof limit === "number" ? paragraphs.slice(0, limit) : paragraphs
        return limited.map((p, idx) => <p key={idx}>{p}</p>)
    }

    const renderList = (items: string[], ordered?: boolean) => {
        if (!items || items.length === 0) return null
        if (ordered) {
            return (
                <ol className="list-decimal pl-6 space-y-2">
                    {items.map((it, i) => (
                        <li key={i}>{it}</li>
                    ))}
                </ol>
            )
        }
        return (
            <ul className="list-disc pl-6 space-y-2">
                {items.map((it, i) => (
                    <li key={i}>{it}</li>
                ))}
            </ul>
        )
    }

    const introSteps =
        (t.raw("sections.introSteps") as string[] | undefined) || []

    return (
        <>
            <Header />
            <StructuredData
                locale={locale}
                type="all"
                customData={webPageStructuredData}
                breadcrumbs={breadcrumbs}
                faqs={faqs}
            />
            <section className="relative">
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 dark:from-purple-900 dark:via-indigo-900 dark:to-pink-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                            <div>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 text-white text-xs mb-4 ring-1 ring-white/25">
                                    {t("landing.badge")}
                                </div>
                                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                                    {t("title")}
                                </h1>
                                <p className="text-white/90 text-base md:text-lg mb-6">
                                    {t("description")}
                                </p>
                                <h2 className="text-white text-xl font-semibold mb-2">
                                    {t("landing.h2")}
                                </h2>
                                <div className="text-white/90 space-y-3 mb-8">
                                    {renderBody(t.raw("landing.p1"), 2)}
                                </div>

                                <Link
                                    href={`/${locale}/iq-test/step/1`}
                                    className="inline-flex items-center px-6 py-3 rounded-md bg-white text-gray-900 hover:bg-gray-100 shadow-lg shadow-black/10"
                                >
                                    {t("cta.start")}
                                </Link>
                            </div>

                            <div className="relative hidden md:block">
                                <div
                                    className="absolute -inset-6 blur-3xl opacity-40 bg-gradient-to-tr from-white/40 to-white/0 rounded-full"
                                    aria-hidden="true"
                                />
                                <div className="relative mx-auto w-full max-w-md">
                                    <Image
                                        src="/brain.svg"
                                        alt={t("landing.imageAlt")}
                                        width={400}
                                        height={320}
                                        className="w-full h-auto"
                                    ></Image>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <article className="space-y-8">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                                {t("meta.updated")} • {t("meta.review")}
                            </p>

                            <section className="pb-8 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                    {t("sections.introTitle")}
                                </h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                                    {renderBody(t.raw("sections.introBody"))}
                                    {Array.isArray(introSteps) &&
                                        introSteps.length > 0 && (
                                            <ol className="list-decimal pl-6 space-y-2">
                                                {introSteps.map((step, idx) => (
                                                    <li key={idx}>{step}</li>
                                                ))}
                                            </ol>
                                        )}
                                </div>
                            </section>

                            <section className="pb-8 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                    {t("sections.whatEvaluatesTitle")}
                                </h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                                    {renderBody(
                                        t.raw("sections.whatEvaluatesBody")
                                    )}
                                </div>
                            </section>

                            <section className="pb-8 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                    {t("sections.whoCanDoTitle")}
                                </h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                                    {renderBody(t.raw("sections.whoCanDoBody"))}
                                </div>
                            </section>

                            <section className="pb-8 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                    {t("sections.howWorksTitle")}
                                </h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                                    {renderBody(t.raw("sections.howWorksBody"))}
                                </div>
                            </section>

                            <section className="pb-8 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                    {t("sections.influencesTitle")}
                                </h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300 mb-4">
                                    {renderBody(
                                        t.raw("sections.influencesBody")
                                    )}
                                </div>
                                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                                    {(
                                        t.raw(
                                            "sections.influencesList"
                                        ) as string[]
                                    ).map((item, idx) => (
                                        <li key={idx}>{item}</li>
                                    ))}
                                </ul>
                            </section>

                            {Array.isArray(t.raw("sections.extra")) &&
                                (
                                    t.raw("sections.extra") as Array<{
                                        title: string
                                        body?: string[] | string
                                        list?: string[]
                                        ordered?: boolean
                                    }>
                                ).map((sec, i, arr) => (
                                    <section
                                        key={i}
                                        className={`pb-8 ${i < arr.length - 1 ? "border-b border-gray-200 dark:border-gray-700" : ""}`}
                                    >
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                            {sec.title}
                                        </h2>
                                        {sec.body && (
                                            <div className="space-y-4 text-gray-700 dark:text-gray-300 mb-4">
                                                {renderBody(sec.body)}
                                            </div>
                                        )}
                                        {sec.list && sec.list.length > 0 && (
                                            <div className="text-gray-700 dark:text-gray-300">
                                                {renderList(
                                                    sec.list,
                                                    sec.ordered
                                                )}
                                            </div>
                                        )}
                                    </section>
                                ))}
                        </article>
                    </div>
                </div>
                {/* Emotional CTA section */}
                <div className="bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-600 dark:from-fuchsia-900 dark:via-rose-900 dark:to-pink-900">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
                                    {t("ctaEmotional.title")}
                                </h2>
                                <p className="text-white/90 text-base md:text-lg mb-6">
                                    {t("ctaEmotional.subtitle")}
                                </p>
                                {Array.isArray(
                                    t.raw("ctaEmotional.bullets")
                                ) && (
                                    <ul className="list-disc pl-6 space-y-2 text-white/90 mb-8">
                                        {(
                                            t.raw(
                                                "ctaEmotional.bullets"
                                            ) as string[]
                                        ).map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                )}
                                <Link
                                    href={`/${locale}/iq-test/step/1`}
                                    className="inline-flex items-center px-6 py-3 rounded-md bg-white text-gray-900 hover:bg-gray-100 shadow-lg shadow-black/10"
                                >
                                    {t("cta.start")}
                                </Link>
                            </div>
                            <div className="relative hidden md:block">
                                <div
                                    className="absolute -inset-6 blur-3xl opacity-40 bg-gradient-to-tr from-white/40 to-white/0 rounded-full"
                                    aria-hidden="true"
                                />
                                <div className="relative mx-auto w-full max-w-md">
                                    <Image
                                        src="/brain.svg"
                                        alt={t("landing.imageAlt")}
                                        width={400}
                                        height={320}
                                        className="w-full h-auto"
                                    ></Image>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Footer locale={locale} />
        </>
    )
}

export async function generateMetadata({
    params,
}: IQTestPageProps): Promise<Metadata> {
    const { locale } = await params
    const seoConfig = generateSeoConfig({
        locale,
        path: "/iq-test",
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
                en: "https://www.gabrieltoth.com/en/iq-test/",
                "pt-BR": "https://www.gabrieltoth.com/pt-BR/iq-test/",
                es: "https://www.gabrieltoth.com/es/iq-test/",
                de: "https://www.gabrieltoth.com/de/iq-test/",
                "x-default": "https://www.gabrieltoth.com/pt-BR/iq-test/",
            },
        },
    }
}
