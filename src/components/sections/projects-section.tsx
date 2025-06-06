import { type Locale } from "@/lib/i18n"
import { ExternalLink, Github, Star } from "lucide-react"

interface ProjectsSectionProps {
    locale: Locale
}

const getTranslations = (locale: Locale) => {
    const isPortuguese = locale === "pt-BR"
    return {
        title: isPortuguese ? "Projetos" : "Projects",
        description: isPortuguese
            ? "Alguns dos projetos que desenvolvi e contribuí"
            : "Some of the projects I've developed and contributed to",
        viewCode: isPortuguese ? "Ver Código" : "View Code",
        liveDemo: isPortuguese ? "Demo" : "Live Demo",
        projects: [
            {
                title: "Social Analytics Engine",
                description: isPortuguese
                    ? "Sistema de análise de campanhas digitais que integra Google Analytics com métricas de redes sociais (YouTube, Instagram, X, Telegram) e conversões Stripe. Desenvolvido com Python, PostgreSQL, SQLAlchemy e Docker."
                    : "Digital campaign analysis system that integrates Google Analytics with social media metrics (YouTube, Instagram, X, Telegram) and Stripe conversions. Built with Python, PostgreSQL, SQLAlchemy, and Docker.",
                tech: [
                    "Python",
                    "PostgreSQL",
                    "SQLAlchemy",
                    "Docker",
                    "Google APIs",
                    "Stripe API",
                ],
                github: undefined,
                demo: undefined,
                featured: true,
            },
            {
                title: "Soft Clever - Software ERP",
                description: isPortuguese
                    ? "Site institucional principal da Soft Clever, empresa de software empresarial com mais de 31 anos de experiência e 12.000+ usuários. Desenvolvido com design moderno e responsivo, destacando soluções ERP, SAT e NFC-e."
                    : "Main corporate website for Soft Clever, an enterprise software company with over 31 years of experience and 12,000+ users. Developed with modern responsive design, showcasing ERP, SAT, and NFC-e solutions.",
                tech: [
                    "WordPress",
                    "PHP",
                    "CSS",
                    "JavaScript",
                    "Responsive Design",
                ],
                github: undefined,
                demo: "https://softclever.com.br",
                featured: true,
            },
            {
                title: "Gabriel Toth Portfolio",
                description: isPortuguese
                    ? "Meu portfólio pessoal construído com Next.js 15, TypeScript e Tailwind CSS. Implementa internacionalização (EN/PT-BR), SEO otimizado e design responsivo."
                    : "My personal portfolio built with Next.js 15, TypeScript, and Tailwind CSS. Features internationalization (EN/PT-BR), optimized SEO, and responsive design.",
                tech: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
                github: "https://github.com/GabrielToth/gabrieltoth.com",
                demo: "https://gabrieltoth.com",
                featured: true,
            },
            {
                title: "Angular V17 Template",
                description: isPortuguese
                    ? "Template Angular 17 que enfatiza práticas de código limpo e desenvolvimento amigável para testes. Com 61 estrelas no GitHub, é uma base sólida para projetos Angular modernos."
                    : "Angular 17 template that emphasizes clean code practices and test-friendly development. With 61 stars on GitHub, it's a solid foundation for modern Angular projects.",
                tech: ["Angular", "TypeScript", "Jest", "Frontend"],
                github: "https://github.com/GabrielToth/Angular-V17-Template",
                demo: null,
                stars: 61,
                featured: true,
            },
            {
                title: "Sistema SAT Fiscal",
                description: isPortuguese
                    ? "Meu primeiro site empresarial desenvolvido para a Soft Clever, focado em soluções fiscais SAT e NFC-e. Site responsivo com design profissional para apresentar produtos e serviços fiscais."
                    : "My first enterprise website developed for Soft Clever, focused on SAT and NFC-e fiscal solutions. Responsive website with professional design to showcase fiscal products and services.",
                tech: ["WordPress", "PHP", "CSS", "JavaScript"],
                github: undefined,
                demo: "https://www.sistemasatfiscal.com.br",
                featured: false,
            },

            {
                title: "Minecraft Plugin - NoHitDelay",
                description: isPortuguese
                    ? "Plugin para Bukkit/Spigot 1.17.1 que modifica o delay de hit no Minecraft. Demonstra conhecimento em Java e desenvolvimento de plugins para servidores de Minecraft."
                    : "Bukkit/Spigot 1.17.1 plugin that modifies hit delay in Minecraft. Demonstrates knowledge in Java and Minecraft server plugin development.",
                tech: ["Java", "Bukkit", "Spigot", "Minecraft"],
                github: "https://github.com/GabrielToth/Minecraft-Plugin-NoHitDelay",
                demo: undefined,
                featured: false,
            },
        ],
    }
}

export default function ProjectsSection({ locale }: ProjectsSectionProps) {
    const t = getTranslations(locale)

    return (
        <section id="projects" className="py-24 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {t.title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        {t.description}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {t.projects.map(project => (
                        <div
                            key={project.title}
                            className={`bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                                project.featured
                                    ? "lg:col-span-2 xl:col-span-1"
                                    : ""
                            }`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {project.title}
                                </h3>
                                {project.stars && (
                                    <div className="flex items-center text-yellow-500">
                                        <Star
                                            size={16}
                                            className="fill-current"
                                        />
                                        <span className="ml-1 text-sm font-medium">
                                            {project.stars}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                                {project.description}
                            </p>

                            {/* Tech Stack */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {project.tech.map(tech => (
                                    <span
                                        key={tech}
                                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-4">
                                {project.github && (
                                    <a
                                        href={project.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        <Github size={18} />
                                        <span className="text-sm font-medium">
                                            {t.viewCode}
                                        </span>
                                    </a>
                                )}
                                {project.demo && (
                                    <a
                                        href={project.demo}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        <ExternalLink size={18} />
                                        <span className="text-sm font-medium">
                                            {t.liveDemo}
                                        </span>
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* GitHub Link */}
                <div className="text-center mt-12">
                    <a
                        href="https://github.com/GabrielToth"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                        <Github size={20} />
                        <span>
                            {locale === "pt-BR"
                                ? "Ver mais no GitHub"
                                : "View more on GitHub"}
                        </span>
                    </a>
                </div>
            </div>
        </section>
    )
}
