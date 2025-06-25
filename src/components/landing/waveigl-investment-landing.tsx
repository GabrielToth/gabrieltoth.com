import { type Locale } from "@/lib/i18n"
import {
    CheckCircle,
    DollarSign,
    Globe,
    Heart,
    Monitor,
    Star,
    Users,
    Zap,
} from "lucide-react"

interface WaveIGLInvestmentLandingProps {
    locale: Locale
}

const getTranslations = (locale: Locale) => {
    const isPortuguese = locale === "pt-BR"
    return {
        hero: {
            badge: isPortuguese
                ? "🎯 Projeto Pessoal - Não Proprietário"
                : "🎯 Personal Project - Non-Proprietary",
            title: isPortuguese
                ? "WaveIGL - Projeto Aberto para Doações"
                : "WaveIGL - Open Project for Donations",
            subtitle: isPortuguese
                ? "Apoie o desenvolvimento de ferramentas abertas para streamers. Um projeto pessoal focado na comunidade, sem fins comerciais e com funcionalidades não proprietárias."
                : "Support the development of open tools for streamers. A personal project focused on the community, non-commercial with non-proprietary features.",
            cta: isPortuguese ? "Apoiar Projeto" : "Support Project",
            stats: [
                {
                    number: "2M+",
                    label: isPortuguese
                        ? "Views mensais da comunidade"
                        : "Monthly community views",
                },
                {
                    number: "100%",
                    label: isPortuguese
                        ? "Ferramentas não proprietárias"
                        : "Non-proprietary tools",
                },
                {
                    number: "0%",
                    label: isPortuguese
                        ? "Fins comerciais"
                        : "Commercial purposes",
                },
            ],
        },
        mission: {
            title: isPortuguese
                ? "Nossa Missão - Projeto Pessoal Aberto"
                : "Our Mission - Open Personal Project",
            subtitle: isPortuguese
                ? "Desenvolvimento de ferramentas gratuitas e abertas para a comunidade de streaming"
                : "Development of free and open tools for the streaming community",
            features: [
                {
                    icon: Globe,
                    title: isPortuguese
                        ? "Totalmente Não Proprietário"
                        : "Completely Non-Proprietary",
                    description: isPortuguese
                        ? "Todas as funcionalidades principais são abertas e gratuitas para a comunidade"
                        : "All main features are open and free for the community",
                },
                {
                    icon: Heart,
                    title: isPortuguese
                        ? "Projeto Pessoal"
                        : "Personal Project",
                    description: isPortuguese
                        ? "Desenvolvido como projeto pessoal, sem objetivos comerciais ou de lucro"
                        : "Developed as a personal project, with no commercial or profit objectives",
                },
                {
                    icon: Users,
                    title: isPortuguese
                        ? "Foco na Comunidade"
                        : "Community Focused",
                    description: isPortuguese
                        ? "Ferramentas pensadas para beneficiar streamers e sua audiência"
                        : "Tools designed to benefit streamers and their audience",
                },
            ],
        },
        features: {
            title: isPortuguese
                ? "Ferramentas em Desenvolvimento"
                : "Tools in Development",
            subtitle: isPortuguese
                ? "Funcionalidades que suas doações ajudam a desenvolver"
                : "Features that your donations help develop",
            list: [
                {
                    icon: Globe,
                    title: isPortuguese
                        ? "Login via Google (Não Proprietário)"
                        : "Google Login (Non-Proprietary)",
                    description: isPortuguese
                        ? "Sistema de login integrado com Google, Twitch, Discord e YouTube"
                        : "Login system integrated with Google, Twitch, Discord and YouTube",
                    status: isPortuguese ? "Planejado" : "Planned",
                },
                {
                    icon: Users,
                    title: isPortuguese
                        ? "Página de Funil para SUBs (Não Proprietário)"
                        : "SUBs Funnel Page (Non-Proprietary)",
                    description: isPortuguese
                        ? "Acesso automático a grupos do WhatsApp e vinculação com Discord"
                        : "Automatic access to WhatsApp groups and Discord linking",
                    status: isPortuguese
                        ? "Em desenvolvimento"
                        : "In development",
                },
                {
                    icon: Monitor,
                    title: isPortuguese
                        ? "Unificação de Chats (Não Proprietário)"
                        : "Chat Unification (Non-Proprietary)",
                    description: isPortuguese
                        ? "Integração dos chats do YouTube e Twitch em uma interface única"
                        : "Integration of YouTube and Twitch chats in a single interface",
                    status: isPortuguese ? "Planejado" : "Planned",
                },
                {
                    icon: Zap,
                    title: isPortuguese
                        ? "Ferramentas de Moderação (Não Proprietário)"
                        : "Moderation Tools (Non-Proprietary)",
                    description: isPortuguese
                        ? "Facilitar moderação para toda a equipe em ambos os chats"
                        : "Facilitate moderation for the entire team in both chats",
                    status: isPortuguese ? "Planejado" : "Planned",
                },
                {
                    icon: DollarSign,
                    title: isPortuguese
                        ? "Landing Page para Aulas (Proprietário)"
                        : "Classes Landing Page (Proprietary)",
                    description: isPortuguese
                        ? "Única funcionalidade proprietária: página para aulas particulares"
                        : "Only proprietary feature: page for private classes",
                    status: isPortuguese ? "Planejado" : "Planned",
                },
            ],
        },
        investment: {
            title: isPortuguese
                ? "Como Apoiar o Projeto"
                : "How to Support the Project",
            subtitle: isPortuguese
                ? "Suas doações ajudam a desenvolver ferramentas abertas para toda a comunidade"
                : "Your donations help develop open tools for the entire community",
            total: {
                amount: "R$ 25.000",
                title: isPortuguese
                    ? "Meta Total do Projeto"
                    : "Total Project Goal",
                description: isPortuguese
                    ? "Valor necessário para desenvolver todas as funcionalidades planejadas"
                    : "Amount needed to develop all planned features",
            },
            benefits: [
                {
                    title: isPortuguese
                        ? "🌟 Acesso Antecipado"
                        : "🌟 Early Access",
                    description: isPortuguese
                        ? "Beta tester das novas funcionalidades"
                        : "Beta testing of new features",
                },
                {
                    title: isPortuguese
                        ? "🎯 Influência no Roadmap"
                        : "🎯 Roadmap Influence",
                    description: isPortuguese
                        ? "Voz ativa nas próximas funcionalidades"
                        : "Active voice in next features",
                },
                {
                    title: isPortuguese
                        ? "💫 Reconhecimento"
                        : "💫 Recognition",
                    description: isPortuguese
                        ? "Créditos especiais como apoiador do projeto"
                        : "Special credits as project supporter",
                },
            ],
            transparency: {
                title: isPortuguese
                    ? "Transparência Total"
                    : "Total Transparency",
                items: [
                    isPortuguese
                        ? "Relatórios mensais de desenvolvimento"
                        : "Monthly development reports",
                    isPortuguese
                        ? "Código aberto das funcionalidades não proprietárias"
                        : "Open source non-proprietary features",
                    isPortuguese
                        ? "Uso transparente das doações"
                        : "Transparent use of donations",
                ],
            },
        },
        contact: {
            title: isPortuguese
                ? "Fale Conosco sobre o Projeto"
                : "Contact Us about the Project",
            subtitle: isPortuguese
                ? "Dúvidas sobre o projeto? Quer saber mais detalhes?"
                : "Questions about the project? Want to know more details?",
            whatsapp: isPortuguese ? "Falar no WhatsApp" : "Talk on WhatsApp",
        },
    }
}

