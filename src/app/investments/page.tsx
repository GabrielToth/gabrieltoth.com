"use client"

import Header from "@/components/layout/header"
import { useLocale } from "@/hooks/use-locale"
import { type Locale } from "@/lib/i18n"

const getTranslations = (locale: Locale) => {
    const translations = {
        en: {
            title: "Investment Opportunities",
            description:
                "Explore investment opportunities in tech projects and digital analytics solutions.",
            socialAnalyticsTitle: "Social Analytics Engine",
            socialAnalyticsDesc:
                "Investment opportunity in our advanced social media analytics platform.",
            learnMore: "Learn More",
            techConsultingTitle: "Tech Consulting",
            techConsultingDesc:
                "Strategic tech consulting and digital transformation services.",
            contactUs: "Contact Us",
        },
        "pt-BR": {
            title: "Oportunidades de Investimento",
            description:
                "Explore oportunidades de investimento em projetos de tecnologia e soluções de analytics digitais.",
            socialAnalyticsTitle: "Social Analytics Engine",
            socialAnalyticsDesc:
                "Oportunidade de investimento na nossa plataforma avançada de analytics de redes sociais.",
            learnMore: "Saiba Mais",
            techConsultingTitle: "Consultoria Tech",
            techConsultingDesc:
                "Consultoria estratégica em tecnologia e serviços de transformação digital.",
            contactUs: "Entre em Contato",
        },
    }
    return translations[locale] || translations.en
}

export default function InvestmentsPage() {
    const { locale } = useLocale()
    const t = getTranslations(locale)

    return (
        <>
            <Header />
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

                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                {t.socialAnalyticsTitle}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                {t.socialAnalyticsDesc}
                            </p>
                            <a
                                href="/social-analytics-investment"
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {t.learnMore}
                            </a>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                {t.techConsultingTitle}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                {t.techConsultingDesc}
                            </p>
                            <a
                                href="#contact"
                                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                {t.contactUs}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
