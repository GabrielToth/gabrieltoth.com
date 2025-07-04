import { type Locale } from "@/lib/i18n"

const getTranslations = (locale: Locale) => {
    const isPortuguese = locale === "pt-BR"
    return {
        title: isPortuguese ? "Sobre Mim" : "About Me",
        description: isPortuguese
            ? "Desenvolvedor apaixonado por tecnologia e inovação"
            : "Developer passionate about technology and innovation",
        intro: isPortuguese
            ? "Olá! Sou Gabriel Toth Gonçalves, cientista de dados pleno e desenvolvedor Full Stack brasileiro. Formado em Ciência da Computação com especialização em Ciência de Dados, atualmente trabalho no projeto social-analytics-engine, realizando análises avançadas de campanhas digitais e métricas de conversão."
            : "Hello! I'm Gabriel Toth Gonçalves, data scientist II and Full Stack developer from Brazil. With a Computer Science degree and specialization in Data Science, I currently work on the social-analytics-engine project, performing advanced digital campaign analysis and conversion metrics.",
        experience: isPortuguese
            ? "Meu trabalho atualmente envolve a integração de dados do Google Analytics com métricas de redes sociais (YouTube, Instagram, X, Telegram) e análise de conversões Stripe usando Python, PostgreSQL, SQLAlchemy e Docker. Também desenvolvo soluções web, tendo criado sites como softclever.com.br (React) e sistemasatfiscal.com.br (Angular), utilizando tecnologias modernas."
            : "My current work involves integrating Google Analytics data with social media metrics (YouTube, Instagram, X, Telegram) and Stripe conversion analysis using Python, PostgreSQL, SQLAlchemy, and Docker. I also develop enterprise web solutions, having created sites like softclever.com.br (React) and sistemasatfiscal.com.br (Angular), using modern technologies.",
        passion: isPortuguese
            ? "Além da análise e ciência de dados, gerencio canais como o canal WaveIGL com mais de 2 milhões de visualizações mensais criando conteúdo para diversas redes sociais. Desenvolvi o ViraTrend, um serviço especializado em consultoria de crescimento digital para criadores de conteúdo. Tenho paixão por transformar dados em insights acionáveis e usar machine learning para otimizar campanhas digitais e experiências do usuário."
            : "Beyond data analysis and science, I manage channels like the WaveIGL channel with over 2 million monthly views and create content on social media. I developed ViraTrend, a specialized service for digital growth consulting for content creators. I'm passionate about transforming data into actionable insights and using machine learning to optimize digital campaigns and user experiences.",
        skills: {
            title: isPortuguese ? "Principais Habilidades" : "Core Skills",
            dataScience: {
                title: isPortuguese ? "Ciência de Dados" : "Data Science",
                items: [
                    "Python",
                    "PostgreSQL",
                    "SQLAlchemy",
                    "Google APIs",
                    "Power BI",
                    "pytest",
                ],
            },
            frontend: {
                title: "Frontend",
                items: [
                    "React",
                    "Next.js",
                    "TypeScript",
                    "Tailwind CSS",
                    "JavaScript",
                    "Angular",
                ],
            },
            backend: {
                title: "Backend",
                items: ["Node.js", "Python", "PostgreSQL", "REST APIs"],
            },
            tools: {
                title: isPortuguese ? "Ferramentas" : "Tools",
                items: [
                    "Git",
                    "Docker",
                    "Stripe API",
                    "Vercel",
                    "Social Media APIs",
                    "Figma",
                    "Cypress",
                ],
            },
        },
        location: isPortuguese ? "📍 Brasil" : "📍 Brazil",
        interests: isPortuguese
            ? "Quando não estou codando, você pode me encontrar criando conteúdo educacional, explorando novas tecnologias ou jogando Minecraft (sim, tenho até um plugin próprio!)."
            : "When I'm not coding, you can find me creating educational content, exploring new technologies, or playing Minecraft (yes, I even have my own plugin!).",
    }
}

interface AboutSectionProps {
    params: { locale: Locale }
}

export default function AboutSection({
    params: { locale },
}: AboutSectionProps) {
    const t = getTranslations(locale)

    return (
        <section id="about" className="py-24 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {t.title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        {t.description}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Content */}
                    <div className="space-y-6">
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                                {t.intro}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                                {t.experience}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                                {t.passion}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {t.interests}
                            </p>
                        </div>

                        <div className="flex items-center space-x-4 pt-4">
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {t.location}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600 dark:text-gray-300">
                                Data Scientist & Full Stack Developer
                            </span>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                            {t.skills.title}
                        </h3>

                        <div className="space-y-8">
                            {/* Data Science */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {t.skills.dataScience.title}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {t.skills.dataScience.items.map(skill => (
                                        <span
                                            key={skill}
                                            className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Frontend */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {t.skills.frontend.title}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {t.skills.frontend.items.map(skill => (
                                        <span
                                            key={skill}
                                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Backend */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {t.skills.backend.title}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {t.skills.backend.items.map(skill => (
                                        <span
                                            key={skill}
                                            className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Tools */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    {t.skills.tools.title}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {t.skills.tools.items.map(skill => (
                                        <span
                                            key={skill}
                                            className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
