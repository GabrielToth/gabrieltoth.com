"use client"

import Header from "@/components/layout/header"
import { useLocale } from "@/hooks/use-locale"
import { type Locale } from "@/lib/i18n"

const getTranslations = (locale: Locale) => {
    const translations = {
        en: {
            title: "Social Analytics Engine Investment",
            description:
                "Invest in our cutting-edge social media analytics platform that integrates multiple data sources for comprehensive digital campaign analysis.",
            whyInvestTitle: "Why Invest in Social Analytics Engine?",
            marketDemandTitle: "Market Demand",
            marketDemandDesc:
                "Growing demand for comprehensive social media analytics solutions.",
            technologyTitle: "Technology Stack",
            technologyDesc:
                "Built with Python, PostgreSQL, and modern cloud infrastructure.",
            roiTitle: "ROI Potential",
            roiDesc: "High potential return with scalable SaaS business model.",
            platformFeaturesTitle: "Platform Features",
            investmentTiersTitle: "Investment Tiers",
            seedLevel: "Seed Level - $10k",
            seedDesc: "Early supporter with quarterly updates",
            growthLevel: "Growth Level - $50k",
            growthDesc: "Equity stake with advisory role",
            features: {
                analytics: "Google Analytics Integration",
                social: "Multi-platform Social Media Metrics",
                stripe: "Stripe Conversion Tracking",
                realtime: "Real-time Campaign Analysis",
                ml: "Machine Learning Insights",
            },
        },
        "pt-BR": {
            title: "Investimento no Social Analytics Engine",
            description:
                "Invista na nossa plataforma de analytics de redes sociais de ponta que integra múltiplas fontes de dados para análise abrangente de campanhas digitais.",
            whyInvestTitle: "Por que Investir no Social Analytics Engine?",
            marketDemandTitle: "Demanda de Mercado",
            marketDemandDesc:
                "Crescente demanda por soluções abrangentes de analytics de redes sociais.",
            technologyTitle: "Stack Tecnológico",
            technologyDesc:
                "Construído com Python, PostgreSQL e infraestrutura moderna em nuvem.",
            roiTitle: "Potencial de ROI",
            roiDesc:
                "Alto potencial de retorno com modelo de negócio SaaS escalável.",
            platformFeaturesTitle: "Recursos da Plataforma",
            investmentTiersTitle: "Níveis de Investimento",
            seedLevel: "Nível Seed - $10k",
            seedDesc: "Apoiador inicial com atualizações trimestrais",
            growthLevel: "Nível Growth - $50k",
            growthDesc: "Participação acionária com papel consultivo",
            features: {
                analytics: "Integração com Google Analytics",
                social: "Métricas de Múltiplas Redes Sociais",
                stripe: "Rastreamento de Conversão Stripe",
                realtime: "Análise de Campanha em Tempo Real",
                ml: "Insights de Machine Learning",
            },
        },
    }
    return translations[locale] || translations.en
}

export default function SocialAnalyticsInvestmentPage() {
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

                    <div className="mt-16">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-12">
                            <h2 className="text-3xl font-bold mb-6">
                                {t.whyInvestTitle}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">
                                        {t.marketDemandTitle}
                                    </h3>
                                    <p>{t.marketDemandDesc}</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">
                                        {t.technologyTitle}
                                    </h3>
                                    <p>{t.technologyDesc}</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">
                                        {t.roiTitle}
                                    </h3>
                                    <p>{t.roiDesc}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t.platformFeaturesTitle}
                                </h3>
                                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                                    <li>• {t.features.analytics}</li>
                                    <li>• {t.features.social}</li>
                                    <li>• {t.features.stripe}</li>
                                    <li>• {t.features.realtime}</li>
                                    <li>• {t.features.ml}</li>
                                </ul>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t.investmentTiersTitle}
                                </h3>
                                <div className="space-y-3">
                                    <div className="border-l-4 border-blue-500 pl-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {t.seedLevel}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            {t.seedDesc}
                                        </p>
                                    </div>
                                    <div className="border-l-4 border-purple-500 pl-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {t.growthLevel}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            {t.growthDesc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