export default function WaveIGLInvestmentLanding({
    locale,
}: WaveIGLInvestmentLandingProps) {
    const t = getTranslations(locale)

    const generateWhatsAppMessage = () => {
        const baseMessage =
            locale === "pt-BR"
                ? "Olá! Tenho interesse em apoiar o projeto WaveIGL. Gostaria de saber mais detalhes sobre:"
                : "Hello! I'm interested in supporting the WaveIGL project. I'd like to know more details about:"

        return `https://wa.me/5511993313606?text=${encodeURIComponent(baseMessage)}`
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Hero Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-400 text-yellow-900 text-sm font-bold mb-8">
                        {t.hero.badge}
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-black mb-6">
                        {t.hero.title}
                    </h1>
                    <p className="text-xl mb-8 max-w-4xl mx-auto opacity-90">
                        {t.hero.subtitle}
                    </p>
                    <a
                        href={generateWhatsAppMessage()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-10 py-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors text-lg"
                    >
                        <Heart className="mr-3" size={20} />
                        {t.hero.cta}
                    </a>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                        {t.hero.stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl font-black text-yellow-400 mb-2">
                                    {stat.number}
                                </div>
                                <div className="text-sm opacity-90">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                        {t.mission.title}
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-16">
                        {t.mission.subtitle}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {t.mission.features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8"
                            >
                                <feature.icon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {t.features.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.features.subtitle}
                        </p>
                    </div>

                    <div className="space-y-8">
                        {t.features.list.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-lg"
                            >
                                <div className="flex items-start space-x-6">
                                    <feature.icon className="w-12 h-12 text-purple-600 mt-1" />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                {feature.title}
                                            </h3>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    feature.status ===
                                                        "Em desenvolvimento" ||
                                                    feature.status ===
                                                        "In development"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                                                {feature.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Investment Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {t.investment.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.investment.subtitle}
                        </p>
                    </div>

                    {/* Total Goal */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white mb-12 text-center">
                        <h3 className="text-3xl font-bold mb-2">
                            {t.investment.total.title}
                        </h3>
                        <div className="text-5xl font-black mb-2">
                            {t.investment.total.amount}
                        </div>
                        <p className="text-lg opacity-90">
                            {t.investment.total.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Benefits */}
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                {locale === "pt-BR"
                                    ? "Benefícios para Apoiadores"
                                    : "Supporter Benefits"}
                            </h3>
                            <div className="space-y-4">
                                {t.investment.benefits.map((benefit, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                    >
                                        <CheckCircle className="w-6 h-6 text-green-500 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white">
                                                {benefit.title}
                                            </h4>
                                            <p className="text-gray-600 dark:text-gray-300">
                                                {benefit.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Transparency */}
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                {t.investment.transparency.title}
                            </h3>
                            <div className="space-y-3">
                                {t.investment.transparency.items.map(
                                    (item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center space-x-3"
                                        >
                                            <Star className="w-5 h-5 text-yellow-500" />
                                            <span className="text-gray-600 dark:text-gray-300">
                                                {item}
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                        {t.contact.title}
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                        {t.contact.subtitle}
                    </p>
                    <a
                        href={generateWhatsAppMessage()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-8 py-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
                    >
                        <svg
                            className="w-6 h-6 mr-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                        </svg>
                        {t.contact.whatsapp}
                    </a>
                </div>
            </section>
        </div>
    )
}
