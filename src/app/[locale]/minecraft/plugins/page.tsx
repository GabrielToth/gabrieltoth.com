import Footer from "@/components/layout/footer"
import PageHeader from "@/components/layout/page-header"
import { type Locale } from "@/lib/i18n"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"

interface PluginsPageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: PluginsPageProps): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "minecraft" })

    return {
        title: `${t("plugins.title", { defaultValue: "Plugins" })} - Gabriel Toth`,
        description: t("plugins.description", {
            defaultValue: "Minecraft plugins and server modifications",
        }),
        keywords: [
            "minecraft",
            "plugins",
            "server",
            "spigot",
            "bukkit",
            "paper",
        ],
        openGraph: {
            title: t("plugins.title", { defaultValue: "Plugins" }),
            description: t("plugins.description", {
                defaultValue: "Minecraft plugins and server modifications",
            }),
            type: "website",
            locale: locale,
        },
    }
}

export default async function PluginsPage({ params }: PluginsPageProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "minecraft" })
    const tHero = await getTranslations({ locale, namespace: "minecraftPluginsPageHero" })

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
                        <div className="bg-[#242424] border border-neutral-700 rounded-lg p-12 max-w-4xl mx-auto text-center">
                            <h2 className="text-3xl font-bold mb-4 text-[#10b981]">
                                {t("plugins.comingSoon", {
                                    defaultValue: "Coming Soon",
                                })}
                            </h2>
                            <p className="text-muted-foreground text-lg">
                                {t("plugins.comingSoonText", {
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
