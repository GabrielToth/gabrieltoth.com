"use client"

import { useLocale } from "@/hooks/use-locale"
import { type Locale } from "@/lib/i18n"

const getTranslations = (locale: Locale) => {
    const translations = {
        en: {
            title: "SpeedPC Services",
            description:
                "Professional SpeedPC services to maximize your gaming performance and reduce latency.",
            performanceTitle: "Performance Optimization",
            performanceDesc:
                "System tweaks and optimizations to maximize FPS and reduce input lag.",
            hardwareTitle: "Hardware Analysis",
            hardwareDesc:
                "Complete hardware analysis and upgrade recommendations.",
            customTitle: "Custom Setup",
            customDesc:
                "Personalized gaming setup configuration and software optimization.",
        },
        "pt-BR": {
            title: "Serviços SpeedPC",
            description:
                "Serviços profissionais SpeedPC para maximizar sua performance gaming e reduzir latência.",
            performanceTitle: "Otimização de Performance",
            performanceDesc:
                "Ajustes e otimizações no sistema para maximizar FPS e reduzir input lag.",
            hardwareTitle: "Análise de Hardware",
            hardwareDesc:
                "Análise completa de hardware e recomendações de upgrade.",
            customTitle: "Configuração Personalizada",
            customDesc:
                "Configuração personalizada de setup gaming e otimização de software.",
        },
    }
    return translations[locale] || translations.en
}

export default function PCOptimizationPage() {
    const { locale } = useLocale()
    const t = getTranslations(locale)

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                        {t.title}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        {t.description}
                    </p>
                </div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t.performanceTitle}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            {t.performanceDesc}
                        </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t.hardwareTitle}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            {t.hardwareDesc}
                        </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t.customTitle}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            {t.customDesc}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
