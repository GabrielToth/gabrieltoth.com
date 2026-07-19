"use client"

import { useTranslations } from "next-intl"

export default function LandingPlatformsSection() {
    const t = useTranslations("landing")
    const platforms = t.raw("platforms.items") as Array<{
        name: string
        description: string
    }>

    return (
        <section className="py-20 px-4 bg-muted dark:bg-card">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold text-center text-foreground dark:text-foreground mb-4">
                    {t("platforms.title")}
                </h2>
                <p className="text-center text-muted-foreground dark:text-muted-foreground mb-16 text-lg">
                    {t("platforms.description")}
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {platforms.map((platform, index) => (
                        <div
                            key={index}
                            className="p-6 bg-card dark:bg-background rounded-lg border border-border dark:border-border hover:border-blue-600 dark:hover:border-primary transition-colors"
                        >
                            <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-2">
                                {platform.name}
                            </h3>
                            <p className="text-muted-foreground dark:text-muted-foreground">
                                {platform.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
