"use client"

import { type Locale } from "@/lib/i18n"
import {
    CheckCircle,
    Coffee,
    Crown,
    Gamepad2,
    Gift,
    Globe,
    Heart,
    Sparkles,
    Star,
    Users,
    Youtube,
    Zap,
} from "lucide-react"

interface WaveIGLSupportLandingProps {
    locale: Locale
}

const getTranslations = (locale: Locale) => {
    const isPortuguese = locale === "pt-BR"
    return {
        hero: {
            badge: isPortuguese
                ? "💜 Apoie a Comunidade"
                : "💜 Support the Community",
            title: isPortuguese
                ? "Construa Conosco o Futuro da Comunidade WaveIGL"
                : "Build the Future of WaveIGL Community With Us",
            subtitle: isPortuguese
                ? "Suas doações financiam o desenvolvimento de plataformas, ferramentas e recursos para nossa comunidade de mais de 2 milhões de espectadores mensais."
                : "Your donations fund the development of platforms, tools and resources for our community of over 2 million monthly viewers.",
            cta: isPortuguese ? "Apoiar Agora" : "Support Now",
            stats: [
                {
                    number: "2M+",
                    label: isPortuguese
                        ? "Visualizações mensais"
                        : "Monthly views",
                },
                {
                    number: "150K+",
                    label: isPortuguese
                        ? "Membros da comunidade"
                        : "Community members",
                },
                {
                    number: "5+",
                    label: isPortuguese
                        ? "Anos construindo conteúdo"
                        : "Years building content",
                },
            ],
        },
        mission: {
            title: isPortuguese
                ? "Nossa Missão: Mais que Entretenimento"
                : "Our Mission: More Than Entertainment",
            subtitle: isPortuguese
                ? "WaveIGL não é apenas um canal - é um ecossistema"
                : "WaveIGL isn't just a channel - it's an ecosystem",
            points: [
                {
                    icon: Users,
                    title: isPortuguese
                        ? "Comunidade Unida"
                        : "United Community",
                    description: isPortuguese
                        ? "Criamos um espaço onde gamers, streamers e criadores se conectam e crescem juntos"
                        : "We create a space where gamers, streamers and creators connect and grow together",
                },
                {
                    icon: Youtube,
                    title: isPortuguese
                        ? "Conteúdo Educativo"
                        : "Educational Content",
                    description: isPortuguese
                        ? "Produzimos tutoriais, análises e conteúdo que realmente agrega valor à comunidade gaming"
                        : "We produce tutorials, analysis and content that truly adds value to the gaming community",
                },
                {
                    icon: Gamepad2,
                    title: isPortuguese
                        ? "Inovação Gaming"
                        : "Gaming Innovation",
                    description: isPortuguese
                        ? "Desenvolvemos ferramentas e recursos para melhorar a experiência de todos os gamers"
                        : "We develop tools and resources to improve the experience of all gamers",
                },
                {
                    icon: Globe,
                    title: isPortuguese ? "Impacto Global" : "Global Impact",
                    description: isPortuguese
                        ? "Nossa influência vai além do Brasil, inspirando criadores ao redor do mundo"
                        : "Our influence goes beyond Brazil, inspiring creators around the world",
                },
            ],
        },
        projects: {
            title: isPortuguese
                ? "Projetos que Suas Doações Financiam"
                : "Projects Your Donations Fund",
            subtitle: isPortuguese
                ? "Cada contribuição nos ajuda a construir algo maior"
                : "Every contribution helps us build something bigger",
            list: [
                {
                    icon: Globe,
                    title: isPortuguese
                        ? "Plataforma WaveIGL Hub"
                        : "WaveIGL Hub Platform",
                    description: isPortuguese
                        ? "Portal central da comunidade com fóruns, recursos, tutoriais e ferramentas exclusivas para membros"
                        : "Central community portal with forums, resources, tutorials and exclusive tools for members",
                    progress: 35,
                    budget: "R$ 15.000",
                    status: isPortuguese
                        ? "Em desenvolvimento"
                        : "In development",
                },
                {
                    icon: Gamepad2,
                    title: isPortuguese
                        ? "Ferramentas para Criadores"
                        : "Creator Tools",
                    description: isPortuguese
                        ? "Suite de ferramentas para otimização de streams, análise de performance e crescimento de canal"
                        : "Suite of tools for stream optimization, performance analysis and channel growth",
                    progress: 60,
                    budget: "R$ 25.000",
                    status: isPortuguese ? "Beta testing" : "Beta testing",
                },
                {
                    icon: Users,
                    title: isPortuguese
                        ? "Eventos da Comunidade"
                        : "Community Events",
                    description: isPortuguese
                        ? "Torneios, meetups virtuais, workshops e eventos especiais para fortalecer nossa comunidade"
                        : "Tournaments, virtual meetups, workshops and special events to strengthen our community",
                    progress: 80,
                    budget: "R$ 10.000",
                    status: isPortuguese ? "Ativo" : "Active",
                },
                {
                    icon: Star,
                    title: isPortuguese
                        ? "Programa de Mentoria"
                        : "Mentorship Program",
                    description: isPortuguese
                        ? "Conectamos novos criadores com veteranos para acelerar o crescimento e compartilhar conhecimento"
                        : "We connect new creators with veterans to accelerate growth and share knowledge",
                    progress: 20,
                    budget: "R$ 8.000",
                    status: isPortuguese ? "Planejado" : "Planned",
                },
            ],
        },
        impact: {
            title: isPortuguese
                ? "O Impacto das Suas Doações"
                : "The Impact of Your Donations",
            subtitle: isPortuguese
                ? "Veja como cada contribuição faz a diferença"
                : "See how each contribution makes a difference",
            tiers: [
                {
                    amount: "R$ 10",
                    title: isPortuguese ? "Apoiador" : "Supporter",
                    icon: Coffee,
                    description: isPortuguese
                        ? "Compra um café para a equipe durante as madrugadas de desenvolvimento"
                        : "Buys a coffee for the team during development all-nighters",
                    impact: isPortuguese
                        ? "Financia 1 hora de desenvolvimento"
                        : "Funds 1 hour of development",
                },
                {
                    amount: "R$ 50",
                    title: isPortuguese ? "Contribuidor" : "Contributor",
                    icon: Zap,
                    description: isPortuguese
                        ? "Cobre custos de servidor por uma semana para manter tudo funcionando"
                        : "Covers server costs for a week to keep everything running",
                    impact: isPortuguese
                        ? "Mantém a infraestrutura online"
                        : "Keeps infrastructure online",
                },
                {
                    amount: "R$ 150",
                    title: isPortuguese ? "Patrocinador" : "Sponsor",
                    icon: Gift,
                    description: isPortuguese
                        ? "Financia desenvolvimento de uma nova funcionalidade da plataforma"
                        : "Funds development of a new platform feature",
                    impact: isPortuguese
                        ? "Acelera o lançamento de recursos"
                        : "Accelerates feature releases",
                },
                {
                    amount: "R$ 500",
                    title: isPortuguese ? "Guardião" : "Guardian",
                    icon: Crown,
                    description: isPortuguese
                        ? "Garante um mês completo de desenvolvimento focado em melhorias"
                        : "Ensures a full month of development focused on improvements",
                    impact: isPortuguese
                        ? "Impulsiona projetos importantes"
                        : "Drives important projects",
                },
            ],
        },
        transparency: {
            title: isPortuguese
                ? "Transparência Total"
                : "Complete Transparency",
            subtitle: isPortuguese
                ? "Você tem o direito de saber exatamente onde cada centavo é usado"
                : "You have the right to know exactly where every penny is used",
            breakdown: [
                {
                    category: isPortuguese
                        ? "Desenvolvimento de Software"
                        : "Software Development",
                    percentage: 40,
                    amount: "40%",
                    description: isPortuguese
                        ? "Programação, design e testes das plataformas"
                        : "Programming, design and platform testing",
                },
                {
                    category: isPortuguese
                        ? "Infraestrutura e Hosting"
                        : "Infrastructure & Hosting",
                    percentage: 25,
                    amount: "25%",
                    description: isPortuguese
                        ? "Servidores, CDN, banco de dados e segurança"
                        : "Servers, CDN, databases and security",
                },
                {
                    category: isPortuguese
                        ? "Criação de Conteúdo"
                        : "Content Creation",
                    percentage: 20,
                    amount: "20%",
                    description: isPortuguese
                        ? "Equipamentos, software e produção de vídeos"
                        : "Equipment, software and video production",
                },
                {
                    category: isPortuguese
                        ? "Eventos e Comunidade"
                        : "Events & Community",
                    percentage: 15,
                    amount: "15%",
                    description: isPortuguese
                        ? "Torneios, prêmios e atividades comunitárias"
                        : "Tournaments, prizes and community activities",
                },
            ],
            commitment: isPortuguese
                ? "📊 Relatórios mensais de transparência enviados para todos os apoiadores"
                : "📊 Monthly transparency reports sent to all supporters",
        },
        rewards: {
            title: isPortuguese
                ? "Recompensas Exclusivas"
                : "Exclusive Rewards",
            subtitle: isPortuguese
                ? "Nossa forma de agradecer por fazer parte desta jornada"
                : "Our way of thanking you for being part of this journey",
            perks: [
                {
                    tier: isPortuguese
                        ? "Todos os Apoiadores"
                        : "All Supporters",
                    benefits: [
                        isPortuguese
                            ? "Badge exclusivo no Discord"
                            : "Exclusive Discord badge",
                        isPortuguese
                            ? "Acesso antecipado a novos recursos"
                            : "Early access to new features",
                        isPortuguese
                            ? "Relatórios mensais de progresso"
                            : "Monthly progress reports",
                    ],
                },
                {
                    tier: isPortuguese ? "Apoiadores R$50+" : "Supporters $50+",
                    benefits: [
                        isPortuguese
                            ? "Participação em sessões de feedback"
                            : "Participation in feedback sessions",
                        isPortuguese
                            ? "Nome nos créditos dos projetos"
                            : "Name in project credits",
                        isPortuguese
                            ? "Convites para eventos especiais"
                            : "Invitations to special events",
                    ],
                },
                {
                    tier: isPortuguese
                        ? "Apoiadores R$150+"
                        : "Supporters $150+",
                    benefits: [
                        isPortuguese
                            ? "Reunião mensal com a equipe"
                            : "Monthly meeting with the team",
                        isPortuguese
                            ? "Influência direta nas decisões de desenvolvimento"
                            : "Direct influence on development decisions",
                        isPortuguese
                            ? "Acesso VIP ao WaveIGL Hub"
                            : "VIP access to WaveIGL Hub",
                    ],
                },
            ],
        },
        testimonials: {
            title: isPortuguese
                ? "Vozes da Nossa Comunidade"
                : "Voices From Our Community",
            subtitle: isPortuguese
                ? "Veja o que outros membros estão dizendo"
                : "See what other members are saying",
            items: [
                {
                    name: "GameMaster_BR",
                    role: isPortuguese
                        ? "Apoiador há 2 anos"
                        : "Supporter for 2 years",
                    content: isPortuguese
                        ? "WaveIGL mudou minha forma de ver o gaming. A comunidade é incrível e os projetos realmente fazem diferença!"
                        : "WaveIGL changed how I see gaming. The community is incredible and the projects really make a difference!",
                    amount: "R$ 50/mês",
                },
                {
                    name: "StreamerPro",
                    role: isPortuguese
                        ? "Criador de conteúdo"
                        : "Content creator",
                    content: isPortuguese
                        ? "As ferramentas que eles desenvolvem são game-changing. Meu canal cresceu 200% usando os recursos da comunidade!"
                        : "The tools they develop are game-changing. My channel grew 200% using community resources!",
                    amount: "R$ 100/mês",
                },
                {
                    name: "RetroGamer",
                    role: isPortuguese ? "Membro veterano" : "Veteran member",
                    content: isPortuguese
                        ? "É gratificante ver minha contribuição ajudando a construir algo tão especial. WaveIGL é família!"
                        : "It's rewarding to see my contribution helping build something so special. WaveIGL is family!",
                    amount: "R$ 25/mês",
                },
            ],
        },
        cta: {
            title: isPortuguese
                ? "Seja Parte da História"
                : "Be Part of History",
            subtitle: isPortuguese
                ? "Juntos, estamos construindo o futuro da comunidade gaming brasileira"
                : "Together, we're building the future of Brazilian gaming community",
            button: isPortuguese
                ? "Apoiar a Comunidade"
                : "Support the Community",
            oneTime: isPortuguese ? "Doação única" : "One-time donation",
            monthly: isPortuguese ? "Apoio mensal" : "Monthly support",
        },
    }
}

