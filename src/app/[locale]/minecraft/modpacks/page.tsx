import Footer from "@/components/layout/footer"
import { type Locale } from "@/lib/i18n"
import { getLocalizedPath } from "@/lib/url-mapping"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

interface ModpacksPageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: ModpacksPageProps): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "minecraft" })

    return {
        title: `${t("landing.modpacksTitle")} - Gabriel Toth`,
        description: t("landing.modpacksDescription"),
        keywords: ["minecraft", "modpacks", "fabric", "forge", "gaming"],
        openGraph: {
            title: t("landing.modpacksTitle"),
            description: t("landing.modpacksDescription"),
            type: "website",
            locale: locale,
        },
    }
}

export default async function ModpacksPage({ params }: ModpacksPageProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "minecraft" })

    return (
        <>
            <main className="min-h-screen bg-[#1a1a1a] text-white">
                <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent">
                                {t("landing.modpacksTitle")}
                            </h1>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                                {t("landing.modpacksDescription")}
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                            <Link
                                href={getLocalizedPath(
                                    "minecraft-modpacks-hypixel-qol",
                                    locale
                                )}
                                className="group bg-[#2d2d2d] border border-neutral-700 rounded-lg p-6 hover:border-[#10b981] transition-all duration-200 hover:shadow-lg hover:shadow-[#10b981]/20"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-white group-hover:text-[#10b981] transition-colors">
                                        Hypixel QoL
                                    </h2>
                                    <svg
                                        className="w-6 h-6 text-[#10b981] transform group-hover:translate-x-1 transition-transform"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </div>
                                <p className="text-gray-400">
                                    Quality of Life modpack optimized for
                                    Hypixel
                                </p>
                            </Link>
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
