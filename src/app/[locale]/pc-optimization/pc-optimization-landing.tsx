"use client"

import PricingToggle from "@/components/ui/pricing-toggle"
import { useMoneroPricing } from "@/hooks/use-monero-pricing"
import { type Locale } from "@/lib/i18n"
import {
    CheckCircle,
    Clock,
    Cpu,
    Gamepad2,
    Monitor,
    Shield,
    Trophy,
    Users,
    Zap,
} from "lucide-react"

interface PCOptimizationLandingProps {
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
            badge: isPortuguese ? "⚡ PC LENTO?" : "⚡ SLOW PC?",
            problems: [
                isPortuguese ? "INPUT LAG?" : "INPUT LAG?",
                isPortuguese ? "HIT REG RUIM?" : "BAD HIT REG?",
            ],
            title: isPortuguese ? "NÃO NO NOSSO PLANTÃO!" : "NOT ON OUR WATCH!",
            subtitle: isPortuguese
                ? "Otimização completa de performance para que você nunca mais se preocupe com lag novamente."
                : "Complete performance tuning so you never have to worry about lag again.",
            cta: isPortuguese ? "Ver Planos" : "View Plans",
            videoText: isPortuguese
                ? "É ASSIM QUE UM PC OTIMIZADO SE SENTE"
                : "THAT'S HOW AN OPTIMIZED PC FEELS LIKE",
            stats: [
                { value: "99.9%", label: "Uptime" },
                { value: "1ms", label: "Latency" },
                { value: "1000+", label: "Games Optimized" },
                { value: "500+", label: "Happy Customers" },
            ],
            learnMore: isPortuguese ? "Saiba Mais" : "Learn More",
        },
        features: {
            title: isPortuguese ? "O que fazemos" : "What We Do",
            subtitle: isPortuguese
                ? "Nós oferecemos uma solução completa para otimizar seu PC, desde a configuração de rede até otimização de energia."
                : "We offer a complete solution to optimize your PC, from network configuration to power optimization.",
            list: [
                {
                    icon: Gamepad2,
                    title: isPortuguese
                        ? "Otimização de Jogos"
                        : "Game Optimization",
                    description: isPortuguese
                        ? "Otimizamos seu jogo para garantir que você obtenha o melhor desempenho possível, incluindo ajustes de configuração de rede e otimização de energia."
                        : "We optimize your game to ensure you get the best possible performance, including network configuration adjustments and power optimization.",
                },
                {
                    icon: Cpu,
                    title: isPortuguese
                        ? "Otimização de Hardware"
                        : "Hardware Optimization",
                    description: isPortuguese
                        ? "Otimizamos seu hardware para garantir que você obtenha o melhor desempenho, incluindo ajustes de BIOS e otimização de energia."
                        : "We optimize your hardware to ensure you get the best performance, including BIOS fine-tuning and power optimization.",
                },
                {
                    icon: Monitor,
                    title: isPortuguese
                        ? "Otimização de Monitor"
                        : "Monitor Optimization",
                    description: isPortuguese
                        ? "Otimizamos seu monitor para garantir que você obtenha a melhor experiência de jogo, incluindo ajustes de resolução e taxa de quadros."
                        : "We optimize your monitor to ensure you get the best gaming experience, including resolution and frame rate adjustments.",
                },
                {
                    icon: Shield,
                    title: isPortuguese ? "Segurança" : "Security",
                    description: isPortuguese
                        ? "Garantimos que seu PC esteja protegido contra malware e outros riscos, incluindo otimização de firewall e atualização de software."
                        : "We guarantee your PC is protected against malware and other risks, including firewall optimization and software updates.",
                },
            ],
        },
        pricing: {
            title: isPortuguese
                ? "Escolha Seu Nível de Otimização"
                : "Choose Your Optimization Tier",
            subtitle: isPortuguese
                ? "Cuidamos da otimização, você aproveita a performance"
                : "We handle the tuning, you enjoy the performance",
            plans: [
                {
                    name: isPortuguese
                        ? "Boost de Performance Windows"
                        : "Windows Performance Boost",
                    basePrice: 149, // Monero base price
                    description: isPortuguese
                        ? "Windows e Rede otimizados para jogos. Limpo, rápido e totalmente otimizado."
                        : "Game-ready Windows & Network. Clean, fast, and fully optimized for peak performance.",
                    features: [
                        isPortuguese
                            ? "Otimização manual do Windows"
                            : "Manual Windows optimization",
                        isPortuguese
                            ? "Configuração de rede para jogos"
                            : "Gaming network configuration",
                        isPortuguese
                            ? "Remoção de bloatware"
                            : "Bloatware removal",
                        isPortuguese
                            ? "Otimização de energia"
                            : "Power optimization",
                        isPortuguese ? "Suporte 7 dias" : "7-day support",
                    ],
                    popular: false,
                },
                {
                    name: isPortuguese
                        ? "Otimização Nível Pro"
                        : "Pro-Level System Optimization",
                    basePrice: 249, // Monero base price
                    description: isPortuguese
                        ? "Desbloqueie o verdadeiro potencial do hardware com ajustes de OS e BIOS."
                        : "Unlock your hardware's true potential with OS and BIOS fine-tuning, including hidden tweaks.",
                    features: [
                        isPortuguese
                            ? "Tudo do plano anterior"
                            : "Everything from Windows Boost",
                        isPortuguese
                            ? "Otimização avançada de BIOS"
                            : "Advanced BIOS optimization",
                        isPortuguese
                            ? "Tweaks ocultos do sistema"
                            : "Hidden system tweaks",
                        isPortuguese
                            ? "Configuração de periféricos"
                            : "Peripheral configuration",
                        isPortuguese
                            ? "Testes de estabilidade"
                            : "Stability testing",
                    ],
                    popular: true,
                },
                {
                    name: isPortuguese
                        ? "Overhaul de Performance Suprema"
                        : "Ultimate Performance Overhaul",
                    basePrice: 449, // Monero base price
                    description: isPortuguese
                        ? "Otimização completa com overclock de CPU, GPU e RAM para performance máxima."
                        : "All-in-one tuning with CPU, GPU & RAM overclocking for peak performance.",
                    features: [
                        isPortuguese
                            ? "Tudo dos planos anteriores"
                            : "Everything from Pro-Level",
                        isPortuguese
                            ? "Overclock seguro de CPU"
                            : "Safe CPU overclocking",
                        isPortuguese
                            ? "Overclock de GPU otimizado"
                            : "Optimized GPU overclocking",
                        isPortuguese
                            ? "Overclock de RAM (XMP+)"
                            : "RAM overclocking (XMP+)",
                        isPortuguese
                            ? "Monitoramento de temperatura"
                            : "Temperature monitoring",
                        isPortuguese
                            ? "Garantia de estabilidade"
                            : "Stability guarantee",
                    ],
                    popular: false,
                },
            ],
            popular: isPortuguese ? "MAIS POPULAR" : "MOST POPULAR",
            cta: isPortuguese
                ? "LER TERMOS E CONTRATAR"
                : "READ TERMS & GET STARTED",
        },
        testimonials: {
            title: isPortuguese
                ? "Confiado por Pros, Amado por Gamers"
                : "Trusted by Pros, Loved by Gamers",
            subtitle: isPortuguese
                ? "Você não é o primeiro. Junte-se às centenas de jogadores que desbloquearam performance elite."
                : "You're not the first. Join the hundreds of players who've unlocked elite performance.",
            items: [
                {
                    name: "ProGamer",
                    role: isPortuguese
                        ? "Jogador Competitivo"
                        : "Competitive Player",
                    content: isPortuguese
                        ? "Meu jogo nunca se sentiu melhor! Ganhando quase o dobro de FPS agora - isso é absolutamente incrível."
                        : "My game never felt better, and so smooth! Getting nearly double the frames now - this is absolutely incredible.",
                    rating: 5,
                },
                {
                    name: "StreamerPro",
                    role: isPortuguese ? "Streamer" : "Content Creator",
                    content: isPortuguese
                        ? "Finalmente posso jogar e fazer stream sem drops de FPS. A otimização foi perfeita!"
                        : "Finally I can game and stream without FPS drops. The optimization was perfect!",
                    rating: 5,
                },
            ],
        },
        games: {
            title: isPortuguese
                ? "Qualquer Jogo, Toda Vez"
                : "Any Game, Every Time",
            subtitle: isPortuguese
                ? "De shooters rápidos a mundo aberto, sabemos como fazer seu jogo rodar exatamente como você quer."
                : "From fast-paced shooters to open-world, we know how to make your game run exactly as you'd like it to.",
            list: [
                "Call of Duty",
                "PUBG",
                "Marvel Rivals",
                "Rainbow Six Siege",
                "Valorant",
                "Fortnite",
                "CS2",
                "Apex Legends",
            ],
        },
        guarantee: {
            title: isPortuguese
                ? "Garantia de Resultados"
                : "Results Guarantee",
            items: [
                {
                    icon: Trophy,
                    title: isPortuguese
                        ? "Métodos Comprovados"
                        : "Proven Methods",
                    description: isPortuguese
                        ? "Nossos especialistas otimizam CPU, GPU, RAM e placa de rede, passando por vários testes de stress."
                        : "Our specialists optimize your CPU, GPU, RAM and NIC, then go through various stress tests.",
                },
                {
                    icon: Users,
                    title: isPortuguese ? "Suporte Gratuito" : "Free Support",
                    description: isPortuguese
                        ? "Disponíveis para resolver qualquer problema por até 7 dias após a otimização."
                        : "We are available to address any issues for up to 7 days post-optimization.",
                },
                {
                    icon: Clock,
                    title: isPortuguese
                        ? "Anos de Experiência"
                        : "Years of Experience",
                    description: isPortuguese
                        ? "Passamos anos testando e ajustando sistemas para performance máxima."
                        : "We've spent years testing, benchmarking, and tuning systems for top performance.",
                },
            ],
        },
        cta: {
            title: isPortuguese
                ? "PARE DE DESPERDIÇAR SEU TEMPO"
                : "STOP WASTING YOUR TIME",
            subtitle: isPortuguese
                ? "Um PC high-end rodando como mid-tier? Nunca mais. Você construiu uma fera. Deixe-nos desbloqueá-la."
                : "A high-end PC running like a mid-tier build? Not anymore. You built a beast. Let us unlock it.",
            button: isPortuguese
                ? "DESBLOQUEAR PODER TOTAL"
                : "UNLOCK FULL POWER",
        },
    }
}

