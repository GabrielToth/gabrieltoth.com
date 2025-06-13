"use client"

import Header from "@/components/layout/header"
import { useLocale } from "@/hooks/use-locale"
import { type Locale } from "@/lib/i18n"

const getTranslations = (locale: Locale) => {
    const translations = {
        en: {
            title: "Support WaveIGL Community",
            description:
                "Help us continue creating educational content and building tools for the gaming and tech community.",
            statsTitle: "🎮 WaveIGL Community Stats",
            monthlyViews: "Monthly Views",
            communityMembers: "Community Members",
            educationalVideos: "Educational Videos",
            oneTimeTitle: "💝 One-time Donation",
            oneTimeDesc:
                "Support our content creation with a one-time contribution.",
            donateNow: "Donate Now",
            monthlyTitle: "🔄 Monthly Support",
            monthlyDesc:
                "Become a recurring supporter and get exclusive content.",
            subscribe: "Subscribe",
            watchShareTitle: "📺 Watch & Share",
            watchShareDesc:
                "Support us by watching, liking, and sharing our videos.",
            visitChannel: "Visit Channel",
            supportHelpsTitle: "What Your Support Helps With",
            helps: [
                "Creating high-quality educational content",
                "Developing free tools and resources",
                "Hosting community events and giveaways",
                "Improving video production quality",
                "Expanding to new platforms and content types",
                "Supporting other content creators",
            ],
        },
        "pt-BR": {
            title: "Apoie a Comunidade WaveIGL",
            description:
                "Ajude-nos a continuar criando conteúdo educacional e desenvolvendo ferramentas para a comunidade gamer e tech.",
            statsTitle: "🎮 Estatísticas da Comunidade WaveIGL",
            monthlyViews: "Visualizações Mensais",
            communityMembers: "Membros da Comunidade",
            educationalVideos: "Vídeos Educacionais",
            oneTimeTitle: "💝 Doação Única",
            oneTimeDesc:
                "Apoie nossa criação de conteúdo com uma contribuição única.",
            donateNow: "Doar Agora",
            monthlyTitle: "🔄 Apoio Mensal",
            monthlyDesc:
                "Torne-se um apoiador recorrente e receba conteúdo exclusivo.",
            subscribe: "Inscrever-se",
            watchShareTitle: "📺 Assistir e Compartilhar",
            watchShareDesc:
                "Nos apoie assistindo, curtindo e compartilhando nossos vídeos.",
            visitChannel: "Visitar Canal",
            supportHelpsTitle: "Como Seu Apoio Ajuda",
            helps: [
                "Criando conteúdo educacional de alta qualidade",
                "Desenvolvendo ferramentas e recursos gratuitos",
                "Hospedando eventos da comunidade e sorteios",
                "Melhorando a qualidade de produção dos vídeos",
                "Expandindo para novas plataformas e tipos de conteúdo",
                "Apoiando outros criadores de conteúdo",
            ],
        },
    }
    return translations[locale] || translations.en
}

export default function WaveIGLSupportPage() {
    const { locale } = useLocale()
    const t = getTranslations(locale)

    return (
        <>
            <Header />
            <div className="min-h-screen bg-white dark:bg-gray-900 py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                            {t.title}
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            {t.description}
                        </p>
                    </div>

                    <div className="mt-16">
                        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-8 text-white text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">
                                {t.statsTitle}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <div className="text-3xl font-bold">
                                        2M+
                                    </div>
                                    <div>{t.monthlyViews}</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">
                                        50K+
                                    </div>
                                    <div>{t.communityMembers}</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">
                                        500+
                                    </div>
                                    <div>{t.educationalVideos}</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t.oneTimeTitle}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    {t.oneTimeDesc}
                                </p>
                                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                                    {t.donateNow}
                                </button>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t.monthlyTitle}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    {t.monthlyDesc}
                                </p>
                                <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                                    {t.subscribe}
                                </button>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t.watchShareTitle}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    {t.watchShareDesc}
                                </p>
                                <a
                                    href="https://youtube.com/@WaveIGL"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors inline-block"
                                >
                                    {t.visitChannel}
                                </a>
                            </div>
                        </div>

                        <div className="mt-12 bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                                {t.supportHelpsTitle}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ul className="text-gray-600 dark:text-gray-300 space-y-3">
                                    <li>✅ {t.helps[0]}</li>
                                    <li>✅ {t.helps[1]}</li>
                                    <li>✅ {t.helps[2]}</li>
                                </ul>
                                <ul className="text-gray-600 dark:text-gray-300 space-y-3">
                                    <li>✅ {t.helps[3]}</li>
                                    <li>✅ {t.helps[4]}</li>
                                    <li>✅ {t.helps[5]}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
