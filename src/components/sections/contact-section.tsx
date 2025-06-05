"use client"

import { type Locale } from "@/lib/i18n"
import { Github, Linkedin, Mail, MapPin, Youtube } from "lucide-react"

interface ContactSectionProps {
    locale: Locale
}

const getTranslations = (locale: Locale) => {
    const isPortuguese = locale === "pt-BR"
    return {
        title: isPortuguese ? "Vamos Conversar!" : "Let's Talk!",
        description: isPortuguese
            ? "Estou sempre aberto a novas oportunidades e colaborações. Entre em contato!"
            : "I'm always open to new opportunities and collaborations. Get in touch!",
        getInTouch: isPortuguese ? "Entre em Contato" : "Get in Touch",
        socialTitle: isPortuguese ? "Redes Sociais" : "Social Media",
        locationTitle: isPortuguese ? "Localização" : "Location",
        location: "Brasil",
        emailPlaceholder: isPortuguese ? "Seu email" : "Your email",
        messagePlaceholder: isPortuguese ? "Sua mensagem" : "Your message",
        sendMessage: isPortuguese ? "Enviar Mensagem" : "Send Message",
        contactInfo: isPortuguese
            ? "Você pode me encontrar nas seguintes plataformas ou enviar um email diretamente."
            : "You can find me on the following platforms or send an email directly.",
        socialMedia: [
            {
                name: "LinkedIn",
                url: "https://www.linkedin.com/in/ogabrieltoth/",
                icon: Linkedin,
                color: "text-blue-600 dark:text-blue-400",
                description: isPortuguese
                    ? "Conecte-se comigo"
                    : "Connect with me",
            },
            {
                name: "GitHub",
                url: "https://github.com/GabrielToth",
                icon: Github,
                color: "text-gray-800 dark:text-gray-200",
                description: isPortuguese
                    ? "Veja meus códigos"
                    : "Check my code",
            },
            {
                name: "YouTube",
                url: "https://www.youtube.com/@ogabrieltoth",
                icon: Youtube,
                color: "text-red-600 dark:text-red-400",
                description: isPortuguese
                    ? "Assista meus vídeos"
                    : "Watch my videos",
            },
        ],
    }
}

export default function ContactSection({ locale }: ContactSectionProps) {
    const t = getTranslations(locale)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // For now, we'll redirect to email
        const subject = encodeURIComponent(
            locale === "pt-BR"
                ? "Contato via Portfolio"
                : "Contact from Portfolio"
        )
        window.location.href = `mailto:gabriel@gabrieltoth.com?subject=${subject}`
    }

    return (
        <section id="contact" className="py-24 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {t.title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        {t.description}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                {t.getInTouch}
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                                {t.contactInfo}
                            </p>
                        </div>

                        {/* Location */}
                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {t.locationTitle}
                                </h4>
                                <p className="text-gray-600 dark:text-gray-300">
                                    {t.location}
                                </p>
                            </div>
                        </div>

                        {/* Social Media */}
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                {t.socialTitle}
                            </h4>
                            <div className="space-y-4">
                                {t.socialMedia.map(social => (
                                    <a
                                        key={social.name}
                                        href={social.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-900 rounded-lg hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                                    >
                                        <div
                                            className={
                                                "p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                                            }
                                        >
                                            <social.icon
                                                className={`w-5 h-5 ${social.color}`}
                                            />
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-gray-900 dark:text-white">
                                                {social.name}
                                            </h5>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                {social.description}
                                            </p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            {t.sendMessage}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="sr-only">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                    placeholder={t.emailPlaceholder}
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="sr-only">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={6}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                                    placeholder={t.messagePlaceholder}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                            >
                                <Mail size={20} />
                                <span>{t.sendMessage}</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}
