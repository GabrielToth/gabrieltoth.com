import Footer from "@/components/layout/footer"
import { type Locale } from "@/lib/i18n"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"

interface ContributionsPageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: ContributionsPageProps): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "minecraft" })

    return {
        title: `${t("contributions.title", { defaultValue: "Contributions" })} - Gabriel Toth`,
        description: t("contributions.description", {
            defaultValue: "My contributions to Minecraft projects and mods",
        }),
        keywords: [
            "minecraft",
            "contributions",
            "open source",
            "mods",
            "plugins",
        ],
        openGraph: {
            title: t("contributions.title", { defaultValue: "Contributions" }),
            description: t("contributions.description", {
                defaultValue: "My contributions to Minecraft projects and mods",
            }),
            type: "website",
            locale: locale,
        },
    }
}

export default async function ContributionsPage({
    params,
}: ContributionsPageProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "minecraft" })

    return (
        <>
            <main className="min-h-screen bg-[#1a1a1a] text-white">
                {/* Hero Section */}
                <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent">
                                {t("contributions.title", {
                                    defaultValue: "Contributions",
                                })}
                            </h1>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                                {t("contributions.subtitle", {
                                    defaultValue:
                                        "My contributions to Minecraft projects and community",
                                })}
                            </p>
                        </div>

                        {/* Coming Soon */}
                        <div className="bg-[#242424] border border-neutral-700 rounded-lg p-12 max-w-4xl mx-auto text-center">
                            <h2 className="text-3xl font-bold mb-4 text-[#10b981]">
                                {t("contributions.comingSoon", {
                                    defaultValue: "Coming Soon",
                                })}
                            </h2>
                            <p className="text-gray-300 text-lg">
                                {t("contributions.comingSoonText", {
                                    defaultValue:
                                        "This section is currently under development. Check back soon for updates!",
                                })}
                            </p>
                        </div>
                    </div>
                </section>
            </main>
            <Footer locale={locale} />
        </>
    )
}

export const revalidate = 3600