export default function PCOptimizationLanding({
    locale,
}: PCOptimizationLandingProps) {
    const t = getTranslations(locale)
    const { calculatePrice } = useMoneroPricing()

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center">
                {/* Background Effects */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-black"></div>
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                    <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-700"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 mb-8">
                        <Zap className="w-4 h-4 mr-2 text-blue-400" />
                        <span className="text-blue-300 text-sm font-medium">
                            {t.hero.badge}
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent">
                        {t.hero.title}
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                        {t.hero.subtitle}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                        <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105">
                            {t.hero.cta}
                        </button>
                        <button className="px-8 py-4 border border-gray-600 hover:border-gray-400 rounded-lg font-semibold text-lg transition-all duration-300 hover:bg-gray-800">
                            {t.hero.learnMore}
                        </button>
                    </div>

                    {/* Performance Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        {t.hero.stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-3xl md:text-4xl font-black text-blue-400 mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-gray-400 text-sm">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-gradient-to-b from-black to-gray-900">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            {t.features.title}
                        </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            {t.features.subtitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {t.features.list.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105"
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-300 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-24 bg-gradient-to-b from-gray-900 to-black">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            {t.pricing.title}
                        </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            {t.pricing.subtitle}
                        </p>
                    </div>

                    {/* Pricing Toggle */}
                    <PricingToggle locale={locale} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {t.pricing.plans.map((plan, index) => {
                            const pricing = calculatePrice(plan.basePrice, locale)
                            return (
                                <div
                                    key={index}
                                    className={`relative bg-gray-800/50 backdrop-blur-sm border rounded-2xl p-8 hover:transform hover:scale-105 transition-all duration-300 ${
                                        plan.popular
                                            ? "border-blue-500 shadow-2xl shadow-blue-500/20"
                                            : "border-gray-700"
                                    }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                                                {t.pricing.popular}
                                            </div>
                                        </div>
                                    )}

                                    {/* Monero Discount Badge */}
                                    {pricing.isMonero && pricing.discount > 0 && (
                                        <div className="absolute -top-2 -right-2">
                                            <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                                -{pricing.discount}%
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-white mb-4">
                                            {plan.name}
                                        </h3>
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            {pricing.originalPrice && (
                                                <span className="text-lg text-gray-500 line-through">
                                                    {pricing.currency} {pricing.originalPrice}
                                                </span>
                                            )}
                                            <span className="text-4xl font-black text-blue-400">
                                                {pricing.currency} {pricing.displayPrice}
                                            </span>
                                        </div>
                                        <p className="text-gray-400">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, idx) => (
                                            <li
                                                key={idx}
                                                className="flex items-center gap-3"
                                            >
                                                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                                <span className="text-gray-300">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                                            plan.popular
                                                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                        }`}
                                    >
                                        {t.pricing.cta}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-r from-blue-900 to-purple-900">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
                        {t.cta.title}
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        {t.cta.subtitle}
                    </p>
                    <button className="px-8 py-4 bg-white text-blue-900 hover:bg-gray-100 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105">
                        {t.cta.button}
                    </button>
                </div>
            </section>

            <style jsx>{`
                @keyframes marquee {
                    0% {
                        transform: translateX(100%);
                    }
                    100% {
                        transform: translateX(-100%);
                    }
                }
                @keyframes marquee-slow {
                    0% {
                        transform: translateX(100%);
                    }
                    100% {
                        transform: translateX(-200%);
                    }
                }
                .animate-marquee {
                    animation: marquee 10s linear infinite;
                }
                .animate-marquee-slow {
                    animation: marquee-slow 15s linear infinite;
                }
            `}</style>
        </div>
    )
}
