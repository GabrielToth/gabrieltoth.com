"use client"

import Footer from "@/components/layout/footer"
import LanguageSelector from "@/components/ui/language-selector"
import PricingToggle from "@/components/ui/pricing-toggle"
import { useMoneroPricing } from "@/hooks/use-monero-pricing"
import { type Locale } from "@/lib/i18n"
import {
    BarChart3,
    CheckCircle,
    DollarSign,
    Edit3,
    MessageCircle,
    Percent,
    Star,
    Target,
    TrendingUp,
    Video,
    Youtube,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface ChannelManagementLandingProps {
    locale: Locale
}

const getTranslations = (locale: Locale) => {
    const isPortuguese = locale === "pt-BR"
    return {
        moneroToggle: {
            title: isPortuguese
                ? "Preços com Monero (XMR)"
                : "Monero (XMR) Pricing",
            description: isPortuguese
                ? "Ative para ver preços com 50% de desconto usando Monero"
                : "Enable to see 50% discount prices using Monero",
            enabled: isPortuguese
                ? "💰 Preços com Monero (50% OFF)"
                : "💰 Monero Prices (50% OFF)",
            disabled: isPortuguese
                ? "💴 Preços Regulares (PIX/Card)"
                : "💴 Regular Prices (PIX/Card)",
        },
        hero: {
            badge: isPortuguese
                ? "🚀 ViraTrend - Consultoria Especializada"
                : "🚀 ViraTrend - Specialized Consulting",
            title: isPortuguese
                ? "Transforme Seu Canal em uma Máquina de Crescimento"
                : "Transform Your Channel into a Growth Machine",
            subtitle: isPortuguese
                ? "Especializado em analytics, otimização de conteúdo e estratégias de monetização para múltiplas plataformas. + de 2M de visualizações mensais somadas entre YouTube, Instagram, TikTok, Twitch e outras redes sociais."
                : "Specialized in analytics, content optimization and monetization strategies for multiple platforms. + 2M monthly views combined across YouTube, Instagram, TikTok, Twitch and other social networks.",
            cta: isPortuguese ? "Solicitar Consultoria" : "Request Consulting",
            stats: [
                {
                    number: "2M+",
                    label: isPortuguese
                        ? "Views mensais somadas (todas as plataformas)"
                        : "Monthly views combined (all platforms)",
                },
                {
                    number: "1M+",
                    label: isPortuguese
                        ? "Views com menos de 1K subs (recorde)"
                        : "Views with under 1K subs (record)",
                },
                {
                    number: "10+",
                    label: isPortuguese
                        ? "Anos de experiência (desde 2013)"
                        : "Years of experience (since 2013)",
                },
            ],
        },
        about: {
            title: isPortuguese ? "Sobre Mim" : "About Me",
            description: isPortuguese
                ? "Cientista de Dados & Desenvolvedor Full Stack focado em crescimento digital"
                : "Data Scientist & Full Stack Developer focused on digital growth",
            intro: isPortuguese
                ? "Sou Gabriel Toth Gonçalves, cientista de dados pleno e desenvolvedor Full Stack brasileiro. Formado em Ciência da Computação com especialização em Ciência de Dados, atualmente trabalho no projeto social-analytics-engine, realizando análises avançadas de campanhas digitais e métricas de conversão."
                : "I'm Gabriel Toth Gonçalves, a senior data scientist and Full Stack developer from Brazil. With a Computer Science degree and specialization in Data Science, I currently work on the social-analytics-engine project, performing advanced digital campaign analysis and conversion metrics.",
            experience: isPortuguese
                ? "Meu trabalho envolve a integração de dados do Google Analytics com métricas de redes sociais (YouTube, Instagram, X, Telegram) e análise de conversões Stripe usando Python, PostgreSQL, SQLAlchemy e Docker. Também desenvolvo soluções web empresariais, tendo criado sites como softclever.com.br (React) e sistemasatfiscal.com.br (Angular)."
                : "My work involves integrating Google Analytics data with social media metrics (YouTube, Instagram, X, Telegram) and Stripe conversion analysis using Python, PostgreSQL, SQLAlchemy, and Docker. I also develop enterprise web solutions, having created sites like softclever.com.br (React) and sistemasatfiscal.com.br (Angular).",
            passion: isPortuguese
                ? "Além da análise de dados, gerencio múltiplas redes sociais incluindo o projeto WaveIGL (YouTube, Instagram, TikTok, Twitch) com mais de 2 milhões de visualizações mensais somadas. Tenho um case impressionante: alcancei mais de 1 milhão de views em um canal antes mesmo de ter 1000 inscritos. Gerencio canais desde 2013 e uso machine learning para otimizar campanhas em múltiplas plataformas."
                : "Beyond data analysis, I manage multiple social networks including the WaveIGL project (YouTube, Instagram, TikTok, Twitch) with over 2 million monthly views combined. I have an impressive case: I reached over 1 million views on a channel that still had less than 1000 subscribers. I've been managing channels since 2013 and use machine learning to optimize campaigns across multiple platforms.",
            skills: [
                { icon: BarChart3, name: "Analytics & Data Science" },
                { icon: Video, name: "Content Strategy" },
                { icon: DollarSign, name: "Monetization" },
                { icon: TrendingUp, name: "Growth Hacking" },
                { icon: Youtube, name: "YouTube Optimization" },
                { icon: Target, name: "Audience Development" },
            ],
        },
        problems: {
            title: isPortuguese
                ? "Seus Desafios de Crescimento"
                : "Your Growth Challenges",
            subtitle: isPortuguese
                ? "Reconhece alguns destes problemas?"
                : "Recognize any of these problems?",
            items: [
                {
                    icon: TrendingUp,
                    title: isPortuguese
                        ? "Crescimento Estagnado"
                        : "Stagnant Growth",
                    description: isPortuguese
                        ? "Seu canal parou de crescer e você não sabe o motivo"
                        : "Your channel stopped growing and you don't know why",
                },
                {
                    icon: BarChart3,
                    title: isPortuguese
                        ? "Analytics Confusos"
                        : "Confusing Analytics",
                    description: isPortuguese
                        ? "Muitos dados, mas nenhuma direção clara sobre o que fazer"
                        : "Lots of data, but no clear direction on what to do",
                },
                {
                    icon: DollarSign,
                    title: isPortuguese
                        ? "Monetização Baixa"
                        : "Low Monetization",
                    description: isPortuguese
                        ? "Revenue não condiz com o número de visualizações"
                        : "Revenue doesn't match the number of views",
                },
                {
                    icon: Target,
                    title: isPortuguese
                        ? "Conteúdo Sem Foco"
                        : "Unfocused Content",
                    description: isPortuguese
                        ? "Criando conteúdo sem uma estratégia clara de crescimento"
                        : "Creating content without a clear growth strategy",
                },
            ],
        },
        services: {
            title: isPortuguese
                ? "Como Posso Ajudar Seu Canal"
                : "How I Can Help Your Channel",
            subtitle: isPortuguese
                ? "Soluções personalizadas para cada fase do seu crescimento"
                : "Customized solutions for each stage of your growth",
            items: [
                {
                    icon: BarChart3,
                    title: isPortuguese
                        ? "Análise Multi-Plataforma Completa"
                        : "Complete Multi-Platform Analysis",
                    description: isPortuguese
                        ? "Auditoria profunda dos seus analytics em YouTube, Instagram, TikTok, Twitch e outras plataformas com insights acionáveis para otimização imediata."
                        : "Deep audit of your analytics across YouTube, Instagram, TikTok, Twitch and other platforms with actionable insights for immediate optimization.",
                    features: [
                        isPortuguese
                            ? "Análise cross-platform de métricas"
                            : "Cross-platform metrics analysis",
                        isPortuguese
                            ? "Identificação de gargalos por rede social"
                            : "Social network bottleneck identification",
                        isPortuguese
                            ? "Relatório consolidado personalizado"
                            : "Custom consolidated report",
                    ],
                },
                {
                    icon: Target,
                    title: isPortuguese
                        ? "Estratégia de Conteúdo Multi-Plataforma"
                        : "Multi-Platform Content Strategy",
                    description: isPortuguese
                        ? "Desenvolvimento de estratégia de conteúdo baseada em dados para maximizar alcance e engajamento em YouTube, Instagram, TikTok, Twitch e outras redes sociais."
                        : "Data-driven content strategy development to maximize reach and engagement across YouTube, Instagram, TikTok, Twitch and other social networks.",
                    features: [
                        isPortuguese
                            ? "Calendário editorial sincronizado"
                            : "Synchronized editorial calendar",
                        isPortuguese
                            ? "Otimização específica por plataforma"
                            : "Platform-specific optimization",
                        isPortuguese
                            ? "Análise de tendências cross-platform"
                            : "Cross-platform trend analysis",
                    ],
                },
                {
                    icon: DollarSign,
                    title: isPortuguese
                        ? "Monetização Diversificada"
                        : "Diversified Monetization",
                    description: isPortuguese
                        ? "Estratégias para maximizar revenue através de múltiplos canais de monetização em todas as plataformas onde você atua."
                        : "Strategies to maximize revenue through multiple monetization channels across all platforms where you operate.",
                    features: [
                        isPortuguese
                            ? "Monetização YouTube + Creator Funds"
                            : "YouTube monetization + Creator Funds",
                        isPortuguese
                            ? "Estratégias de patrocínio multi-plataforma"
                            : "Multi-platform sponsorship strategies",
                        isPortuguese
                            ? "Produtos digitais e affiliate marketing"
                            : "Digital products and affiliate marketing",
                    ],
                },
            ],
        },
        results: {
            title: isPortuguese ? "Resultados Comprovados" : "Proven Results",
            subtitle: isPortuguese
                ? "Cases reais de crescimento"
                : "Real growth cases",
            items: [
                {
                    channel: "WaveIGL Multi-Platform",
                    description: isPortuguese
                        ? "Projeto completo multi-plataforma gerenciado por mim"
                        : "Complete multi-platform project managed by me",
                    metrics: [
                        {
                            label: isPortuguese
                                ? "Views mensais somadas"
                                : "Combined monthly views",
                            value: "2M+",
                        },
                        {
                            label: isPortuguese
                                ? "YouTube (400K) + outras plataformas"
                                : "YouTube (400K) + other platforms",
                            value: "1.6M",
                        },
                        {
                            label: isPortuguese
                                ? "Plataformas ativas"
                                : "Active platforms",
                            value: "5+",
                        },
                    ],
                },
                {
                    channel: isPortuguese
                        ? "Case Histórico"
                        : "Historical Case",
                    description: isPortuguese
                        ? "Recorde pessoal - canal que gerenciei"
                        : "Personal record - channel I managed",
                    metrics: [
                        {
                            label: isPortuguese
                                ? "Views totais"
                                : "Total views",
                            value: "1M+",
                        },
                        {
                            label: isPortuguese
                                ? "Inscritos na época"
                                : "Subscribers at the time",
                            value: "<1K",
                        },
                        {
                            label: isPortuguese
                                ? "Performance viral"
                                : "Viral performance",
                            value: "Epic",
                        },
                    ],
                },
            ],
        },
        testimonials: {
            title: isPortuguese
                ? "Minha Experiência e Resultados"
                : "My Experience and Results",
            subtitle: isPortuguese
                ? "Cases reais e conquistas ao longo de 10+ anos de experiência"
                : "Real cases and achievements over 10+ years of experience",
            items: [
                {
                    name: "WaveIGL Multi-Platform",
                    role: isPortuguese
                        ? "Projeto próprio - Crescimento multi-plataforma"
                        : "Own project - Multi-platform growth",
                    content: isPortuguese
                        ? "Desenvolvi e gerencio todas as redes sociais do WaveIGL desde o início. Atualmente somamos 2M+ views mensais distribuídos entre YouTube (400K), Instagram, TikTok, Twitch e outras plataformas. O projeto cresce consistentemente há anos."
                        : "I developed and manage all WaveIGL social networks from the beginning. We currently total 2M+ monthly views distributed across YouTube (400K), Instagram, TikTok, Twitch and other platforms. The project has been growing consistently for years.",
                    rating: 5,
                },
                {
                    name: isPortuguese
                        ? "Case Histórico Viral"
                        : "Historical Viral Case",
                    role: isPortuguese
                        ? "Conquista pessoal - Resultado extraordinário"
                        : "Personal achievement - Extraordinary result",
                    content: isPortuguese
                        ? "Um dos meus casos mais impressionantes: consegui mais de 1 milhão de visualizações em um canal que ainda tinha menos de 1000 inscritos. Isso demonstra minha capacidade de criar conteúdo viral e entender profundamente os algoritmos das plataformas."
                        : "One of my most impressive cases: I achieved over 1 million views on a channel that still had less than 1000 subscribers. This demonstrates my ability to create viral content and deeply understand platform algorithms.",
                    rating: 5,
                },
            ],
        },
        pricing: {
            title: isPortuguese
                ? "Escolha Seu Plano de Consultoria"
                : "Choose Your Consulting Plan",
            subtitle: isPortuguese
                ? "Investimento que se paga em crescimento"
                : "Investment that pays for itself in growth",
            plans: [
                {
                    name: isPortuguese ? "Análise Express" : "Express Analysis",
                    basePrice: 497,
                    description: isPortuguese
                        ? "Auditoria completa com relatório detalhado"
                        : "Complete audit with detailed report",
                    features: [
                        isPortuguese
                            ? "Análise de 3 meses de dados"
                            : "3-month data analysis",
                        isPortuguese
                            ? "Relatório de 20+ páginas"
                            : "20+ page report",
                        isPortuguese
                            ? "Reunião de 1h para apresentação"
                            : "1h presentation meeting",
                        isPortuguese
                            ? "Lista de ações prioritárias"
                            : "Priority action list",
                        isPortuguese
                            ? "Edição inclusa: até 300 minutos/mês"
                            : "Editing included: up to 300 minutes/month",
                    ],
                    editingNote: isPortuguese
                        ? "Edição simples e dinâmica para redes sociais. Nós cuidamos de tudo para quem não tem experiência em edição. (10 minutos de conteúdo bruto por dia)"
                        : "Simple, dynamic editing for social media. We handle everything for those with no editing experience. (10 minutes of raw content per day)",
                    popular: false,
                },
                {
                    name: isPortuguese
                        ? "Consultoria Completa"
                        : "Complete Consulting",
                    basePrice: 1497,
                    description: isPortuguese
                        ? "Estratégia + implementação + acompanhamento"
                        : "Strategy + implementation + follow-up",
                    features: [
                        isPortuguese
                            ? "Tudo do plano Express"
                            : "Everything from Express plan",
                        isPortuguese
                            ? "Estratégia de 90 dias"
                            : "90-day strategy",
                        isPortuguese
                            ? "3 reuniões de acompanhamento"
                            : "3 follow-up meetings",
                        isPortuguese
                            ? "Template de calendário editorial"
                            : "Editorial calendar template",
                        isPortuguese
                            ? "Suporte via WhatsApp por 30 dias"
                            : "WhatsApp support for 30 days",
                        isPortuguese
                            ? "Edição inclusa: até 900 minutos/mês"
                            : "Editing included: up to 900 minutes/month",
                    ],
                    editingNote: isPortuguese
                        ? "Edição simples e dinâmica para redes sociais. Você só precisa criar o conteúdo, nós editamos para você. (30 minutos de conteúdo bruto por dia)"
                        : "Simple, dynamic editing for social media. You just create, we edit for you. (30 minutes of raw content per day)",
                    popular: true,
                },
                {
                    name: isPortuguese
                        ? "Mentoria Intensiva"
                        : "Intensive Mentoring",
                    basePrice: 2997,
                    description: isPortuguese
                        ? "Acompanhamento mensal personalizado"
                        : "Personalized monthly follow-up",
                    features: [
                        isPortuguese
                            ? "Tudo do plano Completo"
                            : "Everything from Complete plan",
                        isPortuguese
                            ? "Reuniões mensais (3 meses)"
                            : "Monthly meetings (3 months)",
                        isPortuguese
                            ? "Análise contínua de performance"
                            : "Continuous performance analysis",
                        isPortuguese
                            ? "Suporte prioritário"
                            : "Priority support",
                        isPortuguese
                            ? "Acesso a ferramentas exclusivas"
                            : "Access to exclusive tools",
                        isPortuguese
                            ? "Edição inclusa: até 1800 minutos/mês"
                            : "Editing included: up to 1800 minutes/month",
                    ],
                    editingNote: isPortuguese
                        ? "Edição simples e dinâmica para redes sociais. Foco total na criação, sem se preocupar com edição. (60 minutos de conteúdo bruto por dia)"
                        : "Simple, dynamic editing for social media. Full focus on creation, no editing worries. (60 minutes of raw content per day)",
                    popular: false,
                },
            ],
            note: isPortuguese
                ? "As edições são simples, focadas em dinamismo e formatos para redes sociais. Não realizamos edições profissionais avançadas no momento."
                : "Edits are simple, focused on dynamic and social media formats. We do not provide advanced professional editing at this time.",
        },
    }
}

export default function ChannelManagementLanding({
    locale,
}: ChannelManagementLandingProps) {
    const [mounted, setMounted] = useState(false)
    const t = getTranslations(locale)
    const { calculatePrice: calculateMoneroPrice } = useMoneroPricing()

    useEffect(() => {
        setMounted(true)
    }, [])

    // Updated price calculation with Monero support and currency conversion
    const calculatePrice = (basePrice: number) => {
        const moneroCalc = calculateMoneroPrice(basePrice, locale)
        return {
            current: moneroCalc.displayPrice,
            original: moneroCalc.originalPrice,
            currency: moneroCalc.currency,
            displayPrice: moneroCalc.displayPrice.toString(),
            originalPrice: moneroCalc.originalPrice?.toString(),
            isMonero: moneroCalc.isMonero,
        }
    }

    const generateWhatsAppMessage = (
        planName: string,
        price: number,
        isMonero: boolean
    ) => {
        const paymentMethod = isMonero
            ? "Monero (XMR)"
            : locale === "pt-BR"
              ? "PIX/Cartão"
              : "Card"
        const currency = locale === "en" ? "$" : "R$"
        const baseMessage =
            locale === "pt-BR"
                ? "Olá! Tenho interesse na consultoria de canal.%0A%0A" +
                  `📋 Plano escolhido: ${planName}%0A` +
                  `💰 Valor: ${currency} ${price}%0A` +
                  `💳 Forma de pagamento: ${paymentMethod}%0A%0A` +
                  "Nome:%0ACanal do YouTube:%0AQual seu principal objetivo:%0ATipo de conteúdo:%0AFrequência de postagem:%0A%0AAguardo o contato!"
                : "Hello! I'm interested in channel consulting.%0A%0A" +
                  `📋 Chosen plan: ${planName}%0A` +
                  `💰 Price: ${currency} ${price}%0A` +
                  `💳 Payment method: ${paymentMethod}%0A%0A` +
                  "Name:%0AYouTube Channel:%0AYour main goal:%0AContent type:%0APosting frequency:%0A%0ALooking forward to hearing from you!"

        return `https://wa.me/5511993313606?text=${baseMessage}`
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Language Selector for Landing Page */}
            <div className="fixed top-4 right-4 z-50">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
                    {mounted && <LanguageSelector variant="default" />}
                </div>
            </div>

            {/* Hero Section */}
            <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-block mb-6">
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-semibold px-4 py-2 rounded-full">
                            {t.hero.badge}
                        </span>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                        {t.hero.title}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                        {t.hero.subtitle}
                    </p>

                    <a
                        href={generateWhatsAppMessage(t.hero.cta, 0, false)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg"
                    >
                        <MessageCircle className="mr-2" size={20} />
                        {t.hero.cta}
                    </a>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                        {t.hero.stats.map((stat, index) => (
                            <div
                                key={index}
                                className="text-center bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
                            >
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                                    {stat.number}
                                </div>
                                <div className="text-gray-600 dark:text-gray-300">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                                {t.about.title}
                            </h2>
                            <p className="text-lg text-blue-600 dark:text-blue-400 mb-6 font-medium">
                                {t.about.description}
                            </p>
                            <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                                <p>{t.about.intro}</p>
                                <p>{t.about.experience}</p>
                                <p>{t.about.passion}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {t.about.skills.map((skill, index) => (
                                <div
                                    key={index}
                                    className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center"
                                >
                                    <skill.icon className="w-10 h-10 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {skill.name}
                                    </h3>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Problems Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            {t.problems.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.problems.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {t.problems.items.map((problem, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg text-center"
                            >
                                <problem.icon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                                    {problem.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    {problem.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            {t.services.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.services.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {t.services.items.map((service, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg"
                            >
                                <service.icon className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-6" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                    {service.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    {service.description}
                                </p>
                                <ul className="space-y-2">
                                    {service.features.map((feature, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-center text-gray-600 dark:text-gray-300"
                                        >
                                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                            <span className="text-sm">
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Results Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            {t.results.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.results.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {t.results.items.map((result, index) => (
                            <div
                                key={index}
                                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-8"
                            >
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {result.channel}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    {result.description}
                                </p>
                                <div className="grid grid-cols-3 gap-4">
                                    {result.metrics.map((metric, idx) => (
                                        <div key={idx} className="text-center">
                                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
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
            </section>

            {/* Testimonials Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            {t.testimonials.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.testimonials.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {t.testimonials.items.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-lg"
                            >
                                <div className="flex items-center mb-4">
                                    {[...Array(testimonial.rating)].map(
                                        (_, i) => (
                                            <Star
                                                key={i}
                                                className="w-5 h-5 text-yellow-400 fill-current"
                                            />
                                        )
                                    )}
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                                    {testimonial.content}
                                </p>
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {testimonial.name}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {testimonial.role}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section
                id="pricing"
                className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            {t.pricing.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.pricing.subtitle}
                        </p>
                    </div>
                    <PricingToggle locale={locale} />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {t.pricing.plans.map((plan, index) => {
                            const pricing = calculatePrice(plan.basePrice)
                            return (
                                <div
                                    key={index}
                                    className={`bg-white dark:bg-gray-900 rounded-lg p-8 shadow-lg relative ${
                                        plan.popular
                                            ? "border-2 border-blue-500 transform scale-105"
                                            : ""
                                    }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                                {locale === "pt-BR"
                                                    ? "Mais Popular"
                                                    : "Most Popular"}
                                            </span>
                                        </div>
                                    )}

                                    {/* Monero Discount Badge */}
                                    {pricing.isMonero && (
                                        <div className="absolute -top-2 -right-2">
                                            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                <Percent className="w-3 h-3" />
                                                50% OFF
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-center mb-8">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            {plan.name}
                                        </h3>
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                {pricing.currency}{" "}
                                                {pricing.displayPrice}
                                            </div>
                                            {pricing.originalPrice &&
                                                pricing.originalPrice !==
                                                    pricing.displayPrice && (
                                                    <span className="text-lg text-gray-500 line-through">
                                                        {pricing.currency}{" "}
                                                        {pricing.originalPrice}
                                                    </span>
                                                )}
                                        </div>
                                        {pricing.isMonero && (
                                            <div className="text-orange-400 text-sm font-medium">
                                                💰 Preço com Monero (XMR)
                                            </div>
                                        )}
                                        <p className="text-gray-600 dark:text-gray-300">
                                            {plan.description}
                                        </p>
                                    </div>
                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, idx) => {
                                            const isEditingFeature =
                                                feature.startsWith(
                                                    locale === "pt-BR"
                                                        ? "Edição inclusa:"
                                                        : "Editing included:"
                                                )
                                            return (
                                                <li
                                                    key={idx}
                                                    className="flex flex-col items-start text-gray-600 dark:text-gray-300"
                                                >
                                                    <span className="flex items-center">
                                                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                                        {feature}
                                                    </span>
                                                    {isEditingFeature &&
                                                        plan.editingNote && (
                                                            <span className="ml-8 text-xs italic text-gray-500 dark:text-gray-400 mt-1">
                                                                {
                                                                    plan.editingNote
                                                                }
                                                            </span>
                                                        )}
                                                </li>
                                            )
                                        })}
                                    </ul>
                                    <a
                                        href={generateWhatsAppMessage(
                                            plan.name,
                                            pricing.current,
                                            pricing.isMonero
                                        )}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center block"
                                    >
                                        {locale === "pt-BR"
                                            ? "Contratar Agora"
                                            : "Get Started"}
                                    </a>
                                </div>
                            )
                        })}
                    </div>
                    {/* Observação sobre edição */}
                    <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        {t.pricing.note}
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4">
                        {locale === "pt-BR"
                            ? "Pronto Para Acelerar Seu Crescimento?"
                            : "Ready to Accelerate Your Growth?"}
                    </h2>
                    <p className="text-xl mb-8 opacity-90">
                        {locale === "pt-BR"
                            ? "Entre em contato via WhatsApp para alinharmos as expectativas"
                            : "Contact us via WhatsApp to align expectations"}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href={generateWhatsAppMessage(t.hero.cta, 0, false)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
                        >
                            <MessageCircle className="mr-2" size={20} />
                            {locale === "pt-BR"
                                ? "Falar no WhatsApp"
                                : "Message on WhatsApp"}
                        </a>
                        <Link
                            href="/editors"
                            className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors text-lg"
                        >
                            <Edit3 className="mr-2" size={20} />
                            {locale === "pt-BR"
                                ? "Trabalhe Como Editor"
                                : "Work as Editor"}
                        </Link>
                    </div>
                </div>
            </section>
            <Footer locale={locale} />
        </div>
    )
}
