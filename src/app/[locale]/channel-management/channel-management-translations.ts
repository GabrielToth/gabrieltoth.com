import { Locale } from "@/lib/i18n"
import { SiYoutube } from "@icons-pack/react-simple-icons"
import { BarChart3, DollarSign, Target, TrendingUp, Video } from "lucide-react"

export const getChannelManagementTranslations = (locale: Locale) => {
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
                { icon: SiYoutube, name: "YouTube Optimization" },
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
                    channel: "WaveIGL",
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
                    name: "WaveIGL",
                    role: isPortuguese
                        ? "Youtube, Instagram, TikTok, Twitch e outras plataformas"
                        : "YouTube, Instagram, TikTok, Twitch and other platforms",
                    content: isPortuguese
                        ? "Desenvolvi e gerencio todas as redes sociais do WaveIGL desde o início. Atualmente somamos 2M+ views mensais distribuídos entre YouTube (400K), Instagram, TikTok, Twitch e outras plataformas. O projeto cresce consistentemente há anos."
                        : "I developed and manage all WaveIGL social networks from the beginning. We currently total 2M+ monthly views distributed across YouTube (400K), Instagram, TikTok, Twitch and other platforms. The project has been growing consistently for years.",
                    rating: 5,
                },
                {
                    name: isPortuguese
                        ? "Gabriel Toth (canal antigo) - @oprimeirogabrieltoth"
                        : "Gabriel Toth (old channel) - @oprimeirogabrieltoth",
                    role: isPortuguese
                        ? "Canal antigo - Resultado extraordinário"
                        : "Old channel - Extraordinary result",
                    content: isPortuguese
                        ? "Um dos meus casos mais impressionantes: consegui mais de 1 milhão de visualizações em um canal que ainda tinha menos de 1000 inscritos. Isso demonstra minha capacidade de criar conteúdo viral e entender profundamente os algoritmos das plataformas."
                        : "One of my most impressive cases: I achieved over 1 million views on a channel that still had less than 1000 subscribers. This demonstrates my ability to create viral content and deeply understand platform algorithms.",
                    rating: 5,
                },
                {
                    name: isPortuguese
                        ? "Gabriel Toth (canal atual) - @ogabrieltoth"
                        : "Gabriel Toth (current channel) - @ogabrieltoth",
                    role: isPortuguese
                        ? "Canal atual - Previsão de 100K views no mês de Julho"
                        : "Current channel - 100K views prediction in July",
                    content: isPortuguese
                        ? "Colocando em prática a estratégia de conteúdo multi-plataforma, estou mostrando na prática que o crescimento é possível para todos."
                        : "Putting into practice the multi-platform content strategy, I'm showing in practice that growth is possible for everyone.",
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
