import { Locale } from "@/lib/i18n"
import {
    Clock,
    Cpu,
    Gamepad2,
    Monitor,
    Shield,
    Trophy,
    Users,
} from "lucide-react"

export const getPCOptimizationTranslations = (locale: Locale) => {
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
                { value: "low", label: "Latency" },
                { value: "20+", label: "Games Optimized" },
                { value: "5+", label: "Happy Customers" },
            ],
            learnMore: isPortuguese ? "Saiba Mais" : "Learn More",
        },
        features: {
            title: isPortuguese
                ? "Por Que Escolher Nossa Otimização"
                : "Why Choose Our Optimization",
            subtitle: isPortuguese
                ? "Técnicas comprovadas que entregam resultados reais para gamers sérios"
                : "Proven techniques that deliver real results for serious gamers",
            list: [
                {
                    icon: Cpu,
                    title: isPortuguese ? "Otimização de CPU" : "CPU Optimization",
                    description: isPortuguese
                        ? "Ajustamos configurações do processador para máxima performance em jogos, incluindo prioridades de processos e configurações de energia."
                        : "We fine-tune your processor settings for maximum gaming performance, including process priorities and power configurations.",
                },
                {
                    icon: Gamepad2,
                    title: isPortuguese ? "Configuração de Jogos" : "Game Configuration",
                    description: isPortuguese
                        ? "Configuramos cada jogo individualmente para garantir que você obtenha o melhor FPS possível sem sacrificar a qualidade visual."
                        : "We configure each game individually to ensure you get the best possible FPS without sacrificing visual quality.",
                },
                {
                    icon: Monitor,
                    title: isPortuguese ? "Otimização de Display" : "Display Optimization",
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
                ? "A cada segundo que você perde com lag, alguém está dominando a partida."
                : "Every second you lose to lag, someone else is dominating the match.",
            button: isPortuguese
                ? "DESBLOQUEAR POTÊNCIA MÁXIMA"
                : "UNLOCK FULL POWER",
        },
    }
}