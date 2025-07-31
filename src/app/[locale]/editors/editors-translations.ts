/**
 * TODO: MIGRATION NEEDED  
 * This file should be migrated to translations/ folder with proper JSON structure
 * Currently contains complex programmatic translation logic with icon name mapping
 * Similar to how pc-optimization was refactored to use translations/index.ts
 * 
 * The translations/ folder already exists with proper JSON files for all languages (en, pt-BR, es, de)
 * But this mediator contains additional programmatic sections like:
 * - about.skills with iconName mapping
 * - tools.items with iconName references  
 * - services.items with iconName and dynamic features
 * - Complex conditional logic for PT-BR vs EN
 * 
 * Future refactor should:
 * 1. Move all programmatic content to JSON files  
 * 2. Inject icon components in translations/index.ts using iconName mapping
 * 3. Remove this mediator file completely
 * 4. Update function to be synchronous (remove async/await)
 */

import { IconName } from "@/lib/icons"
export interface EditorTranslations {
    locale: "en" | "pt-BR"
    moneroToggle: {
        title: string
        description: string
        enabled: string
        disabled: string
    }
    hero: {
        badge: string
        title: string
        subtitle: string
        cta: string
        stats: Array<{
            number: string
            label: string
        }>
    }
    about: {
        title: string
        description: string
        intro: string
        experience: string
        passion: string
        skills: Array<{
            name: string
            iconName: IconName
        }>
    }
    tools: {
        title: string
        subtitle: string
        items: Array<{
            name: string
            description: string
            iconName: IconName
        }>
    }
    services: {
        title: string
        subtitle: string
        items: Array<{
            iconName: IconName
            title: string
            description: string
            features: string[]
        }>
    }
    testimonials: {
        title: string
        subtitle: string
        items: Array<{
            rating: number
            content: string
            name: string
            role: string
        }>
    }
    pricing: {
        title: string
        subtitle: string
        plans: Array<{
            name: string
            basePrice: number
            description: string
            features: string[]
            popular?: boolean
        }>
        note: string
    }
    requirements: {
        title: string
        subtitle: string
        items: Array<{
            title: string
            description: string
            iconName: IconName
            features: string[]
        }>
    }
    benefits: {
        title: string
        subtitle: string
        description: string
        items: Array<{
            title: string
            description: string
            iconName: IconName
        }>
    }
    cta: {
        title: string
        description: string
        button: string
    }
}

