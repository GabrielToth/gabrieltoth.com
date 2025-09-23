import { type Locale } from "@/lib/i18n"
import { getTranslations } from "next-intl/server"

interface AboutSectionProps {
    params: { locale: Locale }
}

export default async function AboutSection({
    params: { locale },
}: AboutSectionProps) {
    const t = await getTranslations({ locale, namespace: "home.about" })

    return (
        <section id="about" className="py-24 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {t("title")}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        {t("description")}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Content */}
                    <div className="space-y-6">
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                                {t("intro")}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                                {t("experience")}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                                {t("passion")}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {t("interests")}
                            </p>
                        </div>

                        <div className="flex items-center space-x-4 pt-4">
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {t("location")}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600 dark:text-gray-300">
                                {t("role")}
                            </span>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                            {t("skills.title")}
                        </h3>

                        <div className="space-y-8">
                            {/* Data Science */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {t("skills.dataScience.title")}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {(
                                        t.raw(
                                            "skills.dataScience.items"
                                        ) as string[]
                                    ).map(skill => (
                                        <span
                                            key={skill}
                                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Frontend */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {t("skills.frontend.title")}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {(
                                        t.raw(
                                            "skills.frontend.items"
                                        ) as string[]
                                    ).map(skill => (
                                        <span
                                            key={skill}
                                            className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Backend */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {t("skills.backend.title")}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {(
                                        t.raw(
                                            "skills.backend.items"
                                        ) as string[]
                                    ).map(skill => (
                                        <span
                                            key={skill}
                                            className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Tools */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {t("skills.tools.title")}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {(
                                        t.raw("skills.tools.items") as string[]
                                    ).map(skill => (
                                        <span
                                            key={skill}
                                            className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
