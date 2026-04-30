import { type Locale } from "@/lib/i18n"
import { BarChart3, Play, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

const getTranslations = (locale: Locale) => {
    return {
        title:
            locale === "pt-BR"
                ? "Channel Management"
                : locale === "es"
                  ? "Gestión de Canales"
                  : locale === "de"
                    ? "Kanalverwaltung"
                    : "Channel Management",
        subtitle:
            locale === "pt-BR"
                ? "Transform Your Channel into a Growth Machine"
                : locale === "es"
                  ? "Transforma tu canal en una máquina de crecimiento"
                  : locale === "de"
                    ? "Verwandle deinen Kanal in eine Wachstumsmaschine"
                    : "Transform Your Channel into a Growth Machine",
        description:
            locale === "pt-BR"
                ? "Specialized in analytics, content optimization and monetization strategies for YouTube. + 2M monthly views managed with proven results."
                : locale === "es"
                  ? "Especializado en analítica, optimización de contenido y estrategias de monetización para YouTube. Más de 2M de visualizaciones mensuales gestionadas con resultados comprobados."
                  : locale === "de"
                    ? "Spezialisiert auf Analytik, Inhaltsoptimierung und Monetarisierungsstrategien für YouTube. Über 2 Mio. monatliche Aufrufe mit nachgewiesenen Ergebnissen."
                    : "Specialized in analytics, content optimization and monetization strategies for YouTube. + 2M monthly views managed with proven results.",
        features: {
            title:
                locale === "pt-BR"
                    ? "How I Can Help Your Channel"
                    : locale === "es"
                      ? "Cómo puedo ayudar a tu canal"
                      : locale === "de"
                        ? "Wie ich deinem Kanal helfen kann"
                        : "How I Can Help Your Channel",
            analytics: {
                title:
                    locale === "pt-BR"
                        ? "Complete Performance Analysis"
                        : locale === "es"
                          ? "Análisis Completo de Rendimiento"
                          : locale === "de"
                            ? "Umfassende Leistungsanalyse"
                            : "Complete Performance Analysis",
                description:
                    locale === "pt-BR"
                        ? "Deep audit of your analytics with actionable insights for immediate optimization"
                        : locale === "es"
                          ? "Auditoría profunda de tus analíticas con insights accionables para optimización inmediata"
                          : locale === "de"
                            ? "Tiefgreifende Analyse Ihrer Analytics mit umsetzbaren Erkenntnissen für sofortige Optimierung"
                            : "Deep audit of your analytics with actionable insights for immediate optimization",
            },
            optimization: {
                title:
                    locale === "pt-BR"
                        ? "Content Strategy"
                        : locale === "es"
                          ? "Estrategia de Contenido"
                          : locale === "de"
                            ? "Content-Strategie"
                            : "Content Strategy",
                description:
                    locale === "pt-BR"
                        ? "Data-driven content strategy development to maximize reach and engagement"
                        : locale === "es"
                          ? "Desarrollo de estrategia de contenido basada en datos para maximizar alcance y engagement"
                          : locale === "de"
                            ? "Entwicklung einer datengesteuerten Content-Strategie zur Maximierung von Reichweite und Engagement"
                            : "Data-driven content strategy development to maximize reach and engagement",
            },
            growth: {
                title:
                    locale === "pt-BR"
                        ? "Growth Strategies"
                        : locale === "es"
                          ? "Estrategias de Crecimiento"
                          : locale === "de"
                            ? "Wachstumsstrategien"
                            : "Growth Strategies",
                description:
                    locale === "pt-BR"
                        ? "Custom plans for sustainable growth and engagement with focus on results"
                        : locale === "es"
                          ? "Planes personalizados para un crecimiento sostenible y engagement con foco en resultados"
                          : locale === "de"
                            ? "Individuelle Pläne für nachhaltiges Wachstum und Engagement mit Fokus auf Ergebnisse"
                            : "Custom plans for sustainable growth and engagement with focus on results",
            },
            monetization: {
                title:
                    locale === "pt-BR"
                        ? "Monetization Optimization"
                        : locale === "es"
                          ? "Optimización de Monetización"
                          : locale === "de"
                            ? "Monetarisierungsoptimierung"
                            : "Monetization Optimization",
                description:
                    locale === "pt-BR"
                        ? "Strategies to maximize revenue through multiple monetization channels"
                        : locale === "es"
                          ? "Estrategias para maximizar ingresos a través de múltiples canales de monetización"
                          : locale === "de"
                            ? "Strategien zur Maximierung der Einnahmen über mehrere Monetarisierungskanäle"
                            : "Strategies to maximize revenue through multiple monetization channels",
            },
        },
        results: {
            title:
                locale === "pt-BR"
                    ? "Proven Results"
                    : locale === "es"
                      ? "Resultados Comprobados"
                      : locale === "de"
                        ? "Nachgewiesene Ergebnisse"
                        : "Proven Results",
            subtitle:
                locale === "pt-BR"
                    ? "Real growth cases"
                    : locale === "es"
                      ? "Casos reales de crecimiento"
                      : locale === "de"
                        ? "Reale Wachstumsfälle"
                        : "Real growth cases",
            cases: [
                {
                    channel: "WaveIGL",
                    description:
                        locale === "pt-BR"
                            ? "Gaming channel managed by me"
                            : locale === "es"
                              ? "Canal de Gaming gestionado por mí"
                              : locale === "de"
                                ? "Gaming-Kanal, den ich verwalte"
                                : "Gaming channel managed by me",
                    metrics: [
                        {
                            label:
                                locale === "pt-BR"
                                    ? "Monthly views"
                                    : locale === "es"
                                      ? "Vistas mensuales"
                                      : locale === "de"
                                        ? "Monatliche Aufrufe"
                                        : "Monthly views",
                            value: "2M+",
                        },
                        {
                            label:
                                locale === "pt-BR"
                                    ? "Growth"
                                    : locale === "es"
                                      ? "Crecimiento"
                                      : locale === "de"
                                        ? "Wachstum"
                                        : "Growth",
                            value: "400%",
                        },
                        {
                            label: locale === "pt-BR" ? "Revenue" : "Revenue",
                            value: "5x",
                        },
                    ],
                },
                {
                    channel: "Gabriel Toth (inactive)",
                    description:
                        locale === "pt-BR"
                            ? "My personal channel - Historical case"
                            : locale === "es"
                              ? "Mi canal personal - Caso histórico"
                              : locale === "de"
                                ? "Mein persönlicher Kanal - Historischer Fall"
                                : "My personal channel - Historical case",
                    metrics: [
                        {
                            label:
                                locale === "pt-BR"
                                    ? "Total views"
                                    : locale === "es"
                                      ? "Vistas totales"
                                      : locale === "de"
                                        ? "Gesamtaufrufe"
                                        : "Total views",
                            value: "1M+",
                        },
                        {
                            label:
                                locale === "pt-BR"
                                    ? "Current subscribers"
                                    : locale === "es"
                                      ? "Suscriptores actuales"
                                      : locale === "de"
                                        ? "Aktuelle Abonnenten"
                                        : "Current subscribers",
                            value: "1.4K+",
                        },
                        {
                            label:
                                locale === "pt-BR"
                                    ? "Views with <1K subs"
                                    : locale === "es"
                                      ? "Vistas con <1K subs"
                                      : locale === "de"
                                        ? "Aufrufe mit <1K Abos"
                                        : "Views with <1K subs",
                            value: "1M+",
                        },
                    ],
                },
            ],
        },
        cta: {
            title:
                locale === "pt-BR"
                    ? "Ready to accelerate your growth?"
                    : locale === "es"
                      ? "¿Listo para acelerar tu crecimiento?"
                      : locale === "de"
                        ? "Bereit, dein Wachstum zu beschleunigen?"
                        : "Ready to accelerate your growth?",
            description:
                locale === "pt-BR"
                    ? "Request a personalized consultation and discover how to transform your channel"
                    : locale === "es"
                      ? "Solicita una consultoría personalizada y descubre cómo transformar tu canal"
                      : locale === "de"
                        ? "Fordere eine personalisierte Beratung an und entdecke, wie du deinen Kanal transformieren kannst"
                        : "Request a personalized consultation and discover how to transform your channel",
            button:
                locale === "pt-BR"
                    ? "Request Consultation"
                    : locale === "es"
                      ? "Solicitar Consultoría"
                      : locale === "de"
                        ? "Beratung anfordern"
                        : "Request Consultation",
        },
        stats: [
            {
                value: "2M+",
                label:
                    locale === "pt-BR"
                        ? "Monthly views managed"
                        : locale === "es"
                          ? "Vistas mensuales gestionadas"
                          : locale === "de"
                            ? "Verwaltete monatliche Aufrufe"
                            : "Monthly views managed",
            },
            {
                value: "300%",
                label:
                    locale === "pt-BR"
                        ? "Average client growth"
                        : locale === "es"
                          ? "Crecimiento medio de clientes"
                          : locale === "de"
                            ? "Durchschnittliches Kundenwachstum"
                            : "Average client growth",
            },
            {
                value: "5+",
                label:
                    locale === "pt-BR"
                        ? "Years of experience"
                        : locale === "es"
                          ? "Años de experiencia"
                          : locale === "de"
                            ? "Jahre Erfahrung"
                            : "Years of experience",
            },
        ],
        pricing: {
            title:
                locale === "pt-BR"
                    ? "Consulting Plans"
                    : locale === "es"
                      ? "Planes de Consultoría"
                      : locale === "de"
                        ? "Beratungspläne"
                        : "Consulting Plans",
            express: {
                name:
                    locale === "pt-BR"
                        ? "Express Analysis"
                        : locale === "es"
                          ? "Análisis Express"
                          : locale === "de"
                            ? "Express-Analyse"
                            : "Express Analysis",
                price: "R$ 497",
                description:
                    locale === "pt-BR"
                        ? "Complete audit with detailed report"
                        : locale === "es"
                          ? "Auditoría completa con informe detallado"
                          : locale === "de"
                            ? "Umfassendes Audit mit detailliertem Bericht"
                            : "Complete audit with detailed report",
            },
            complete: {
                name:
                    locale === "pt-BR"
                        ? "Consultoria Completa"
                        : locale === "es"
                          ? "Consultoría Completa"
                          : locale === "de"
                            ? "Komplette Beratung"
                            : "Complete Consulting",
                price: "R$ 1.497",
                description:
                    locale === "pt-BR"
                        ? "Estratégia + implementação + acompanhamento"
                        : locale === "es"
                          ? "Estrategia + implementación + seguimiento"
                          : locale === "de"
                            ? "Strategie + Umsetzung + Betreuung"
                            : "Strategy + implementation + follow-up",
                popular: true,
            },
            intensive: {
                name:
                    locale === "pt-BR"
                        ? "Mentoria Intensiva"
                        : locale === "es"
                          ? "Mentoría Intensiva"
                          : locale === "de"
                            ? "Intensivbetreuung"
                            : "Intensive Mentoring",
                price:
                    locale === "pt-BR"
                        ? "Sob consulta"
                        : locale === "es"
                          ? "A consultar"
                          : locale === "de"
                            ? "Auf Anfrage"
                            : "Quote on request",
                description:
                    locale === "pt-BR"
                        ? "Acompanhamento mensal personalizado"
                        : locale === "es"
                          ? "Acompañamiento mensual personalizado"
                          : locale === "de"
                            ? "Personalisierte monatliche Betreuung"
                            : "Personalized monthly follow-up",
            },
        },
    }
}

interface ChannelManagementSectionProps {
    params: { locale: Locale }
}

export default function ChannelManagementSection({
    params: { locale },
}: ChannelManagementSectionProps) {
    const t = getTranslations(locale)

    /* c8 ignore start */
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
                            ? "ViraTrend - Consultoria Especializada"
                            : locale === "es"
                              ? "ViraTrend - Consultoría Especializada"
                              : locale === "de"
                                ? "ViraTrend - Spezialisierte Beratung"
                                : "ViraTrend - Specialized Consulting"}
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            ViraTrend
                        </span>
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

                {/* Results */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
                        {t.results.title}
                    </h3>
                    <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
                        {t.results.subtitle}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {t.results.cases.map((caseStudy, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg"
                            >
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    {caseStudy.channel}
                                </h4>
                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                                    {caseStudy.description}
                                </p>

                                <div className="grid grid-cols-3 gap-4">
                                    {caseStudy.metrics.map((metric, idx) => (
                                        <div key={idx} className="text-center">
                                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                                {metric.value}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                                {metric.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {t.cta.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                        {t.cta.description}
                    </p>
                    <Link
                        href={`/${locale}/channel-management`}
                        className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
                    >
                        <Users size={20} />
                        <span>{t.cta.button}</span>
                    </Link>
                </div>
            </div>
        </section>
    )
    /* c8 ignore stop */
}
