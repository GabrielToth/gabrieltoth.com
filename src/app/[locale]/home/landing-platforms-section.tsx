"use client"

import { useTranslations } from "next-intl"

export default function LandingPlatformsSection() {
    const t = useTranslations("landing")
    const platforms = t.raw("platforms.items") as Array<{
        name: string
        description: string
    }>

    return (
        <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
                    {t("platforms.title")}
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-16 text-lg">
                    {t("platforms.description")}
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {platforms.map((platform, index) => (
                        <div
                            key={index}
                            className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-500 transition-colors"
                        >
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {platform.name}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {platform.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