export default function WaveIGLSupportLanding({
    locale,
}: WaveIGLSupportLandingProps) {
    const t = getTranslations(locale)

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Language Selector for Landing Page */}
            <div className="fixed top-4 right-4 z-50">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
                    <select
                        value={locale}
                        onChange={e =>
                            (window.location.href =
                                window.location.pathname +
                                "?lang=" +
                                e.target.value)
                        }
                        className="text-sm border-none bg-transparent focus:outline-none cursor-pointer"
                        aria-label="Select language"
                    >
                        <option value="en">🇺🇸 English</option>
                        <option value="pt-BR">🇧🇷 Português</option>
                    </select>
                </div>
            </div>

            {/* Hero Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-400 text-purple-900 text-sm font-bold mb-8">
                        {t.hero.badge}
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-black mb-6">
                        {t.hero.title}
                    </h1>
                    <p className="text-xl mb-8 max-w-4xl mx-auto opacity-90">
                        {t.hero.subtitle}
                    </p>
                    <a
                        href="#support"
                        className="inline-flex items-center px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-colors text-lg"
                    >
                        <Heart className="mr-3" size={20} />
                        {t.hero.cta}
                    </a>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                        {t.hero.stats.map((stat, index) => (
                            <div
                                key={index}
                                className="text-center bg-white/10 backdrop-blur rounded-lg p-6"
                            >
                                <div className="text-4xl font-black text-purple-300 mb-2">
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

            {/* Mission Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {t.mission.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.mission.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {t.mission.points.map((point, index) => (
                            <div
                                key={index}
                                className="text-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-8"
                            >
                                <point.icon className="w-12 h-12 text-purple-600 mx-auto mb-6" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                    {point.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {point.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Projects Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {t.projects.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.projects.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {t.projects.list.map((project, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-lg"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <project.icon className="w-12 h-12 text-purple-600" />
                                    <span className="text-sm font-semibold text-purple-600 bg-purple-100 dark:bg-purple-900/20 px-3 py-1 rounded-full">
                                        {project.status}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                    {project.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    {project.description}
                                </p>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">
                                            {locale === "pt-BR"
                                                ? "Progresso"
                                                : "Progress"}
                                        </span>
                                        <span className="font-bold text-purple-600">
                                            {project.progress}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                                            style={{
                                                width: `${project.progress}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-green-600">
                                            {project.budget}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                                            {locale === "pt-BR"
                                                ? "necessários"
                                                : "needed"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Impact Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {t.impact.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.impact.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {t.impact.tiers.map((tier, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg border-2 border-transparent hover:border-purple-500 transition-all"
                            >
                                <div className="text-center mb-6">
                                    <tier.icon className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                                    <div className="text-2xl font-black text-purple-600 mb-2">
                                        {tier.amount}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {tier.title}
                                    </h3>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
                                    {tier.description}
                                </p>
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                                        💡 {tier.impact}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Transparency Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-50 dark:bg-blue-900/20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {t.transparency.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.transparency.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        {t.transparency.breakdown.map((item, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-lg"
                            >
                                <div
                                    className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg"
                                    style={{
                                        background: `conic-gradient(#8B5CF6 0% ${item.percentage}%, #E5E7EB ${item.percentage}% 100%)`,
                                    }}
                                >
                                    {item.amount}
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                                    {item.category}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            {t.transparency.commitment}
                        </p>
                    </div>
                </div>
            </section>

            {/* Rewards Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {t.rewards.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.rewards.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {t.rewards.perks.map((perk, index) => (
                            <div
                                key={index}
                                className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-8"
                            >
                                <div className="text-center mb-6">
                                    <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {perk.tier}
                                    </h3>
                                </div>
                                <ul className="space-y-3">
                                    {perk.benefits.map((benefit, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-center text-gray-600 dark:text-gray-300"
                                        >
                                            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {t.testimonials.title}
                        </h2>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            {t.testimonials.subtitle}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {t.testimonials.items.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-lg"
                            >
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">
                                        {testimonial.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {testimonial.role}
                                    </p>
                                    <div className="inline-block bg-purple-100 dark:bg-purple-900/20 text-purple-600 px-3 py-1 rounded-full text-sm font-semibold mt-2">
                                        {testimonial.amount}
                                    </div>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 italic text-center">
                                    {testimonial.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section
                id="support"
                className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white"
            >
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl font-black mb-6">{t.cta.title}</h2>
                    <p className="text-xl mb-12 opacity-90">{t.cta.subtitle}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <a
                            href="#"
                            className="inline-flex items-center justify-center px-8 py-4 bg-white text-purple-600 rounded-lg font-bold hover:bg-gray-100 transition-colors text-lg"
                        >
                            <Gift className="mr-3" size={20} />
                            {t.cta.oneTime}
                        </a>
                        <a
                            href="#"
                            className="inline-flex items-center justify-center px-8 py-4 bg-purple-800 text-white rounded-lg font-bold hover:bg-purple-900 transition-colors text-lg border-2 border-white"
                        >
                            <Heart className="mr-3" size={20} />
                            {t.cta.monthly}
                        </a>
                    </div>

                    <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                        <p className="text-white/80 mb-4">
                            {locale === "pt-BR"
                                ? "🎮 Junte-se a mais de 500 apoiadores que já fazem parte desta jornada!"
                                : "🎮 Join over 500 supporters who are already part of this journey!"}
                        </p>
                        <div className="flex justify-center space-x-6 text-sm">
                            <div>
                                <div className="font-bold text-lg">
                                    R$ 12.450
                                </div>
                                <div className="text-white/70">
                                    {locale === "pt-BR"
                                        ? "Arrecadados"
                                        : "Raised"}
                                </div>
                            </div>
                            <div>
                                <div className="font-bold text-lg">543</div>
                                <div className="text-white/70">
                                    {locale === "pt-BR"
                                        ? "Apoiadores"
                                        : "Supporters"}
                                </div>
                            </div>
                            <div>
                                <div className="font-bold text-lg">
                                    R$ 1.500/mês
                                </div>
                                <div className="text-white/70">
                                    {locale === "pt-BR"
                                        ? "Meta mensal"
                                        : "Monthly goal"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
