import Footer from "@/components/layout/footer"
import PageHeader from "@/components/layout/page-header"
import { type Locale } from "@/lib/i18n"
import { getLocalizedPath } from "@/lib/url-mapping"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

interface ModsPageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: ModsPageProps): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "minecraft" })

    return {
        title: `${t("landing.modsTitle")} - Gabriel Toth`,
        description: t("landing.modsDescription"),
        keywords: ["minecraft", "mods", "fabric", "forge", "development"],
        openGraph: {
            title: t("landing.modsTitle"),
            description: t("landing.modsDescription"),
            type: "website",
            locale: locale,
        },
    }
}

export default async function ModsPage({ params }: ModsPageProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "minecraft" })
    const tHero = await getTranslations({ locale, namespace: "minecraftModsPageHero" })

    return (
        <>
            <main className="min-h-screen bg-[#1a1a1a] text-white">
                <PageHeader
                    eyebrow={tHero("hero.badge")}
                    title={tHero("hero.title")}
                    subtitle={tHero("hero.subtitle")}
                    className="bg-[#1a1a1a] dark:from-[#1a1a1a] dark:to-[#1a1a1a]"
                />

                <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#1a1a1a]">
                    <div className="max-w-7xl mx-auto">

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                            <div className="bg-[#2d2d2d] border border-neutral-700 rounded-lg p-6">
                                <h2 className="text-2xl font-bold text-white mb-4">
                                    Coming Soon
                                </h2>
                                <p className="text-muted-foreground">
                                    More mods coming soon. Stay tuned!
                                </p>
                            </div>
                        </div>

                        <div className="text-center">
                            <Link
                                href={getLocalizedPath("minecraft", locale)}
                                className="inline-flex items-center text-[#10b981] hover:text-[#34d399] transition-colors"
                            >
                                <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                                {t("landing.title")}
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <Footer locale={locale} />
        </>
    )
}

export const revalidate = 3600
