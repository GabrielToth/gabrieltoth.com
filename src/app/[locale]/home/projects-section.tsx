"use client"

import { useLocale } from "@/hooks/use-locale"
import { ExternalLink, Github } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

interface ProjectItem {
    title: string
    description: string
    image: string
    tags: string[]
    liveUrl?: string
    githubUrl?: string
    slug?: string
}

export default function ProjectsSection() {
    const { locale } = useLocale()
    const [showAll, setShowAll] = useState(false)
    const t = useTranslations("home.projects")

    const projects: ProjectItem[] = useMemo(() => {
        const items = (t.raw("items") as ProjectItem[]).map(item => ({
            ...item,
            liveUrl: item.slug ? `/${locale}${item.slug}` : item.liveUrl,
        }))
        return items
    }, [t, locale])

    const displayedProjects = showAll ? projects : projects.slice(0, 3)

    return (
        <section id="projects" className="py-24 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {t("title")}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        {t("description")}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
                    {displayedProjects.map(project => (
                        <div
                            key={project.title}
                            className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                            <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
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
                                        {t("technologies")}:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {project.tags.map((tech: string) => (
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
                                        <span>{t("viewProject")}</span>
                                    </a>
                                    {project.githubUrl && (
                                        <a
                                            href={project.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                                        >
                                            <Github size={16} />
                                            <span>{t("sourceCode")}</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {projects.length > 3 && (
                    <div className="text-center mt-12">
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                        >
                            {showAll ? t("showLess") : t("showMore")}
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}
