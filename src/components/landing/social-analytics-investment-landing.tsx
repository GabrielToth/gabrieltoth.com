import { type Locale } from "@/lib/i18n"
import {
    BarChart3,
    CheckCircle,
    DollarSign,
    Globe,
    LineChart,
    Rocket,
    Shield,
    Target,
    Users,
    Zap,
} from "lucide-react"

interface SocialAnalyticsInvestmentLandingProps {
    locale: Locale
}

const getTranslations = (locale: Locale) => {
    const isPortuguese = locale === "pt-BR"
    return {
        hero: {
            badge: isPortuguese
                ? "🚀 Oportunidade de Investimento"
                : "🚀 Investment Opportunity",
            title: isPortuguese
                ? "O Futuro do Marketing Digital Começa Aqui"
                : "The Future of Digital Marketing Starts Here",
            subtitle: isPortuguese
                ? "Invista na revolução dos dados de marketing. Nossa plataforma Social Analytics Engine está transformando como empresas analisam e otimizam suas campanhas digitais."
                : "Invest in the marketing data revolution. Our Social Analytics Engine platform is transforming how companies analyze and optimize their digital campaigns.",
            cta: isPortuguese ? "Investir Agora" : "Invest Now",
            stats: [
                {
                    number: "2M+",
                    label: isPortuguese
                        ? "Dados processados/mês"
                        : "Data points processed/month",
                },
                {
                    number: "15+",
                    label: isPortuguese
                        ? "Integrações de APIs"
                        : "API integrations",
                },
                {
                    number: "300%",
                    label: isPortuguese
                        ? "ROI médio dos clientes"
                        : "Average client ROI",
                },
            ],
        },
        problem: {
            title: isPortuguese
                ? "O Problema de Bilhões de Dólares"
                : "The Billion Dollar Problem",
            subtitle: isPortuguese
                ? "O marketing digital está quebrado e as empresas estão perdendo fortunas"
                : "Digital marketing is broken and companies are losing fortunes",
            items: [
                {
                    icon: BarChart3,
                    title: isPortuguese
                        ? "Dados Fragmentados"
                        : "Fragmented Data",
                    description: isPortuguese
                        ? "Empresas usam 10+ ferramentas diferentes sem visão unificada"
                        : "Companies use 10+ different tools without unified vision",
                    stat: "73%",
                    statLabel: isPortuguese
                        ? "dos marketers não conseguem conectar dados"
                        : "of marketers can't connect their data",
                },
                {
                    icon: DollarSign,
                    title: isPortuguese
                        ? "Orçamento Desperdiçado"
                        : "Wasted Budget",
                    description: isPortuguese
                        ? "Bilhões gastos em campanhas sem insights acionáveis"
                        : "Billions spent on campaigns without actionable insights",
                    stat: "40%",
                    statLabel: isPortuguese
                        ? "do orçamento de marketing é desperdiçado"
                        : "of marketing budget is wasted",
                },
                {
                    icon: Target,
                    title: isPortuguese ? "Decisões Cegas" : "Blind Decisions",
                    description: isPortuguese
                        ? "Estratégias baseadas em suposições, não em dados reais"
                        : "Strategies based on assumptions, not real data",
                    stat: "68%",
                    statLabel: isPortuguese
                        ? "das decisões são baseadas em intuição"
                        : "of decisions are based on intuition",
                },
            ],
        },
        solution: {
            title: isPortuguese
                ? "Nossa Solução Revolucionária"
                : "Our Revolutionary Solution",
            subtitle: isPortuguese
                ? "A primeira plataforma que unifica TODOS os dados de marketing digital"
                : "The first platform that unifies ALL digital marketing data",
            features: [
                {
                    icon: Globe,
                    title: isPortuguese
                        ? "Integração Total"
                        : "Complete Integration",
                    description: isPortuguese
                        ? "Google Analytics, redes sociais, Stripe, e 15+ plataformas em um dashboard único"
                        : "Google Analytics, social media, Stripe, and 15+ platforms in one dashboard",
                    tech: [
                        "Google Analytics API",
                        "YouTube API",
                        "Instagram API",
                        "Twitter API",
                        "Stripe API",
                        "Telegram API",
                    ],
                },
                {
                    icon: Zap,
                    title: isPortuguese
                        ? "AI-Powered Insights"
                        : "AI-Powered Insights",
                    description: isPortuguese
                        ? "Machine learning identifica padrões e oportunidades que humanos perdem"
                        : "Machine learning identifies patterns and opportunities humans miss",
                    tech: [
                        "Python ML Models",
                        "Real-time Processing",
                        "Predictive Analytics",
                        "Anomaly Detection",
                    ],
                },
                {
                    icon: LineChart,
                    title: isPortuguese
                        ? "ROI Tracking Completo"
                        : "Complete ROI Tracking",
                    description: isPortuguese
                        ? "Da primeira impressão até a conversão final - rastreamento completo do funil"
                        : "From first impression to final conversion - complete funnel tracking",
                    tech: [
                        "Cross-platform Attribution",
                        "Customer Journey Mapping",
                        "Revenue Attribution",
                        "LTV Analysis",
                    ],
                },
            ],
        },
        market: {
            title: isPortuguese
                ? "Mercado de Trilhões de Dólares"
                : "Trillion Dollar Market",
            subtitle: isPortuguese
                ? "Estamos posicionados no centro da maior oportunidade digital da história"
                : "We're positioned at the center of the biggest digital opportunity in history",
            stats: [
                {
                    value: "$786B",
                    label: isPortuguese
                        ? "Mercado global de marketing digital em 2024"
                        : "Global digital marketing market in 2024",
                },
                {
                    value: "$1.2T",
                    label: isPortuguese
                        ? "Projeção para 2030 (CAGR 15.1%)"
                        : "Projected for 2030 (CAGR 15.1%)",
                },
                {
                    value: "$47B",
                    label: isPortuguese
                        ? "Mercado de analytics especificamente"
                        : "Analytics market specifically",
                },
                {
                    value: "2.1M",
                    label: isPortuguese
                        ? "Empresas que precisam desta solução"
                        : "Companies that need this solution",
                },
            ],
        },
        competitive: {
            title: isPortuguese
                ? "Nossa Vantagem Competitiva"
                : "Our Competitive Advantage",
            subtitle: isPortuguese
                ? "Por que vamos dominar este mercado"
                : "Why we will dominate this market",
            advantages: [
                {
                    icon: Shield,
                    title: isPortuguese
                        ? "Primeira Plataforma Completa"
                        : "First Complete Platform",
                    description: isPortuguese
                        ? "Ninguém mais integra TODAS as plataformas de marketing em tempo real"
                        : "Nobody else integrates ALL marketing platforms in real-time",
                },
                {
                    icon: Zap,
                    title: isPortuguese
                        ? "Tecnologia Proprietária"
                        : "Proprietary Technology",
                    description: isPortuguese
                        ? "5 anos de R&D criaram algoritmos únicos de atribuição cross-platform"
                        : "5 years of R&D created unique cross-platform attribution algorithms",
                },
                {
                    icon: Users,
                    title: isPortuguese
                        ? "Equipe Experiente"
                        : "Experienced Team",
                    description: isPortuguese
                        ? "Fundador com 2M+ visualizações/mês e experiência comprovada em analytics"
                        : "Founder with 2M+ views/month and proven analytics experience",
                },
                {
                    icon: Rocket,
                    title: isPortuguese ? "Go-to-Market" : "Go-to-Market",
                    description: isPortuguese
                        ? "Já temos validação de mercado e primeiros clientes pagantes"
                        : "We already have market validation and first paying customers",
                },
            ],
        },

        investment: {
            title: isPortuguese
                ? "Oportunidade de Investimento"
                : "Investment Opportunity",
            subtitle: isPortuguese
                ? "Buscamos investidores visionários para acelerar nosso crescimento"
                : "We seek visionary investors to accelerate our growth",
            rounds: [
                {
                    stage: isPortuguese ? "Seed" : "Seed",
                    amount: "$500K",
                    equity: "15%",
                    valuation: "$3.3M",
                    use: isPortuguese
                        ? "Desenvolvimento de produto e primeiros clientes"
                        : "Product development and first customers",
                    timeline: "Q2 2025",
                    status: isPortuguese ? "Aberto" : "Open",
                },
                {
                    stage: "Series A",
                    amount: "$3M",
                    equity: "20%",
                    valuation: "$15M",
                    use: isPortuguese
                        ? "Expansão de mercado e scaling da equipe"
                        : "Market expansion and team scaling",
                    timeline: "Q4 2025",
                    status: isPortuguese ? "Planejado" : "Planned",
                },
            ],
            useOfFunds: [
                {
                    category: isPortuguese
                        ? "Desenvolvimento de Produto"
                        : "Product Development",
                    percentage: 40,
                    amount: "$200K",
                },
                {
                    category: isPortuguese
                        ? "Marketing e Vendas"
                        : "Marketing & Sales",
                    percentage: 30,
                    amount: "$150K",
                },
                {
                    category: isPortuguese ? "Equipe" : "Team",
                    percentage: 20,
                    amount: "$100K",
                },
                {
                    category: isPortuguese
                        ? "Infraestrutura"
                        : "Infrastructure",
                    percentage: 10,
                    amount: "$50K",
                },
            ],
        },
        team: {
            title: isPortuguese ? "Equipe Fundadora" : "Founding Team",
            subtitle: isPortuguese
                ? "Liderança experiente com histórico comprovado"
                : "Experienced leadership with proven track record",
            members: [
                {
                    name: "Gabriel Toth Gonçalves",
                    role: isPortuguese ? "CEO & Fundador" : "CEO & Founder",
                    bio: isPortuguese
                        ? "Data Scientist com 5+ anos de experiência. Gerencia canal com 2M+ visualizações/mês. Especialista em Python, PostgreSQL e APIs de marketing."
                        : "Data Scientist with 5+ years experience. Manages channel with 2M+ views/month. Expert in Python, PostgreSQL and marketing APIs.",
                    achievements: [
                        isPortuguese
                            ? "2M+ visualizações mensais"
                            : "2M+ monthly views",
                        isPortuguese
                            ? "5+ anos em Data Science"
                            : "5+ years in Data Science",
                        isPortuguese
                            ? "15+ integrações de APIs"
                            : "15+ API integrations",
                    ],
                },
            ],
        },
        cta: {
            title: isPortuguese
                ? "Seja Parte da Revolução"
                : "Be Part of the Revolution",
            subtitle: isPortuguese
                ? "Esta é sua chance de investir no futuro do marketing digital"
                : "This is your chance to invest in the future of digital marketing",
            button: isPortuguese
                ? "Agendar Reunião de Investimento"
                : "Schedule Investment Meeting",
            contact: isPortuguese
                ? "gabriel@gabrieltoth.com | +55 (xx) xxxx-xxxx"
                : "gabriel@gabrieltoth.com | +55 (xx) xxxx-xxxx",
        },
    }
}

