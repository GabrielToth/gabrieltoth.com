"use client"

import { type Locale } from "@/lib/i18n"
import { BarChart3, Eye, Play, TrendingUp, Users, Zap } from "lucide-react"

interface ChannelManagementSectionProps {
    locale: Locale
}

const getTranslations = (locale: Locale) => {
    const isPortuguese = locale === "pt-BR"
    return {
        title: isPortuguese ? "Gerenciamento de Canais" : "Channel Management",
        description: isPortuguese
            ? "Ajudo criadores de conteúdo a crescer e otimizar sua presença digital em múltiplas plataformas"
            : "I help content creators grow and optimize their digital presence across multiple platforms",
        subtitle: isPortuguese
            ? "Experiência em crescimento digital e gestão de múltiplas plataformas"
            : "Experience in digital growth and multi-platform management",
        stats: {
            title: isPortuguese ? "Resultados Alcançados" : "Achieved Results",
            items: [
                {
                    icon: Eye,
                    value: "2M+",
                    label: isPortuguese
                        ? "Visualizações Mensais"
                        : "Monthly Views",
                    description: isPortuguese
                        ? "Somando todas as plataformas"
                        : "Across all platforms",
                },
                {
                    icon: Users,
                    value: "100K+",
                    label: isPortuguese
                        ? "Seguidores Ativos"
                        : "Active Followers",
                    description: isPortuguese
                        ? "Base engajada de fãs"
                        : "Engaged fan base",
                },
                {
                    icon: TrendingUp,
                    value: "300%",
                    label: isPortuguese ? "Crescimento" : "Growth",
                    description: isPortuguese
                        ? "Aumento médio em 12 meses"
                        : "Average increase in 12 months",
                },
            ],
        },
        services: {
            title: isPortuguese ? "Serviços Oferecidos" : "Services Offered",
            items: [
                {
                    icon: BarChart3,
                    title: isPortuguese
                        ? "Análise e Estratégia"
                        : "Analytics & Strategy",
                    description: isPortuguese
                        ? "Análise detalhada de métricas e desenvolvimento de estratégias de crescimento personalizadas"
                        : "Detailed metrics analysis and development of customized growth strategies",
                },
                {
                    icon: Play,
                    title: isPortuguese
                        ? "Otimização de Conteúdo"
                        : "Content Optimization",
                    description: isPortuguese
                        ? "Otimização de títulos, thumbnails, descrições e tags para maximizar o alcance"
                        : "Optimization of titles, thumbnails, descriptions and tags to maximize reach",
                },
                {
                    icon: Zap,
                    title: isPortuguese
                        ? "Gestão Multi-Plataforma"
                        : "Multi-Platform Management",
                    description: isPortuguese
                        ? "Gerenciamento coordenado em YouTube, Twitch, TikTok, Instagram e outras plataformas"
                        : "Coordinated management across YouTube, Twitch, TikTok, Instagram and other platforms",
                },
            ],
        },
        platforms: {
            title: isPortuguese
                ? "Plataformas Gerenciadas"
                : "Managed Platforms",
            list: [
                "YouTube",
                "Twitch",
                "TikTok",
                "Instagram",
                "Facebook",
                "Kwai",
                "Discord",
                "Twitter",
                "Trovo",
                "DLive",
            ],
        },
        caseStudy: {
            title: isPortuguese ? "Caso de Sucesso" : "Success Case",
            client: "WaveIGL",
            description: isPortuguese
                ? "Gerenciamento completo de presença digital resultando em crescimento exponencial e engajamento consistente"
                : "Complete digital presence management resulting in exponential growth and consistent engagement",
            achievement: isPortuguese
                ? "Mais de 2 milhões de visualizações mensais somando todas as plataformas"
                : "Over 2 million monthly views across all platforms",
        },
        cta: isPortuguese
            ? "Interessado em gerenciamento de canal?"
            : "Interested in channel management?",
        ctaButton: isPortuguese ? "Vamos Conversar" : "Let's Talk",
    }
}

export default function ChannelManagementSection({
    locale,
}: ChannelManagementSectionProps) {
    const t = getTranslations(locale)

    const scrollToContact = () => {
        document
            .getElementById("contact")
            ?.scrollIntoView({ behavior: "smooth" })
    }

    return (
        <section
            id="channel-management"
            className="py-24 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {t.title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-2">
                        {t.description}
                    </p>
                    <p className="text-purple-600 dark:text-purple-400 font-medium">
                        {t.subtitle}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {t.stats.items.map(stat => (
                        <div key={stat.label} className="text-center">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                                <stat.icon className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
                                    {stat.label}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {stat.description}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Services */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-12">
                        {t.services.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {t.services.items.map(service => (
                            <div
                                key={service.title}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
                            >
                                <service.icon className="w-10 h-10 text-purple-600 dark:text-purple-400 mb-4" />
                                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                    {service.title}
                                </h4>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {service.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Case Study + Platforms */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Case Study */}
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 text-white">
                        <h3 className="text-2xl font-bold mb-4">
                            {t.caseStudy.title}
                        </h3>
                        <div className="text-purple-100 text-sm font-medium mb-2">
                            {t.caseStudy.client}
                        </div>
                        <p className="text-purple-50 mb-6 leading-relaxed">
                            {t.caseStudy.description}
                        </p>
                        <div className="bg-white/20 rounded-lg p-4">
                            <div className="text-lg font-semibold">
                                {t.caseStudy.achievement}
                            </div>
                        </div>
                    </div>

                    {/* Platforms */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            {t.platforms.title}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {t.platforms.list.map(platform => (
                                <div
                                    key={platform}
                                    className="bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    {platform}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center mt-16">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {t.cta}
                    </h3>
                    <button
                        onClick={scrollToContact}
                        className="bg-purple-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-purple-700 transition-colors"
                    >
                        {t.ctaButton}
                    </button>
                </div>
            </div>
        </section>
    )
}
