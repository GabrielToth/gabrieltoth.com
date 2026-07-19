"use client"

import { useLocale } from "@/hooks/use-locale"
import { Code2, ExternalLink } from "lucide-react"
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
        <section id="projects" className="py-24 bg-card dark:bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground dark:text-foreground mb-4">
                        {t("title")}
                    </h2>
                    <p className="text-lg text-muted-foreground dark:text-foreground max-w-2xl mx-auto">
                        {t("description")}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
                    {displayedProjects.map(project => (
                        <div
                            key={project.title}
                            className="bg-muted dark:bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                            <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center text-white font-bold text-lg">
                                {project.title}
                            </div>

                            <div className="p-6">
                                <h3 className="text-xl font-bold text-foreground dark:text-foreground mb-3">
                                    {project.title}
                                </h3>
                                <p className="text-muted-foreground dark:text-foreground mb-4 line-clamp-3">
                                    {project.description}
                                </p>

                                <div className="mb-4">
                                    <p className="text-sm font-medium text-foreground dark:text-foreground mb-2">
                                        {t("technologies")}:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {project.tags.map((tech: string) => (
                                            <span
                                                key={tech}
                                                className="px-2 py-1 bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary rounded text-xs font-medium"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex space-x-3">
                                    <a
                                        href={project.liveUrl}
                                        className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary transition-colors text-sm font-medium"
                                    >
                                        <ExternalLink size={16} />
                                        <span>{t("viewProject")}</span>
                                    </a>
                                    {project.githubUrl && (
                                        <a
                                            href={project.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-2 border border-border dark:border-border text-foreground dark:text-foreground px-4 py-2 rounded-lg hover:bg-muted dark:hover:bg-accent transition-colors text-sm font-medium"
                                        >
                                            <Code2 size={16} />
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
                            className="bg-muted dark:bg-card text-foreground dark:text-foreground px-6 py-3 rounded-lg hover:bg-accent dark:hover:bg-accent transition-colors font-medium"
                        >
                            {showAll ? t("showLess") : t("showMore")}
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}
