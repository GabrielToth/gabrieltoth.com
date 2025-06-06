"use client"

import { useContactForm } from "@/hooks/use-contact-form"
import { type Locale } from "@/lib/i18n"
import {
    AlertCircle,
    CheckCircle,
    Github,
    Linkedin,
    Loader2,
    Mail,
    MapPin,
    Youtube,
} from "lucide-react"

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
        nameLabel: isPortuguese ? "Nome" : "Name",
        emailLabel: "Email",
        messageLabel: isPortuguese ? "Mensagem" : "Message",
        namePlaceholder: isPortuguese ? "Seu nome completo" : "Your full name",
        emailPlaceholder: isPortuguese ? "seu@email.com" : "your@email.com",
        messagePlaceholder: isPortuguese
            ? "Conte-me sobre seu projeto ou como posso ajudar..."
            : "Tell me about your project or how I can help...",
        sendMessage: isPortuguese ? "Enviar Mensagem" : "Send Message",
        sending: isPortuguese ? "Enviando..." : "Sending...",
        contactInfo: isPortuguese
            ? "Você pode me encontrar nas seguintes plataformas ou usar o formulário ao lado."
            : "You can find me on the following platforms or use the form on the side.",
        emailRequirement: isPortuguese
            ? "* Aceito apenas emails de provedores confiáveis para evitar spam"
            : "* I only accept emails from trusted providers to prevent spam",
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
    const {
        formData,
        status,
        updateField,
        submitForm,
        isValid,
        validateName,
        validateEmailField,
        validateMessage,
    } = useContactForm(locale)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        submitForm()
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
                            {/* Name Field */}
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    {t.nameLabel}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={e =>
                                        updateField("name", e.target.value)
                                    }
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                                        formData.name &&
                                        validateName(formData.name)
                                            ? "border-red-500 dark:border-red-400"
                                            : "border-gray-300 dark:border-gray-600"
                                    }`}
                                    placeholder={t.namePlaceholder}
                                    required
                                />
                                {formData.name &&
                                    validateName(formData.name) && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {validateName(formData.name)}
                                    </p>
                                )}
                            </div>

                            {/* Email Field */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    {t.emailLabel}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={e =>
                                        updateField("email", e.target.value)
                                    }
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                                        formData.email &&
                                        validateEmailField(formData.email)
                                            ? "border-red-500 dark:border-red-400"
                                            : "border-gray-300 dark:border-gray-600"
                                    }`}
                                    placeholder={t.emailPlaceholder}
                                    required
                                />
                                {formData.email &&
                                validateEmailField(formData.email) ? (
                                        <p className="text-red-500 text-xs mt-1">
                                            {validateEmailField(formData.email)}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {t.emailRequirement}
                                        </p>
                                    )}
                            </div>

                            {/* Message Field */}
                            <div>
                                <label
                                    htmlFor="message"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    {t.messageLabel}
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={6}
                                    maxLength={1000}
                                    value={formData.message}
                                    onChange={e =>
                                        updateField("message", e.target.value)
                                    }
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none ${
                                        formData.message &&
                                        validateMessage(formData.message)
                                            ? "border-red-500 dark:border-red-400"
                                            : "border-gray-300 dark:border-gray-600"
                                    }`}
                                    placeholder={t.messagePlaceholder}
                                    required
                                />
                                <div className="flex justify-between items-center mt-1">
                                    <div>
                                        {formData.message &&
                                            validateMessage(
                                                formData.message
                                            ) && (
                                            <p className="text-red-500 text-xs">
                                                {validateMessage(
                                                    formData.message
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formData.message.length}/1000
                                    </p>
                                </div>
                            </div>

                            {/* Honeypot field (hidden anti-spam) */}
                            <div className="hidden">
                                <label htmlFor="website" className="sr-only">
                                    Website (leave blank)
                                </label>
                                <input
                                    type="text"
                                    id="website"
                                    name="website"
                                    value={formData.honeypot || ""}
                                    onChange={e =>
                                        updateField("honeypot", e.target.value)
                                    }
                                    tabIndex={-1}
                                    autoComplete="off"
                                />
                            </div>

                            {/* Status Messages */}
                            {status.message && (
                                <div
                                    className={`flex items-center space-x-2 p-4 rounded-lg ${
                                        status.status === "success"
                                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                                            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                                    }`}
                                >
                                    {status.status === "success" ? (
                                        <CheckCircle className="w-5 h-5" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5" />
                                    )}
                                    <span className="text-sm">
                                        {status.message}
                                    </span>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={
                                    status.status === "loading" || !isValid
                                }
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {status.status === "loading" ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{t.sending}</span>
                                    </>
                                ) : (
                                    <>
                                        <Mail size={20} />
                                        <span>{t.sendMessage}</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}
