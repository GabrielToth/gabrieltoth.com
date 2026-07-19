import Footer from "@/components/layout/footer"
import PageHeader from "@/components/layout/page-header"
import { type Locale } from "@/lib/i18n"
import { getLocalizedPath } from "@/lib/url-mapping"
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Link from "next/link"

interface HypixelQolPageProps {
    params: Promise<{ locale: Locale }>
}

export async function generateMetadata({
    params,
}: HypixelQolPageProps): Promise<Metadata> {
    const { locale } = await params
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const t = await getTranslations({ locale, namespace: "minecraft" })

    return {
        title: "Hypixel QoL Modpack - Gabriel Toth",
        description:
            "Explore the Hypixel QoL modpack with quality of life improvements for Minecraft",
        keywords: ["minecraft", "modpack", "hypixel", "qol", "quality of life"],
        openGraph: {
            title: "Hypixel QoL Modpack",
            description:
                "Explore the Hypixel QoL modpack with quality of life improvements",
            type: "website",
            locale: locale,
        },
    }
}

export default async function HypixelQolPage({ params }: HypixelQolPageProps) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "minecraft" })
    const tHero = await getTranslations({ locale, namespace: "minecraftHypixelQolPageHero" })

    return (
        <>
            <main className="min-h-screen bg-[#1a1a1a] text-white">
                <PageHeader
                    eyebrow={tHero("hero.badge")}
                    title={tHero("hero.title")}
                    subtitle={tHero("hero.subtitle")}
                    className="bg-[#1a1a1a] dark:from-[#1a1a1a] dark:to-[#1a1a1a]"
                />

                {/* Navigation Menu */}
                <section className="pb-8 px-4 sm:px-6 lg:px-8 border-b border-neutral-700 bg-[#1a1a1a]">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-wrap gap-4 mb-8">
                            <Link
                                href={getLocalizedPath("minecraft", locale)}
                                className="px-4 py-2 bg-[#2d2d2d] border border-neutral-700 rounded-lg hover:border-[#10b981] transition-all duration-200 text-muted-foreground hover:text-[#10b981]"
                            >
                                ←{" "}
                                {t("landing.title", {
                                    defaultValue: "Minecraft",
                                })}
                            </Link>
                            <Link
                                href={getLocalizedPath(
                                    "minecraft-modpacks",
                                    locale
                                )}
                                className="px-4 py-2 bg-[#2d2d2d] border border-neutral-700 rounded-lg hover:border-[#10b981] transition-all duration-200 text-muted-foreground hover:text-[#10b981]"
                            >
                                {t("landing.modpacksTitle", {
                                    defaultValue: "Modpacks",
                                })}
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Content Section */}
                <section className="py-16 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-[#2d2d2d] border border-neutral-700 rounded-lg p-8">
                            <h2 className="text-3xl font-bold mb-6 text-[#10b981]">
                                About This Modpack
                            </h2>
                            <p className="text-muted-foreground mb-4 text-lg leading-relaxed">
                                The Hypixel QoL modpack is designed to enhance
                                your Minecraft experience with quality of life
                                improvements while maintaining the vanilla feel
                                of the game.
                            </p>
                            <p className="text-muted-foreground mb-4 text-lg leading-relaxed">
                                This modpack focuses on:
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6">
                                <li>Performance optimization</li>
                                <li>Quality of life enhancements</li>
                                <li>Better user interface</li>
                                <li>Improved gameplay mechanics</li>
                            </ul>

                            <div className="mt-8 pt-8 border-t border-neutral-700">
                                <h3 className="text-2xl font-bold mb-4 text-white">
                                    More Information
                                </h3>
                                <p className="text-muted-foreground">
                                    More details about this modpack coming soon.
                                    Check back for updates!
                                </p>
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
