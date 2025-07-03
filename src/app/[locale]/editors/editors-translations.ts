import { Locale } from "@/lib/i18n"
import {
    SiAdobeaftereffects,
    SiAdobephotoshop,
    SiAdobepremierepro,
} from "@icons-pack/react-simple-icons"
import {
    Code2,
    FileVideo2,
    Headphones,
    MonitorPlay,
    Music2,
    Scissors,
    Settings2,
    Video,
    Wand2,
} from "lucide-react"

export const getEditorsTranslations = (locale: Locale) => {
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
                ? "🎬 Edição Profissional de Vídeos"
                : "🎬 Professional Video Editing",
            title: isPortuguese
                ? "Edição de Alta Qualidade para Seu Conteúdo"
                : "High Quality Editing for Your Content",
            subtitle: isPortuguese
                ? "Transforme suas ideias em vídeos profissionais. Edição completa com motion graphics, sound design e color grading."
                : "Transform your ideas into professional videos. Complete editing with motion graphics, sound design and color grading.",
            cta: isPortuguese ? "Solicitar Orçamento" : "Request Quote",
            stats: [
                {
                    number: "500+",
                    label: isPortuguese ? "Vídeos editados" : "Videos edited",
                },
                {
                    number: "10+",
                    label: isPortuguese
                        ? "Anos de experiência"
                        : "Years of experience",
                },
                {
                    number: "100%",
                    label: isPortuguese
                        ? "Satisfação garantida"
                        : "Satisfaction guaranteed",
                },
            ],
        },
        about: {
            title: isPortuguese ? "Por Que Me Escolher?" : "Why Choose Me?",
            description: isPortuguese
                ? "Editor profissional com experiência em múltiplos formatos"
                : "Professional editor with experience in multiple formats",
            intro: isPortuguese
                ? "Com mais de 10 anos de experiência em edição de vídeos, ofereço um serviço completo que vai além do básico. Minha expertise inclui motion graphics, sound design, color grading e otimização para diferentes plataformas."
                : "With over 10 years of video editing experience, I offer a complete service that goes beyond the basics. My expertise includes motion graphics, sound design, color grading and optimization for different platforms.",
            experience: isPortuguese
                ? "Trabalho com diversos formatos de conteúdo, desde vídeos para YouTube e redes sociais até projetos corporativos e publicitários. Minha abordagem é focada em qualidade e atenção aos detalhes."
                : "I work with various content formats, from YouTube and social media videos to corporate and advertising projects. My approach is focused on quality and attention to detail.",
            passion: isPortuguese
                ? "Além da edição técnica, entendo a importância do storytelling e do engajamento. Cada projeto é tratado de forma única, garantindo que sua mensagem seja transmitida da melhor forma possível."
                : "Beyond technical editing, I understand the importance of storytelling and engagement. Each project is treated uniquely, ensuring your message is conveyed in the best possible way.",
            skills: [
                { icon: Video, name: "Video Editing" },
                { icon: Wand2, name: "Color Grading" },
                { icon: Music2, name: "Sound Design" },
                { icon: MonitorPlay, name: "Motion Graphics" },
                { icon: Settings2, name: "Post-Production" },
                { icon: Code2, name: "Automation" },
            ],
        },
        tools: {
            title: isPortuguese
                ? "Ferramentas Profissionais"
                : "Professional Tools",
            subtitle: isPortuguese
                ? "Software e equipamentos de alta qualidade"
                : "High quality software and equipment",
            items: [
                {
                    icon: SiAdobepremierepro,
                    name: "Adobe Premiere Pro",
                    description: isPortuguese
                        ? "Edição profissional de vídeo"
                        : "Professional video editing",
                },
                {
                    icon: SiAdobeaftereffects,
                    name: "Adobe After Effects",
                    description: isPortuguese
                        ? "Motion graphics e efeitos visuais"
                        : "Motion graphics and visual effects",
                },
                {
                    icon: SiAdobephotoshop,
                    name: "Adobe Photoshop",
                    description: isPortuguese
                        ? "Edição de imagens e thumbnails"
                        : "Image and thumbnail editing",
                },
                {
                    icon: Headphones,
                    name: "Audio Suite",
                    description: isPortuguese
                        ? "Edição e mixagem de áudio"
                        : "Audio editing and mixing",
                },
            ],
        },
        services: {
            title: isPortuguese ? "Serviços de Edição" : "Editing Services",
            subtitle: isPortuguese
                ? "Soluções completas para seu conteúdo"
                : "Complete solutions for your content",
            items: [
                {
                    icon: Scissors,
                    title: isPortuguese
                        ? "Edição Completa"
                        : "Complete Editing",
                    description: isPortuguese
                        ? "Edição profissional do seu conteúdo com cortes dinâmicos, transições suaves e ritmo adequado."
                        : "Professional editing of your content with dynamic cuts, smooth transitions and proper pacing.",
                    features: [
                        isPortuguese
                            ? "Cortes dinâmicos e precisos"
                            : "Dynamic and precise cuts",
                        isPortuguese
                            ? "Transições personalizadas"
                            : "Custom transitions",
                        isPortuguese
                            ? "Otimização de ritmo"
                            : "Pacing optimization",
                    ],
                },
                {
                    icon: MonitorPlay,
                    title: isPortuguese ? "Motion Graphics" : "Motion Graphics",
                    description: isPortuguese
                        ? "Animações e efeitos visuais para deixar seu conteúdo mais profissional e atraente."
                        : "Animations and visual effects to make your content more professional and attractive.",
                    features: [
                        isPortuguese
                            ? "Animações personalizadas"
                            : "Custom animations",
                        isPortuguese
                            ? "Lower thirds e títulos"
                            : "Lower thirds and titles",
                        isPortuguese ? "Efeitos visuais" : "Visual effects",
                    ],
                },
                {
                    icon: FileVideo2,
                    title: isPortuguese
                        ? "Pacote Completo"
                        : "Complete Package",
                    description: isPortuguese
                        ? "Solução completa incluindo edição, motion graphics, color grading e sound design."
                        : "Complete solution including editing, motion graphics, color grading and sound design.",
                    features: [
                        isPortuguese
                            ? "Edição profissional"
                            : "Professional editing",
                        isPortuguese
                            ? "Motion graphics e VFX"
                            : "Motion graphics and VFX",
                        isPortuguese
                            ? "Color grading e sound design"
                            : "Color grading and sound design",
                    ],
                },
            ],
        },
        testimonials: {
            title: isPortuguese ? "Feedback dos Clientes" : "Client Feedback",
            subtitle: isPortuguese
                ? "O que dizem sobre meu trabalho"
                : "What they say about my work",
            items: [
                {
                    rating: 5,
                    content: isPortuguese
                        ? "Excelente trabalho! Superou minhas expectativas com a qualidade da edição e as animações personalizadas."
                        : "Excellent work! Exceeded my expectations with the quality of editing and custom animations.",
                    name: "Carlos Silva",
                    role: isPortuguese ? "YouTuber Tech" : "Tech YouTuber",
                },
                {
                    rating: 5,
                    content: isPortuguese
                        ? "Profissional incrível! Entregou antes do prazo e com qualidade excepcional. Recomendo muito!"
                        : "Amazing professional! Delivered ahead of schedule and with exceptional quality. Highly recommend!",
                    name: "Ana Costa",
                    role: isPortuguese
                        ? "Criadora de Conteúdo"
                        : "Content Creator",
                },
            ],
        },
        pricing: {
            title: isPortuguese ? "Pacotes de Edição" : "Editing Packages",
            subtitle: isPortuguese
                ? "Escolha o melhor plano para seu conteúdo"
                : "Choose the best plan for your content",
            plans: [
                {
                    name: isPortuguese ? "Básico" : "Basic",
                    basePrice: 150,
                    description: isPortuguese
                        ? "Edição profissional para vídeos simples"
                        : "Professional editing for simple videos",
                    features: [
                        isPortuguese
                            ? "Edição básica de vídeo"
                            : "Basic video editing",
                        isPortuguese
                            ? "Cortes e transições"
                            : "Cuts and transitions",
                        isPortuguese
                            ? "Ajustes de áudio básicos"
                            : "Basic audio adjustments",
                        isPortuguese
                            ? "Até 10 minutos de vídeo"
                            : "Up to 10 minutes of video",
                        isPortuguese
                            ? "2 revisões incluídas"
                            : "2 revisions included",
                    ],
                },
                {
                    name: isPortuguese ? "Profissional" : "Professional",
                    basePrice: 300,
                    description: isPortuguese
                        ? "Edição completa com motion graphics"
                        : "Complete editing with motion graphics",
                    features: [
                        isPortuguese
                            ? "Tudo do plano Básico"
                            : "Everything in Basic",
                        isPortuguese
                            ? "Motion graphics personalizados"
                            : "Custom motion graphics",
                        isPortuguese ? "Color grading" : "Color grading",
                        isPortuguese ? "Sound design" : "Sound design",
                        isPortuguese
                            ? "Até 20 minutos de vídeo"
                            : "Up to 20 minutes of video",
                        isPortuguese
                            ? "3 revisões incluídas"
                            : "3 revisions included",
                    ],
                    popular: true,
                },
                {
                    name: isPortuguese ? "Premium" : "Premium",
                    basePrice: 500,
                    description: isPortuguese
                        ? "Pacote completo para projetos especiais"
                        : "Complete package for special projects",
                    features: [
                        isPortuguese
                            ? "Tudo do plano Profissional"
                            : "Everything in Professional",
                        isPortuguese ? "VFX avançados" : "Advanced VFX",
                        isPortuguese ? "Animações 3D" : "3D animations",
                        isPortuguese
                            ? "Consultoria de conteúdo"
                            : "Content consulting",
                        isPortuguese
                            ? "Até 30 minutos de vídeo"
                            : "Up to 30 minutes of video",
                        isPortuguese
                            ? "Revisões ilimitadas"
                            : "Unlimited revisions",
                    ],
                },
            ],
            note: isPortuguese
                ? "* Todos os pacotes incluem entrega em até 5 dias úteis. Projetos urgentes podem ter taxa adicional."
                : "* All packages include delivery within 5 business days. Rush projects may have additional fee.",
        },
    }
}
