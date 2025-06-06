import { type Locale } from "@/lib/i18n"
import {
    BarChart3,
    CheckCircle,
    DollarSign,
    MessageCircle,
    Star,
    Target,
    TrendingUp,
} from "lucide-react"

interface ChannelManagementLandingProps {
    locale: Locale
}

const getTranslations = (locale: Locale) => {
    const isPortuguese = locale === "pt-BR"
    return {
        hero: {
            badge: isPortuguese
                ? "🚀 Consultoria Especializada"
                : "🚀 Specialized Consulting",
            title: isPortuguese
                ? "Transforme Seu Canal em uma Máquina de Crescimento"
                : "Transform Your Channel into a Growth Machine",
            subtitle: isPortuguese
                ? "Desbloqueie todo o potencial do seu canal do YouTube com consultoria especializada em analytics, otimização de conteúdo e estratégias de monetização."
                : "Unlock your YouTube channel's full potential with specialized consulting in analytics, content optimization and monetization strategies.",
            cta: isPortuguese ? "Agendar Consultoria" : "Schedule Consultation",
            stats: [
                {
                    number: "2M+",
                    label: isPortuguese
                        ? "Visualizações mensais gerenciadas"
                        : "Monthly views managed",
                },
                {
                    number: "300%",
                    label: isPortuguese
                        ? "Crescimento médio dos clientes"
                        : "Average client growth",
                },
                {
                    number: "5+",
                    label: isPortuguese
                        ? "Anos de experiência"
                        : "Years of experience",
                },
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
                        ? "Análise Completa de Performance"
                        : "Complete Performance Analysis",
                    description: isPortuguese
                        ? "Auditoria profunda dos seus analytics com insights acionáveis para otimização imediata."
                        : "Deep audit of your analytics with actionable insights for immediate optimization.",
                    features: [
                        isPortuguese
                            ? "Análise de métricas avançadas"
                            : "Advanced metrics analysis",
                        isPortuguese
                            ? "Identificação de gargalos"
                            : "Bottleneck identification",
                        isPortuguese
                            ? "Relatório personalizado"
                            : "Custom report",
                    ],
                },
                {
                    icon: Target,
                    title: isPortuguese
                        ? "Estratégia de Conteúdo"
                        : "Content Strategy",
                    description: isPortuguese
                        ? "Desenvolvimento de estratégia de conteúdo baseada em dados para maximizar alcance e engajamento."
                        : "Data-driven content strategy development to maximize reach and engagement.",
                    features: [
                        isPortuguese
                            ? "Calendário editorial"
                            : "Editorial calendar",
                        isPortuguese
                            ? "Otimização de títulos e thumbnails"
                            : "Title and thumbnail optimization",
                        isPortuguese
                            ? "Análise de tendências"
                            : "Trend analysis",
                    ],
                },
                {
                    icon: DollarSign,
                    title: isPortuguese
                        ? "Otimização de Monetização"
                        : "Monetization Optimization",
                    description: isPortuguese
                        ? "Estratégias para maximizar revenue através de múltiplos canais de monetização."
                        : "Strategies to maximize revenue through multiple monetization channels.",
                    features: [
                        isPortuguese
                            ? "Otimização de AdSense"
                            : "AdSense optimization",
                        isPortuguese
                            ? "Estratégias de patrocínio"
                            : "Sponsorship strategies",
                        isPortuguese ? "Produtos digitais" : "Digital products",
                    ],
                },
            ],
        },
        testimonials: {
            title: isPortuguese ? "Resultados Comprovados" : "Proven Results",
            subtitle: isPortuguese
                ? "Veja o que outros criadores estão dizendo"
                : "See what other creators are saying",
            items: [
                {
                    name: "WaveIGL Channel",
                    role: isPortuguese
                        ? "Canal Gaming - 2M+ visualizações/mês"
                        : "Gaming Channel - 2M+ views/month",
                    content: isPortuguese
                        ? "Gabriel transformou completamente minha estratégia de conteúdo. Em 6 meses, triplicamos as visualizações e dobrou a receita."
                        : "Gabriel completely transformed my content strategy. In 6 months, we tripled views and doubled revenue.",
                    rating: 5,
                },
                {
                    name: "TechCreator",
                    role: isPortuguese
                        ? "Canal de Tecnologia - 500K+ subs"
                        : "Tech Channel - 500K+ subs",
                    content: isPortuguese
                        ? "A análise de dados que o Gabriel fez revelou oportunidades que eu nunca tinha visto. Meu canal nunca cresceu tão rápido."
                        : "Gabriel's data analysis revealed opportunities I had never seen. My channel has never grown so fast.",
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
                    price: "R$ 497",
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
                    ],
                    popular: false,
                },
                {
                    name: isPortuguese
                        ? "Consultoria Completa"
                        : "Complete Consulting",
                    price: "R$ 1.497",
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
                    ],
                    popular: true,
                },
                {
                    name: isPortuguese
                        ? "Mentoria Intensiva"
                        : "Intensive Mentoring",
                    price: isPortuguese ? "Sob consulta" : "Quote on request",
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
                    ],
                    popular: false,
                },
            ],
        },
        cta: {
            title: isPortuguese
                ? "Pronto Para Acelerar Seu Crescimento?"
                : "Ready to Accelerate Your Growth?",
            subtitle: isPortuguese
                ? "Agende uma conversa gratuita de 30 minutos para discutirmos seu canal"
                : "Schedule a free 30-minute conversation to discuss your channel",
            button: isPortuguese
                ? "Agendar Conversa Gratuita"
                : "Schedule Free Conversation",
        },
    }
}

export default function ChannelManagementLanding({
    locale,
}: ChannelManagementLandingProps) {
    const t = getTranslations(locale)

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Hero Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium mb-8">
                        {t.hero.badge}
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                        {t.hero.title}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                        {t.hero.subtitle}
                    </p>
                    <a
                        href="#pricing"
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

            {/* Problems Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            {t.problems.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.problems.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {t.problems.items.map((problem, index) => (
                            <div
                                key={index}
                                className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg"
                            >
                                <problem.icon className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                    {problem.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {problem.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
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
                                className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-lg"
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
                                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
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
                                className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg"
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
                                    "{testimonial.content}"
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {t.pricing.plans.map((plan, index) => (
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
                                            Mais Popular
                                        </span>
                                    </div>
                                )}
                                <div className="text-center mb-8">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {plan.name}
                                    </h3>
                                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                                        {plan.price}
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {plan.description}
                                    </p>
                                </div>
                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-center text-gray-600 dark:text-gray-300"
                                        >
                                            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                                    {locale === "pt-BR"
                                        ? "Contratar Agora"
                                        : "Get Started"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4">{t.cta.title}</h2>
                    <p className="text-xl mb-8 opacity-90">{t.cta.subtitle}</p>
                    <a
                        href="mailto:gabriel@gabrieltoth.com"
                        className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
                    >
                        <MessageCircle className="mr-2" size={20} />
                        {t.cta.button}
                    </a>
                </div>
            </section>
        </div>
    )
}
