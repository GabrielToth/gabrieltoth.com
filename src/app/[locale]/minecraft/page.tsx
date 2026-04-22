import Footer from "@/components/layout/footer"
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

    return (
        <>
            <main className="min-h-screen bg-[#1a1a1a] text-white">
                {/* Hero Section */}
                <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent">
                                {t("landing.title")}
                            </h1>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                                {t("landing.subtitle")}
                            </p>
                        </div>

                        {/* Category Cards */}
                        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
                            {/* Modpacks Card */}
                            <Link
                                href={getLocalizedPath(
                                    "minecraft-modpacks",
                                    locale
                                )}
                                className="group bg-[#2d2d2d] border border-neutral-700 rounded-lg p-8 hover:border-[#10b981] transition-all duration-200 hover:shadow-lg hover:shadow-[#10b981]/20"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-white group-hover:text-[#10b981] transition-colors">
                                        {t("landing.modpacksTitle")}
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
                                    {t("landing.modpacksDescription")}
                                </p>
                            </Link>

                            {/* Mods Card */}
                            <Link
                                href={getLocalizedPath(
                                    "minecraft-mods",
                                    locale
                                )}
                                className="group bg-[#2d2d2d] border border-neutral-700 rounded-lg p-8 hover:border-[#10b981] transition-all duration-200 hover:shadow-lg hover:shadow-[#10b981]/20"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-white group-hover:text-[#10b981] transition-colors">
                                        {t("landing.modsTitle")}
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
                                    {t("landing.modsDescription")}
                                </p>
                            </Link>
                        </div>

                        {/* Journey Section */}
                        <div className="bg-[#242424] border border-neutral-700 rounded-lg p-8 max-w-4xl mx-auto">
                            <h2 className="text-3xl font-bold mb-6 text-[#10b981]">
                                {t("landing.journey.title")}
                            </h2>

                            {/* My Story */}
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-4 text-white">
                                    {t("landing.journey.myStory", {
                                        defaultValue: "My Minecraft Journey",
                                    })}
                                </h3>
                                <p className="text-gray-300 mb-4 text-lg leading-relaxed">
                                    {t("landing.journey.storyIntro", {
                                        defaultValue:
                                            "I've been playing Minecraft since 2013, thanks to a friend's recommendation. I had prejudices against the game and didn't see the appeal at first, but when he introduced me to it, I decided to give it a try a week later. I downloaded it to test it out, and I ended up loving it. Today, Minecraft is my favorite game.",
                                    })}
                                </p>
                                <p className="text-gray-300 mb-4 text-lg leading-relaxed">
                                    {t("landing.journey.modpacksPreference", {
                                        defaultValue:
                                            "I generally play modpacks, and the more difficult, the better. I've played through the entire All The Mods series, both the normal version and the Skyblock version. More recently, I've been playing GregTech: New Horizon. I have aspirations to play more difficult or well-known modpacks and even create more content about them. Currently, the only thing preventing me from doing so is the lack of a graphics card.",
                                    })}
                                </p>
                                <p className="text-gray-300 text-lg leading-relaxed">
                                    {t("landing.journey.hypixelSkyblock", {
                                        defaultValue:
                                            "I also love Hypixel's Skyblock because they've transformed the Skyblock experience into a true RPG world with story, politics, and incentives for complex, repetitive, or luck-dependent tasks. The experience is far from a normal Skyblock.",
                                    })}
                                </p>
                            </div>

                            {/* Content Categories */}
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Modpacks */}
                                <div className="bg-[#2d2d2d] border border-neutral-700 rounded-lg p-6">
                                    <h3 className="text-xl font-bold mb-3 text-white">
                                        {t("landing.journey.modpacks", {
                                            defaultValue: "Modpacks",
                                        })}
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        {t("landing.journey.modpacksText", {
                                            defaultValue:
                                                "Explore my favorite modpacks and recommendations for challenging gameplay experiences.",
                                        })}
                                    </p>
                                </div>

                                {/* Mods */}
                                <div className="bg-[#2d2d2d] border border-neutral-700 rounded-lg p-6">
                                    <h3 className="text-xl font-bold mb-3 text-white">
                                        {t("landing.journey.mods", {
                                            defaultValue: "Mods",
                                        })}
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        {t("landing.journey.modsText", {
                                            defaultValue:
                                                "Discover individual mods that enhance and transform the Minecraft experience.",
                                        })}
                                    </p>
                                </div>

                                {/* Plugins */}
                                <div className="bg-[#2d2d2d] border border-neutral-700 rounded-lg p-6">
                                    <h3 className="text-xl font-bold mb-3 text-white">
                                        {t("landing.journey.plugins", {
                                            defaultValue: "Plugins",
                                        })}
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        {t("landing.journey.pluginsText", {
                                            defaultValue:
                                                "Server plugins and modifications for enhanced multiplayer experiences.",
                                        })}
                                    </p>
                                </div>
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
