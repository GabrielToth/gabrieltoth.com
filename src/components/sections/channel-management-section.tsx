"use client"

import { useLocale } from "@/hooks/use-locale"
import { type Locale } from "@/lib/i18n"
import { Award, BarChart3, Play, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

const getTranslations = (locale: Locale) => {
    const isPortuguese = locale === "pt-BR"
    return {
        title: isPortuguese ? "Gestão de Canais" : "Channel Management",
        subtitle: isPortuguese
            ? "Transforme Seu Canal em uma Máquina de Crescimento"
            : "Transform Your Channel into a Growth Machine",
        description: isPortuguese
            ? "Especializado em analytics, otimização de conteúdo e estratégias de monetização para YouTube. + de 2M de visualizações mensais gerenciadas com resultados comprovados."
            : "Specialized in analytics, content optimization and monetization strategies for YouTube. + 2M monthly views managed with proven results.",
        features: {
            title: isPortuguese
                ? "Como Posso Ajudar Seu Canal"
                : "How I Can Help Your Channel",
            analytics: {
                title: isPortuguese
                    ? "Análise Completa de Performance"
                    : "Complete Performance Analysis",
                description: isPortuguese
                    ? "Auditoria profunda dos seus analytics com insights acionáveis para otimização imediata"
                    : "Deep audit of your analytics with actionable insights for immediate optimization",
            },
            optimization: {
                title: isPortuguese
                    ? "Estratégia de Conteúdo"
                    : "Content Strategy",
                description: isPortuguese
                    ? "Desenvolvimento de estratégia de conteúdo baseada em dados para maximizar alcance e engajamento"
                    : "Data-driven content strategy development to maximize reach and engagement",
            },
            growth: {
                title: isPortuguese
                    ? "Estratégias de Crescimento"
                    : "Growth Strategies",
                description: isPortuguese
                    ? "Planos personalizados para crescimento sustentável e engajamento com foco em resultados"
                    : "Custom plans for sustainable growth and engagement with focus on results",
            },
            monetization: {
                title: isPortuguese
                    ? "Otimização de Monetização"
                    : "Monetization Optimization",
                description: isPortuguese
                    ? "Estratégias para maximizar revenue através de múltiplos canais de monetização"
                    : "Strategies to maximize revenue through multiple monetization channels",
            },
        },
        results: {
            title: isPortuguese ? "Resultados Comprovados" : "Proven Results",
            subtitle: isPortuguese
                ? "Cases reais de crescimento"
                : "Real growth cases",
            cases: [
                {
                    channel: "WaveIGL",
                    description: isPortuguese
                        ? "Canal Gaming gerenciado por mim"
                        : "Gaming channel managed by me",
                    metrics: [
                        {
                            label: isPortuguese
                                ? "Views mensais"
                                : "Monthly views",
                            value: "2M+",
                        },
                        {
                            label: isPortuguese ? "Crescimento" : "Growth",
                            value: "400%",
                        },
                        {
                            label: isPortuguese ? "Revenue" : "Revenue",
                            value: "5x",
                        },
                    ],
                },
                {
                    channel: "TechCreator",
                    description: isPortuguese
                        ? "Canal de tecnologia - consultoria completa"
                        : "Tech channel - complete consulting",
                    metrics: [
                        {
                            label: isPortuguese ? "Inscritos" : "Subscribers",
                            value: "500K+",
                        },
                        {
                            label: isPortuguese ? "CTR" : "CTR",
                            value: "+300%",
                        },
                        {
                            label: isPortuguese
                                ? "Tempo de view"
                                : "Watch time",
                            value: "+250%",
                        },
                    ],
                },
            ],
        },
        cta: {
            title: isPortuguese
                ? "Pronto para acelerar seu crescimento?"
                : "Ready to accelerate your growth?",
            description: isPortuguese
                ? "Solicite uma consultoria personalizada e descubra como transformar seu canal"
                : "Request a personalized consultation and discover how to transform your channel",
            button: isPortuguese
                ? "Solicitar Consultoria"
                : "Request Consultation",
        },
        stats: [
            {
                value: "2M+",
                label: isPortuguese
                    ? "Visualizações mensais gerenciadas"
                    : "Monthly views managed",
            },
            {
                value: "300%",
                label: isPortuguese
                    ? "Crescimento médio dos clientes"
                    : "Average client growth",
            },
            {
                value: "5+",
                label: isPortuguese
                    ? "Anos de experiência"
                    : "Years of experience",
            },
        ],
        pricing: {
            title: isPortuguese ? "Planos de Consultoria" : "Consulting Plans",
            express: {
                name: isPortuguese ? "Análise Express" : "Express Analysis",
                price: "R$ 497",
                description: isPortuguese
                    ? "Auditoria completa com relatório detalhado"
                    : "Complete audit with detailed report",
            },
            complete: {
                name: isPortuguese
                    ? "Consultoria Completa"
                    : "Complete Consulting",
                price: "R$ 1.497",
                description: isPortuguese
                    ? "Estratégia + implementação + acompanhamento"
                    : "Strategy + implementation + follow-up",
                popular: true,
            },
            intensive: {
                name: isPortuguese
                    ? "Mentoria Intensiva"
                    : "Intensive Mentoring",
                price: isPortuguese ? "Sob consulta" : "Quote on request",
                description: isPortuguese
                    ? "Acompanhamento mensal personalizado"
                    : "Personalized monthly follow-up",
            },
        },
    }
}

export default function ChannelManagementSection() {
    const { locale } = useLocale()
    const t = getTranslations(locale)

    return (
        <section
            id="channel-management"
            className="py-24 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium mb-8">
                        🚀{" "}
                        {locale === "pt-BR"
                            ? "Consultoria Especializada"
                            : "Specialized Consulting"}
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {t.title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                        {t.subtitle}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                        {t.description}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {t.stats.map((stat, index) => (
                        <div
                            key={index}
                            className="text-center bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg"
                        >
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                                {stat.value}
                            </div>
                            <div className="text-gray-600 dark:text-gray-300">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Features */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-12">
                        {t.features.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {t.features.analytics.title}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                {t.features.analytics.description}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="bg-green-100 dark:bg-green-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                <Play className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {t.features.optimization.title}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                {t.features.optimization.description}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {t.features.growth.title}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                {t.features.growth.description}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="bg-yellow-100 dark:bg-yellow-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {t.features.monetization.title}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                {t.features.monetization.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="mb-16">
                    <div className="text-center mb-12">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            {t.results.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            {t.results.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {t.results.cases.map((result, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg"
                            >
                                <div className="flex items-center mb-4">
                                    <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                                        <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                            {result.channel}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            {result.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {result.metrics.map(
                                        (metric, metricIndex) => (
                                            <div
                                                key={metricIndex}
                                                className="text-center"
                                            >
                                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    {metric.value}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-300">
                                                    {metric.label}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center bg-white dark:bg-gray-900 rounded-2xl p-12 shadow-lg">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {t.cta.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                        {t.cta.description}
                    </p>
                    <div className="flex justify-center">
                        <Link
                            href={`/${locale}/channel-management`}
                            className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            {locale === "pt-BR" ? "Ver Planos" : "View Plans"}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
