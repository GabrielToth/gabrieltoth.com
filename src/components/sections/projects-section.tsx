"use client"

import { useLocale } from "@/hooks/use-locale"
import { type Locale } from "@/lib/i18n"
import { ExternalLink, Github } from "lucide-react"
import { useState } from "react"

const getTranslations = (locale: Locale) => {
    const isPortuguese = locale === "pt-BR"
    return {
        title: isPortuguese ? "Projetos" : "Projects",
        description: isPortuguese
            ? "Alguns dos projetos que desenvolvi usando tecnologias modernas"
            : "Some of the projects I've developed using modern technologies",
        viewProject: isPortuguese ? "Ver Projeto" : "View Project",
        sourceCode: isPortuguese ? "Código Fonte" : "Source Code",
        technologies: isPortuguese ? "Tecnologias" : "Technologies",
        showMore: isPortuguese ? "Ver Mais" : "Show More",
        showLess: isPortuguese ? "Ver Menos" : "Show Less",
        projects: [
            {
                title: "Sistema SAT Fiscal - Website",
                description: isPortuguese
                    ? "Website institucional para empresa especializada em soluções fiscais e contábeis. Desenvolvido com foco em apresentar serviços fiscais, gestão tributária e soluções empresariais de forma clara e profissional."
                    : "Institutional website for company specialized in fiscal and accounting solutions. Developed with focus on presenting fiscal services, tax management and business solutions in a clear and professional way.",
                image: "/projects/sat-fiscal.jpg",
                tags: ["HTML", "CSS", "JavaScript", "SEO", "Design"],
                liveUrl: "https://sistemasatfiscal.com.br",
                featured: true,
            },
            {
                title: "Softclever - Website",
                description: isPortuguese
                    ? "Site empresarial desenvolvido em React para empresa de software, com design moderno e responsivo. Implementa seções para serviços, portfólio e contato, utilizando tecnologias como React, CSS moderno e otimizações de SEO."
                    : "Corporate website developed in React for software company, with modern and responsive design. Implements sections for services, portfolio and contact, using technologies like React, modern CSS and SEO optimizations.",
                image: "/projects/softclever.jpg",
                tags: ["React", "CSS", "JavaScript", "SEO"],
                liveUrl: "https://softclever.com.br",
                githubUrl: "https://github.com/gabrieltoth/softclever",
            },
            {
                title: "WaveIGL Project",
                description: isPortuguese
                    ? "Projeto educacional completo incluindo canal no YouTube com mais de 2 milhões de visualizações mensais, sistema de pagamentos integrado para investimentos e gestão de canais. Inclui criação de conteúdo sobre tecnologia, programação e desenvolvimento de games."
                    : "Complete educational project including YouTube channel with over 2 million monthly views, integrated payment system for investments and channel management. Includes content creation about technology, programming and game development.",
                image: "/projects/waveigl.jpg",
                tags: [
                    "YouTube",
                    "Content Creation",
                    "Payment Integration",
                    "Next.js",
                    "Stripe",
                    "PIX",
                ],
                liveUrl: `/${locale}/waveigl-support`,
            },

            {
                title: "PC Optimization Service",
                description: isPortuguese
                    ? "Serviço especializado de otimização de PCs para gaming, com foco em maximizar performance em jogos e reduzir latência. Inclui configurações avançadas de sistema, otimização de hardware e software personalizado."
                    : "Specialized PC optimization service for gaming, focused on maximizing game performance and reducing latency. Includes advanced system configurations, hardware optimization and custom software.",
                image: "/projects/pc-optimization.jpg",
                tags: ["Windows", "Gaming", "Performance", "Hardware"],
                liveUrl: `/${locale}/pc-optimization`,
            },
        ],
    }
}

export default function ProjectsSection() {
    const { locale } = useLocale()
    const [showAll, setShowAll] = useState(false)
    const t = getTranslations(locale)

    const displayedProjects = showAll ? t.projects : t.projects.slice(0, 3)

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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayedProjects.map(project => (
                        <div
                            key={project.title}
                            className={`bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                                project.featured
                                    ? "md:col-span-2 lg:col-span-2"
                                    : ""
                            }`}
                        >
                            <div
                                className={`w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ${
                                    project.featured ? "h-48" : "h-32"
                                }`}
                            >
                                {project.title}
                            </div>

                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                    {project.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                                    {project.description}
                                </p>

                                <div className="mb-4">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                        {t.technologies}:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {project.tags.map(tech => (
                                            <span
                                                key={tech}
                                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex space-x-3">
                                    <a
                                        href={project.liveUrl}
                                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                        <ExternalLink size={16} />
                                        <span>{t.viewProject}</span>
                                    </a>
                                    {project.githubUrl && (
                                        <a
                                            href={project.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                                        >
                                            <Github size={16} />
                                            <span>{t.sourceCode}</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {t.projects.length > 3 && (
                    <div className="text-center mt-12">
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                        >
                            {showAll ? t.showLess : t.showMore}
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}
