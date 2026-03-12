"use client"

import { useTranslations } from "next-intl"

export default function LandingFeaturesSection() {
    const t = useTranslations("landing")
    const features = t.raw("features.items") as Array<{
        title: string
        description: string
    }>

    return (
        <section id="features" className="py-20 px-4 bg-white dark:bg-gray-900">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
                    {t("features.title")}
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-16 text-lg">
                    {t("hero.description")}
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                        >
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-white font-bold text-xl">
                                    {index + 1}
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
