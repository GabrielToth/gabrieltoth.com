import { type Locale } from "@/lib/i18n"

interface AboutSectionProps {
    locale: Locale
}

const getTranslations = (locale: Locale) => {
    const isPortuguese = locale === "pt-BR"
    return {
        title: isPortuguese ? "Sobre Mim" : "About Me",
        description: isPortuguese
            ? "Desenvolvedor apaixonado por tecnologia e inovação"
            : "Developer passionate about technology and innovation",
        intro: isPortuguese
            ? "Olá! Sou Gabriel Toth Gonçalves, um desenvolvedor Full Stack brasileiro apaixonado por criar soluções digitais inovadoras. Minha jornada na programação começou com curiosidade e evoluiu para uma carreira dedicada a transformar ideias em realidade através do código."
            : "Hello! I'm Gabriel Toth Gonçalves, a Brazilian Full Stack developer passionate about creating innovative digital solutions. My programming journey began with curiosity and evolved into a career dedicated to transforming ideas into reality through code.",
        experience: isPortuguese
            ? "Tenho experiência sólida em desenvolvimento web moderno, trabalhando com tecnologias como React, Next.js, TypeScript, Node.js e Python. Além de programar, sou criador de conteúdo, compartilhando conhecimento através do meu canal no YouTube e streams educacionais."
            : "I have solid experience in modern web development, working with technologies like React, Next.js, TypeScript, Node.js, and Python. Beyond programming, I'm a content creator, sharing knowledge through my YouTube channel and educational streams.",
        passion: isPortuguese
            ? "Minha paixão pela tecnologia vai além do código. Acredito no poder da educação e do compartilhamento de conhecimento para construir uma comunidade de desenvolvedores mais forte e inclusiva. Sempre busco aprender novas tecnologias e compartilhar o que aprendo."
            : "My passion for technology goes beyond code. I believe in the power of education and knowledge sharing to build a stronger and more inclusive developer community. I'm always looking to learn new technologies and share what I learn.",
        skills: {
            title: isPortuguese ? "Principais Habilidades" : "Core Skills",
            frontend: {
                title: "Frontend",
                items: [
                    "React",
                    "Next.js",
                    "TypeScript",
                    "Tailwind CSS",
                    "JavaScript",
                ],
            },
            backend: {
                title: "Backend",
                items: [
                    "Node.js",
                    "Python",
                    "PostgreSQL",
                    "MongoDB",
                    "REST APIs",
                ],
            },
            tools: {
                title: isPortuguese ? "Ferramentas" : "Tools",
                items: ["Git", "Docker", "AWS", "Vercel", "GitHub Actions"],
            },
        },
        location: isPortuguese ? "📍 Brasil" : "📍 Brazil",
        interests: isPortuguese
            ? "Quando não estou codando, você pode me encontrar criando conteúdo educacional, explorando novas tecnologias ou jogando Minecraft (sim, tenho até um plugin próprio!)."
            : "When I'm not coding, you can find me creating educational content, exploring new technologies, or playing Minecraft (yes, I even have my own plugin!).",
    }
}

export default function AboutSection({ locale }: AboutSectionProps) {
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
                                Full Stack Developer
                            </span>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                            {t.skills.title}
                        </h3>

                        <div className="space-y-8">
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
