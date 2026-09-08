import Footer from "@/components/layout/footer"
import PageHeader from "@/components/layout/page-header"
import { type Locale } from "@/lib/i18n"
import { getLocalizedPath } from "@/lib/url-mapping"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

interface MinecraftPageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: MinecraftPageProps): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "minecraft" })

    return {
        title: `${t("landing.title")} - Gabriel Toth`,
        description: t("landing.description"),
        keywords: [
            "minecraft",
            "modpacks",
            "mods",
            "hypixel",
            "fabric",
            "optimization",
            "gaming",
            "programming",
        ],
        openGraph: {
            title: t("landing.title"),
            description: t("landing.description"),
            type: "website",
            locale: locale,
        },
    }
}

export default async function MinecraftPage({ params }: MinecraftPageProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "minecraft" })
    const tHero = await getTranslations({
        locale,
        namespace: "minecraftPageHero",
    })

    return (
        <>
            <main className="min-h-screen bg-[var(--background)] text-white">
                <PageHeader
                    eyebrow={tHero("hero.badge")}
                    title={tHero("hero.title")}
                    subtitle={tHero("hero.subtitle")}
                    className="bg-[var(--background)] dark:from-[var(--background)] dark:to-[var(--background)]"
                />

                <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[var(--background)]">
                    <div className="max-w-7xl mx-auto">
                        {/* Journey Section */}
                        <div className="bg-[var(--background)] border border-neutral-700 rounded-lg p-8 max-w-4xl mx-auto">
                            <h2 className="text-3xl font-bold mb-6 text-[#10b981]">
                                {t("landing.journey.title")}
                            </h2>

                            {/* My Story */}
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-4 text-white">
                                    {t("landing.journey.myStory", {
                                        defaultValue:
                                            "My Minecraft Journey Since 2013",
                                    })}
                                </h3>
                                <p className="text-muted-foreground mb-4 text-lg leading-relaxed">
                                    {t("landing.journey.storyIntro", {
                                        defaultValue:
                                            "I've been playing Minecraft since 2013, thanks to a friend's recommendation. Initially skeptical about the game, I decided to give it a try a week after being introduced to it. What started as a casual test became a passion—today, Minecraft is my favorite game and a significant part of my gaming identity.",
                                    })}
                                </p>
                                <p className="text-muted-foreground mb-4 text-lg leading-relaxed">
                                    {t("landing.journey.modpacksPreference", {
                                        defaultValue:
                                            "My primary focus is on challenging modpacks where difficulty enhances the experience. I've extensively played the All The Mods series (both standard and Skyblock variants) and recently completed GregTech: New Horizon. I'm passionate about exploring harder modpacks and creating content around them. The main limitation is hardware—a dedicated graphics card would significantly expand my capabilities for streaming and content creation.",
                                    })}
                                </p>
                                <p className="text-muted-foreground mb-4 text-lg leading-relaxed">
                                    {t("landing.journey.hypixelSkyblock", {
                                        defaultValue:
                                            "Hypixel's Skyblock stands out as a unique experience. They've transformed the traditional Skyblock concept into a full RPG world with narrative elements, political systems, and meaningful incentives for complex, repetitive, and luck-dependent tasks. It's a masterclass in game design that goes far beyond standard Skyblock gameplay.",
                                    })}
                                </p>
                                <p className="text-muted-foreground text-lg leading-relaxed">
                                    {t("landing.journey.futureGoals", {
                                        defaultValue:
                                            "My goals include creating comprehensive content about challenging modpacks, exploring emerging modpack ecosystems, and potentially developing my own modifications. I'm committed to sharing knowledge about optimization, progression strategies, and the technical aspects of modded Minecraft with the community.",
                                    })}
                                </p>
                            </div>

                            {/* Content Categories */}
                            <div className="grid md:grid-cols-3 gap-6 mt-8">
                                {/* Modpacks */}
                                <Link
                                    href={getLocalizedPath(
                                        "minecraft-modpacks",
                                        locale
                                    )}
                                    className="bg-[var(--background)] border border-neutral-700 rounded-lg p-6 hover:border-[#10b981] transition-all duration-200 hover:shadow-lg hover:shadow-[#10b981]/20"
                                >
                                    <h3 className="text-xl font-bold mb-3 text-white hover:text-[#10b981] transition-colors">
                                        {t("landing.journey.modpacks", {
                                            defaultValue: "Modpacks",
                                        })}
                                    </h3>
                                    <p className="text-muted-foreground text-sm">
                                        {t("landing.journey.modpacksText", {
                                            defaultValue:
                                                "Explore curated modpack recommendations, progression guides, and difficulty rankings for challenging gameplay experiences.",
                                        })}
                                    </p>
                                </Link>

                                {/* Mods */}
                                <Link
                                    href={getLocalizedPath(
                                        "minecraft-mods",
                                        locale
                                    )}
                                    className="bg-[var(--background)] border border-neutral-700 rounded-lg p-6 hover:border-[#10b981] transition-all duration-200 hover:shadow-lg hover:shadow-[#10b981]/20"
                                >
                                    <h3 className="text-xl font-bold mb-3 text-white hover:text-[#10b981] transition-colors">
                                        {t("landing.journey.mods", {
                                            defaultValue: "Mods",
                                        })}
                                    </h3>
                                    <p className="text-muted-foreground text-sm">
                                        {t("landing.journey.modsText", {
                                            defaultValue:
                                                "Discover individual mods that enhance gameplay, improve performance, and transform the Minecraft experience with new mechanics and content.",
                                        })}
                                    </p>
                                </Link>

                                {/* Plugins */}
                                <Link
                                    href={getLocalizedPath(
                                        "minecraft-plugins",
                                        locale
                                    )}
                                    className="bg-[var(--background)] border border-neutral-700 rounded-lg p-6 hover:border-[#10b981] transition-all duration-200 hover:shadow-lg hover:shadow-[#10b981]/20"
                                >
                                    <h3 className="text-xl font-bold mb-3 text-white hover:text-[#10b981] transition-colors">
                                        {t("landing.journey.plugins", {
                                            defaultValue: "Plugins",
                                        })}
                                    </h3>
                                    <p className="text-muted-foreground text-sm">
                                        {t("landing.journey.pluginsText", {
                                            defaultValue:
                                                "Server plugins and modifications for enhanced multiplayer experiences, custom mechanics, and community-driven gameplay.",
                                        })}
                                    </p>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer locale={locale} />
        </>
    )
}

export const revalidate = 3600