export default function SocialAnalyticsInvestmentLanding({
    locale,
}: SocialAnalyticsInvestmentLandingProps) {
    const t = getTranslations(locale)

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Hero Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
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
                        href="#investment"
                        className="inline-flex items-center px-10 py-4 bg-yellow-400 text-yellow-900 rounded-lg font-bold hover:bg-yellow-300 transition-colors text-lg"
                    >
                        <Rocket className="mr-3" size={20} />
                        {t.hero.cta}
                    </a>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                        {t.hero.stats.map((stat, index) => (
                            <div
                                key={index}
                                className="text-center bg-white/10 backdrop-blur rounded-lg p-6"
                            >
                                <div className="text-4xl font-black text-yellow-400 mb-2">
                                    {stat.number}
                                </div>
                                <div className="text-white/80">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Problem Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-red-50 dark:bg-red-900/20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {t.problem.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.problem.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {t.problem.items.map((item, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-red-200 dark:border-red-800"
                            >
                                <item.icon className="w-12 h-12 text-red-600 mb-6" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                    {item.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    {item.description}
                                </p>
                                <div className="border-t border-red-200 dark:border-red-800 pt-4">
                                    <div className="text-3xl font-black text-red-600 mb-1">
                                        {item.stat}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {item.statLabel}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Solution Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {t.solution.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.solution.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {t.solution.features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-8"
                            >
                                <feature.icon className="w-12 h-12 text-blue-600 mb-6" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    {feature.description}
                                </p>
                                <div className="space-y-2">
                                    {feature.tech.map((tech, idx) => (
                                        <div
                                            key={idx}
                                            className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-medium mr-2 mb-2"
                                        >
                                            {tech}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Market Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-green-50 dark:bg-green-900/20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {t.market.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.market.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {t.market.stats.map((stat, index) => (
                            <div
                                key={index}
                                className="text-center bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg"
                            >
                                <div className="text-4xl font-black text-green-600 mb-4">
                                    {stat.value}
                                </div>
                                <div className="text-gray-600 dark:text-gray-300">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Competitive Advantage */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {t.competitive.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.competitive.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {t.competitive.advantages.map((advantage, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border border-purple-200 dark:border-purple-800"
                            >
                                <advantage.icon className="w-12 h-12 text-purple-600 mb-6" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                    {advantage.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {advantage.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Investment Section */}
            <section id="investment" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {t.investment.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.investment.subtitle}
                        </p>
                    </div>

                    {/* Investment Rounds */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                        {t.investment.rounds.map((round, index) => (
                            <div
                                key={index}
                                className={`bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border-2 ${
                                    round.status === "Aberto" ||
                                    round.status === "Open"
                                        ? "border-green-500"
                                        : "border-gray-300 dark:border-gray-600"
                                }`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {round.stage}
                                    </h3>
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                                            round.status === "Aberto" ||
                                            round.status === "Open"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                        }`}
                                    >
                                        {round.status}
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-300">
                                            {locale === "pt-BR"
                                                ? "Valor"
                                                : "Amount"}
                                            :
                                        </span>
                                        <span className="font-bold text-green-600">
                                            {round.amount}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-300">
                                            Equity:
                                        </span>
                                        <span className="font-bold">
                                            {round.equity}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-300">
                                            {locale === "pt-BR"
                                                ? "Valuation"
                                                : "Valuation"}
                                            :
                                        </span>
                                        <span className="font-bold text-blue-600">
                                            {round.valuation}
                                        </span>
                                    </div>
                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                                            <strong>
                                                {locale === "pt-BR"
                                                    ? "Uso:"
                                                    : "Use:"}
                                            </strong>{" "}
                                            {round.use}
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
                                            <strong>Timeline:</strong>{" "}
                                            {round.timeline}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Use of Funds */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                            {locale === "pt-BR"
                                ? "Uso dos Recursos (Seed Round)"
                                : "Use of Funds (Seed Round)"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {t.investment.useOfFunds.map((item, index) => (
                                <div key={index} className="text-center">
                                    <div
                                        className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg"
                                        style={{
                                            background: `conic-gradient(#3B82F6 0% ${item.percentage}%, #E5E7EB ${item.percentage}% 100%)`,
                                        }}
                                    >
                                        {item.percentage}%
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                                        {item.category}
                                    </h4>
                                    <p className="text-blue-600 font-bold">
                                        {item.amount}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {t.team.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.team.subtitle}
                        </p>
                    </div>
                    <div className="max-w-2xl mx-auto">
                        {t.team.members.map((member, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-lg"
                            >
                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        {member.name}
                                    </h3>
                                    <p className="text-blue-600 font-semibold">
                                        {member.role}
                                    </p>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                                    {member.bio}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {member.achievements.map(
                                        (achievement, idx) => (
                                            <div
                                                key={idx}
                                                className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
                                            >
                                                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                    {achievement}
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-black mb-6">{t.cta.title}</h2>
                    <p className="text-xl mb-8 opacity-90">{t.cta.subtitle}</p>
                    <a
                        href="mailto:gabriel@gabrieltoth.com"
                        className="inline-flex items-center px-10 py-4 bg-white text-purple-600 rounded-lg font-bold hover:bg-gray-100 transition-colors text-lg mb-6"
                    >
                        <Rocket className="mr-3" size={20} />
                        {t.cta.button}
                    </a>
                    <div className="text-white/80">{t.cta.contact}</div>
                </div>
            </section>
        </div>
    )
}
