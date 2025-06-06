import { type Locale } from "@/lib/i18n"
import {
    CheckCircle,
    Clock,
    Cpu,
    Gamepad2,
    HardDrive,
    Monitor,
    Shield,
    Star,
    Target,
    TrendingUp,
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
        },
        benefits: [
            {
                icon: Target,
                title: isPortuguese
                    ? "Hit Registration Instantâneo"
                    : "Instant Hit Registration",
                description: isPortuguese
                    ? "Seus tiros finalmente acertam onde miram"
                    : "Your shots finally hit where you aim",
            },
            {
                icon: Zap,
                title: isPortuguese
                    ? "Baixa Latência Real"
                    : "TRUE Low Latency",
                description: isPortuguese
                    ? "Resposta imediata em cada clique"
                    : "Immediate response on every click",
            },
            {
                icon: TrendingUp,
                title: isPortuguese ? "FPS Alto" : "High FPS",
                description: isPortuguese
                    ? "Performance máxima do seu hardware"
                    : "Maximum performance from your hardware",
            },
            {
                icon: Shield,
                title: isPortuguese ? "Sem Stutters" : "No Stutters",
                description: isPortuguese
                    ? "Jogabilidade suave e consistente"
                    : "Smooth and consistent gameplay",
            },
        ],
        sections: [
            {
                badge: isPortuguese ? "GAMEPLAY SEM LAG" : "LAG-FREE GAMEPLAY",
                title: isPortuguese
                    ? "Pare de Perder Por Causa da Conexão"
                    : "Stop Losing Because of Connection",
                description: isPortuguese
                    ? "Está se perguntando por que seus tiros atravessam os inimigos como fantasmas? Não é você - é sua configuração de rede. Vamos garantir que sua internet esteja totalmente otimizada para jogos."
                    : "Wondering why your shots go through enemies like ghosts? It's not you - it's your network setup. We'll make sure your internet is fully game-ready.",
                highlight: isPortuguese
                    ? "🌐 Lag fora, vitórias dentro!"
                    : "🌐 Lag out, wins in!",
                icon: Target,
            },
            {
                badge: isPortuguese
                    ? "FRAMES VENCEM JOGOS"
                    : "FRAMES WIN GAMES",
                title: isPortuguese
                    ? "Seu Hardware É Capaz de Mais"
                    : "Your Hardware is Capable of More",
                description: isPortuguese
                    ? "Desbloqueamos performance não utilizada em cada frame. Desde ajuste de GPU e priorização de CPU até otimização de processos em segundo plano. A maioria dos nossos clientes ganha entre 30% e 50% mais FPS."
                    : "We unlock untapped performance in every frame. From GPU tuning and CPU prioritization to background process optimization. Most of our customers gain between 30% and 50% more FPS.",
                highlight: isPortuguese
                    ? "🎮 Extraia cada gota de poder do seu sistema"
                    : "🎮 Squeeze every last drop of power from your system",
                icon: Cpu,
            },
            {
                badge: isPortuguese ? "ADEUS, STUTTERS" : "GOODBYE, STUTTERS",
                title: isPortuguese
                    ? "Microstutters Matam o Momentum"
                    : "Microstutters Kill Momentum",
                description: isPortuguese
                    ? "Nosso processo de ajuste estabiliza seu sistema de ponta a ponta: planos de energia, timers, alocação de memória, serviços em segundo plano e configurações de jogos."
                    : "Our tuning process stabilizes your system end-to-end: power plans, timers, memory allocation, background services, and game configs.",
                highlight: isPortuguese
                    ? "🎯 Performance suave e consistente"
                    : "🎯 Smooth, consistent performance",
                icon: Monitor,
            },
            {
                badge: isPortuguese
                    ? "CONSISTÊNCIA É REI"
                    : "CONSISTENCY IS KING",
                title: isPortuguese
                    ? "FPS Alto é Ótimo, Frametimes Suaves São Essenciais"
                    : "High FPS is Great, Smooth Frametimes Are Essential",
                description: isPortuguese
                    ? "Otimizamos seu sistema para manter entrega estável em cada frame, reduzindo jitter e eliminando problemas de frame pacing. Movimento de câmera suave como manteiga."
                    : "We optimize your system to maintain stable delivery across every frame, reducing jitter and eliminating frame pacing issues. Buttery smooth camera movement.",
                highlight: isPortuguese
                    ? "📈 Movimento fluido que simplesmente funciona"
                    : "📈 Fluid motion that just feels right",
                icon: HardDrive,
            },
        ],
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
                    price: "R$ 149",
                    originalPrice: "R$ 199",
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
                    price: "R$ 249",
                    originalPrice: "R$ 329",
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
                    price: "R$ 449",
                    originalPrice: "R$ 599",
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

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden">
            {/* Hero Section */}
            <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-black via-gray-900 to-black">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative max-w-7xl mx-auto text-center">
                    {/* Scrolling problems text */}
                    <div className="mb-8 overflow-hidden">
                        <div className="animate-marquee whitespace-nowrap text-red-500 text-2xl font-bold">
                            {t.hero.badge}{" "}
                            {t.hero.problems.map((problem, i) => (
                                <span key={i}>{problem} </span>
                            ))}
                            {t.hero.badge}{" "}
                            {t.hero.problems.map((problem, i) => (
                                <span key={i}>{problem} </span>
                            ))}
                        </div>
                    </div>

                    <h1 className="text-6xl sm:text-8xl font-black text-white mb-8 tracking-wider">
                        {t.hero.title}
                    </h1>

                    <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
                        {t.hero.subtitle}
                    </p>

                    <a
                        href="#pricing"
                        className="inline-flex items-center px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 text-xl"
                    >
                        <Gamepad2 className="mr-3" size={24} />
                        {t.hero.cta}
                    </a>

                    {/* Benefits Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
                        {t.benefits.map((benefit, index) => (
                            <div
                                key={index}
                                className="bg-gray-900/50 backdrop-blur border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-all"
                            >
                                <benefit.icon className="w-10 h-10 text-blue-400 mb-4 mx-auto" />
                                <h3 className="font-bold text-white mb-2">
                                    {benefit.title}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    {benefit.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Sections */}
            {t.sections.map((section, index) => (
                <section
                    key={index}
                    className={`py-20 px-4 sm:px-6 lg:px-8 ${
                        index % 2 === 0 ? "bg-gray-900" : "bg-black"
                    }`}
                >
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="inline-block mb-6">
                                <div className="animate-marquee-slow whitespace-nowrap text-blue-400 text-lg font-bold">
                                    {section.badge} {section.badge}{" "}
                                    {section.badge}
                                </div>
                            </div>
                            <h2 className="text-4xl font-black text-white mb-6">
                                {section.title}
                            </h2>
                            <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto">
                                {section.description}
                            </p>
                            <div className="text-2xl font-bold text-yellow-400">
                                {section.highlight}
                            </div>
                        </div>
                    </div>
                </section>
            ))}

            {/* Games Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-4xl font-black text-white mb-6">
                        {t.games.title}
                    </h2>
                    <p className="text-xl text-gray-300 mb-12 max-w-4xl mx-auto">
                        {t.games.subtitle}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {t.games.list.map((game, index) => (
                            <div
                                key={index}
                                className="bg-black/50 backdrop-blur border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-all"
                            >
                                <Gamepad2 className="w-8 h-8 text-blue-400 mb-3 mx-auto" />
                                <div className="font-bold text-white text-sm">
                                    {game}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-white mb-6">
                            {t.testimonials.title}
                        </h2>
                        <p className="text-xl text-gray-300">
                            {t.testimonials.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {t.testimonials.items.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-gray-900/50 backdrop-blur border border-gray-700 rounded-lg p-8"
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
                                <p className="text-gray-300 mb-6 italic text-lg">
                                    "{testimonial.content}"
                                </p>
                                <div>
                                    <div className="font-bold text-white">
                                        {testimonial.name}
                                    </div>
                                    <div className="text-blue-400">
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
                className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-white mb-6">
                            {t.pricing.title}
                        </h2>
                        <p className="text-xl text-gray-300">
                            {t.pricing.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {t.pricing.plans.map((plan, index) => (
                            <div
                                key={index}
                                className={`bg-black/50 backdrop-blur border rounded-lg p-8 relative ${
                                    plan.popular
                                        ? "border-blue-500 transform scale-105"
                                        : "border-gray-700"
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                                            MAIS POPULAR
                                        </span>
                                    </div>
                                )}
                                <div className="text-center mb-8">
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {plan.name}
                                    </h3>
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <span className="text-4xl font-black text-blue-400">
                                            {plan.price}
                                        </span>
                                        <span className="text-lg text-gray-500 line-through">
                                            {plan.originalPrice}
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
                                            className="flex items-center text-gray-300"
                                        >
                                            <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105">
                                    {locale === "pt-BR"
                                        ? "CONTRATAR AGORA"
                                        : "GET STARTED"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Guarantee Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-black text-white text-center mb-16">
                        {t.guarantee.title}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {t.guarantee.items.map((item, index) => (
                            <div
                                key={index}
                                className="text-center bg-gray-900/50 backdrop-blur border border-gray-700 rounded-lg p-8"
                            >
                                <item.icon className="w-16 h-16 text-blue-400 mx-auto mb-6" />
                                <h3 className="text-xl font-bold text-white mb-4">
                                    {item.title}
                                </h3>
                                <p className="text-gray-400">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-black text-white mb-6">
                        {t.cta.title}
                    </h2>
                    <p className="text-xl text-white/90 mb-12">
                        {t.cta.subtitle}
                    </p>
                    <a
                        href="#pricing"
                        className="inline-flex items-center px-12 py-6 bg-black text-white rounded-lg font-bold hover:bg-gray-900 transition-all transform hover:scale-105 text-xl"
                    >
                        <Zap className="mr-3" size={24} />
                        {t.cta.button}
                    </a>
                </div>
            </section>

            {/* Custom CSS for animations */}
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
                        transform: translateX(50%);
                    }
                    100% {
                        transform: translateX(-50%);
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