export async function getEditorsTranslations(
    locale: "en" | "pt-BR"
): Promise<EditorTranslations> {
    "use server"

    if (locale === "pt-BR") {
        return {
            locale,
            moneroToggle: {
                title: "Preços com Monero (XMR)",
                description:
                    "Ative para ver preços com 50% de desconto usando Monero",
                enabled: "💰 Preços com Monero (50% OFF)",
                disabled: "💴 Preços Regulares (PIX/Card)",
            },
            hero: {
                badge: "🎬 Junte-se à Nossa Equipe",
                title: "Procuramos Editores Talentosos",
                subtitle:
                    "Faça parte de uma equipe global de editores profissionais. Trabalhe com projetos interessantes e tenha flexibilidade de horário.",
                cta: "Candidate-se Agora",
                stats: [
                    {
                        number: "50+",
                        label: "Editores ativos",
                    },
                    {
                        number: "100+",
                        label: "Projetos por mês",
                    },
                    {
                        number: "24/7",
                        label: "Suporte à equipe",
                    },
                ],
            },
            about: {
                title: "Por Que Trabalhar Conosco?",
                description:
                    "Oferecemos um ambiente flexível e recompensador para editores talentosos",
                intro: "Buscamos editores apaixonados por criar conteúdo de qualidade. Oferecemos projetos diversificados, pagamento competitivo e a liberdade de trabalhar de onde quiser.",
                experience:
                    "Nossa plataforma conecta você a clientes globais, garantindo um fluxo constante de projetos interessantes. Você escolhe quais projetos aceitar e define seu próprio ritmo.",
                passion:
                    "Valorizamos criatividade e qualidade. Se você é detalhista, organizado e ama edição de vídeos, queremos você em nossa equipe.",
                skills: [
                    {
                        iconName: "Video" as IconName,
                        name: "Edição de Vídeo",
                    },
                    {
                        iconName: "Wand2" as IconName,
                        name: "Color Grading",
                    },
                    {
                        iconName: "Music2" as IconName,
                        name: "Sound Design",
                    },
                    {
                        iconName: "MonitorPlay" as IconName,
                        name: "Motion Graphics",
                    },
                    {
                        iconName: "Settings2" as IconName,
                        name: "Pós-Produção",
                    },
                    {
                        iconName: "Code2" as IconName,
                        name: "Automação",
                    },
                ],
            },
            tools: {
                title: "Ferramentas Necessárias",
                subtitle: "Software e equipamentos que você precisa ter",
                items: [
                    {
                        iconName: "SiAdobepremierepro" as IconName,
                        name: "Adobe Premiere Pro",
                        description: "Principal software de edição",
                    },
                    {
                        iconName: "SiAdobeaftereffects" as IconName,
                        name: "Adobe After Effects",
                        description: "Para motion graphics e VFX",
                    },
                    {
                        iconName: "SiAdobephotoshop" as IconName,
                        name: "Adobe Photoshop",
                        description: "Para edição de thumbnails",
                    },
                    {
                        iconName: "Headphones" as IconName,
                        name: "Equipamento de Áudio",
                        description: "Para edição de áudio profissional",
                    },
                ],
            },
            services: {
                title: "Serviços de Edição",
                subtitle: "Soluções completas para seu conteúdo",
                items: [
                    {
                        iconName: "Scissors" as IconName,
                        title: "Edição Completa",
                        description:
                            "Edição profissional do seu conteúdo com cortes dinâmicos, transições suaves e ritmo adequado.",
                        features: [
                            "Cortes dinâmicos e precisos",
                            "Transições personalizadas",
                            "Otimização de ritmo",
                        ],
                    },
                    {
                        iconName: "MonitorPlay" as IconName,
                        title: "Motion Graphics",
                        description:
                            "Animações e efeitos visuais para deixar seu conteúdo mais profissional e atraente.",
                        features: [
                            "Animações personalizadas",
                            "Lower thirds e títulos",
                            "Efeitos visuais",
                        ],
                    },
                    {
                        iconName: "FileVideo2" as IconName,
                        title: "Pacote Completo",
                        description:
                            "Solução completa incluindo edição, motion graphics, color grading e sound design.",
                        features: [
                            "Edição profissional",
                            "Motion graphics e VFX",
                            "Color grading e sound design",
                        ],
                    },
                ],
            },
            testimonials: {
                title: "Feedback dos Clientes",
                subtitle: "O que dizem sobre meu trabalho",
                items: [
                    {
                        rating: 5,
                        content:
                            "Excelente trabalho! Superou minhas expectativas com a qualidade da edição e as animações personalizadas.",
                        name: "Carlos Silva",
                        role: "YouTuber Tech",
                    },
                    {
                        rating: 5,
                        content:
                            "Profissional incrível! Entregou antes do prazo e com qualidade excepcional. Recomendo muito!",
                        name: "Ana Costa",
                        role: "Criadora de Conteúdo",
                    },
                ],
            },
            pricing: {
                title: "Pacotes de Edição",
                subtitle: "Escolha o melhor plano para seu conteúdo",
                plans: [
                    {
                        name: "Básico",
                        basePrice: 150,
                        description: "Edição profissional para vídeos simples",
                        features: [
                            "Edição básica de vídeo",
                            "Cortes e transições",
                            "Ajustes de áudio básicos",
                            "Até 10 minutos de vídeo",
                            "2 revisões incluídas",
                        ],
                    },
                    {
                        name: "Profissional",
                        basePrice: 300,
                        description: "Edição completa com motion graphics",
                        features: [
                            "Tudo do plano Básico",
                            "Motion graphics personalizados",
                            "Color grading",
                            "Sound design",
                            "Até 20 minutos de vídeo",
                            "3 revisões incluídas",
                        ],
                        popular: true,
                    },
                    {
                        name: "Premium",
                        basePrice: 500,
                        description: "Pacote completo para projetos especiais",
                        features: [
                            "Tudo do plano Profissional",
                            "VFX avançados",
                            "Animações 3D",
                            "Consultoria de conteúdo",
                            "Até 30 minutos de vídeo",
                            "Revisões ilimitadas",
                        ],
                    },
                ],
                note: "* Todos os pacotes incluem entrega em até 5 dias úteis. Projetos urgentes podem ter taxa adicional.",
            },
            requirements: {
                title: "Requisitos",
                subtitle: "O que procuramos em nossos editores",
                items: [
                    {
                        title: "Vontade de Aprender",
                        description:
                            "Disposição para aprender e evoluir constantemente através de tutoriais e prática",
                        iconName: "GraduationCap",
                        features: [
                            "Buscar tutoriais por conta própria",
                            "Praticar constantemente",
                            "Aceitar feedback e melhorar",
                        ],
                    },
                    {
                        title: "Habilidades Técnicas",
                        description:
                            "Familiaridade básica ou disposição para aprender as ferramentas",
                        iconName: "MonitorPlay",
                        features: [
                            "Conhecimento básico de edição",
                            "Interesse em motion graphics",
                            "Vontade de aprender áudio",
                        ],
                    },
                    {
                        title: "Soft Skills",
                        description:
                            "Habilidades essenciais para trabalhar em nossa equipe",
                        iconName: "Users",
                        features: [
                            "Comunicação clara",
                            "Organização e pontualidade",
                            "Trabalho em equipe",
                        ],
                    },
                ],
            },
            benefits: {
                title: "Benefício",
                subtitle: "Ganhe 100% da monetização do seu trabalho",
                description:
                    "Você recebe 100% do valor de monetização do vídeo ou shorts no YouTube durante o primeiro mês após a publicação.",
                items: [
                    {
                        title: "Monetização YouTube",
                        description: "100% do valor por 30 dias",
                        iconName: "Youtube" as IconName,
                    },
                    {
                        title: "Período",
                        description: "Primeiro mês após publicação",
                        iconName: "Clock" as IconName,
                    },
                    {
                        title: "Tipos de Conteúdo",
                        description: "Vídeos e Shorts",
                        iconName: "Video" as IconName,
                    },
                ],
            },
            cta: {
                title: "Pronto para se Juntar à Nossa Equipe?",
                description: "Envie seu portfólio e currículo para começarmos",
                button: "Enviar Candidatura",
            },
        }
    }

    return {
        locale,
        moneroToggle: {
            title: "Monero (XMR) Pricing",
            description: "Enable to see 50% discount prices using Monero",
            enabled: "💰 Monero Prices (50% OFF)",
            disabled: "💴 Regular Prices (PIX/Card)",
        },
        hero: {
            badge: "🎬 Junte-se à Nossa Equipe",
            title: "Procuramos Editores Talentosos",
            subtitle:
                "Faça parte de uma equipe global de editores profissionais. Trabalhe com projetos interessantes e tenha flexibilidade de horário.",
            cta: "Candidate-se Agora",
            stats: [
                {
                    number: "50+",
                    label: "Active editors",
                },
                {
                    number: "100+",
                    label: "Projects per month",
                },
                {
                    number: "24/7",
                    label: "Team support",
                },
            ],
        },
        about: {
            title: "Why Work With Us?",
            description:
                "We're looking for editors passionate about creating quality content. We offer diverse projects, competitive pay, and the freedom to work from anywhere.",
            intro: "With years of video editing experience, our team works with the best content creators in Brazil and worldwide.",
            experience:
                "Our passion is transforming ideas into impactful visual stories that captivate and engage audiences.",
            passion:
                "We value creativity and quality. If you're detail-oriented, organized, and love video editing, we want you on our team.",
            skills: [
                {
                    iconName: "Video" as IconName,
                    name: "Video Editing",
                },
                {
                    iconName: "Wand2" as IconName,
                    name: "Color Grading",
                },
                {
                    iconName: "Music2" as IconName,
                    name: "Sound Design",
                },
                {
                    iconName: "MonitorPlay" as IconName,
                    name: "Motion Graphics",
                },
                {
                    iconName: "Settings2" as IconName,
                    name: "Post-Production",
                },
                {
                    iconName: "Code2" as IconName,
                    name: "Automation",
                },
            ],
        },
        tools: {
            title: "Required Tools",
            subtitle: "Software and equipment you need to have",
            items: [
                {
                    iconName: "SiAdobepremierepro" as IconName,
                    name: "Adobe Premiere Pro",
                    description: "Main editing software",
                },
                {
                    iconName: "SiAdobeaftereffects" as IconName,
                    name: "Adobe After Effects",
                    description: "For motion graphics and VFX",
                },
                {
                    iconName: "SiAdobephotoshop" as IconName,
                    name: "Adobe Photoshop",
                    description: "For thumbnail editing",
                },
                {
                    iconName: "Headphones" as IconName,
                    name: "Audio Equipment",
                    description: "For professional audio editing",
                },
            ],
        },
        services: {
            title: "Editing Services",
            subtitle: "Complete solutions for your content",
            items: [
                {
                    iconName: "Scissors" as IconName,
                    title: "Complete Editing",
                    description:
                        "Professional editing of your content with dynamic cuts, smooth transitions and proper pacing.",
                    features: [
                        "Dynamic and precise cuts",
                        "Custom transitions",
                        "Pacing optimization",
                    ],
                },
                {
                    iconName: "MonitorPlay" as IconName,
                    title: "Motion Graphics",
                    description:
                        "Animations and visual effects to make your content more professional and attractive.",
                    features: [
                        "Custom animations",
                        "Lower thirds and titles",
                        "Visual effects",
                    ],
                },
                {
                    iconName: "FileVideo2" as IconName,
                    title: "Complete Package",
                    description:
                        "Complete solution including editing, motion graphics, color grading and sound design.",
                    features: [
                        "Professional editing",
                        "Motion graphics and VFX",
                        "Color grading and sound design",
                    ],
                },
            ],
        },
        testimonials: {
            title: "Client Feedback",
            subtitle: "What they say about my work",
            items: [
                {
                    rating: 5,
                    content:
                        "Excellent work! Exceeded my expectations with the quality of editing and custom animations.",
                    name: "Carlos Silva",
                    role: "Tech YouTuber",
                },
                {
                    rating: 5,
                    content:
                        "Amazing professional! Delivered ahead of schedule and with exceptional quality. Highly recommend!",
                    name: "Ana Costa",
                    role: "Content Creator",
                },
            ],
        },
        pricing: {
            title: "Editing Packages",
            subtitle: "Choose the best plan for your content",
            plans: [
                {
                    name: "Basic",
                    basePrice: 150,
                    description: "Professional editing for simple videos",
                    features: [
                        "Basic video editing",
                        "Cuts and transitions",
                        "Basic audio adjustments",
                        "Up to 10 minutes of video",
                        "2 revisions included",
                    ],
                },
                {
                    name: "Professional",
                    basePrice: 300,
                    description: "Complete editing with motion graphics",
                    features: [
                        "Everything in Basic",
                        "Custom motion graphics",
                        "Color grading",
                        "Sound design",
                        "Up to 20 minutes of video",
                        "3 revisions included",
                    ],
                    popular: true,
                },
                {
                    name: "Premium",
                    basePrice: 500,
                    description: "Complete package for special projects",
                    features: [
                        "Everything in Professional",
                        "Advanced VFX",
                        "3D animations",
                        "Content consulting",
                        "Up to 30 minutes of video",
                        "Unlimited revisions",
                    ],
                },
            ],
            note: "* All packages include delivery within 5 business days. Rush projects may have additional fee.",
        },
        requirements: {
            title: "Requirements",
            subtitle: "What we look for in our editors",
            items: [
                {
                    title: "Willingness to Learn",
                    description:
                        "Disposition to constantly learn and evolve through tutorials and practice",
                    iconName: "GraduationCap",
                    features: [
                        "Self-learn through tutorials",
                        "Practice consistently",
                        "Accept feedback and improve",
                    ],
                },
                {
                    title: "Technical Skills",
                    description:
                        "Basic familiarity or willingness to learn the tools",
                    iconName: "MonitorPlay",
                    features: [
                        "Basic editing knowledge",
                        "Interest in motion graphics",
                        "Willingness to learn audio",
                    ],
                },
                {
                    title: "Soft Skills",
                    description: "Essential skills to work in our team",
                    iconName: "Users",
                    features: [
                        "Clear communication",
                        "Organization and punctuality",
                        "Trabalho em equipe",
                    ],
                },
            ],
        },
        benefits: {
            title: "Benefits",
            subtitle: "Earn 100% of your work's monetization",
            description:
                "You receive 100% of the video or shorts monetization value on YouTube during the first month after posting.",
            items: [
                {
                    title: "YouTube Monetization",
                    description: "100% of value for 30 days",
                    iconName: "Youtube" as IconName,
                },
                {
                    title: "Period",
                    description: "First month after posting",
                    iconName: "Clock" as IconName,
                },
                {
                    title: "Content Types",
                    description: "Videos and Shorts",
                    iconName: "Video" as IconName,
                },
            ],
        },
        cta: {
            title: "Ready to Join Our Team?",
            description: "Send your portfolio and resume to get started",
            button: "Submit Application",
        },
    }
}
