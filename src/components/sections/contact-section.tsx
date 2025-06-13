"use client"

import { useLocale } from "@/hooks/use-locale"
import { type Locale } from "@/lib/i18n"
import {
    Calendar,
    Clock,
    Download,
    FileText,
    Github,
    Linkedin,
    Mail,
    MessageCircle,
    Youtube,
} from "lucide-react"
import { useState } from "react"

const getTranslations = (locale: Locale) => {
    const isPortuguese = locale === "pt-BR"
    return {
        title: isPortuguese ? "Vamos trabalhar juntos" : "Let's work together",
        subtitle: isPortuguese
            ? "Pronto para transformar suas ideias em realidade digital"
            : "Ready to transform your ideas into digital reality",
        getInTouch: isPortuguese ? "Entre em contato" : "Get in touch",
        email: "Email",
        scheduleCall: isPortuguese ? "Agendar chamada" : "Schedule a call",
        downloadResume: isPortuguese ? "Baixar currículo" : "Download resume",
        followMe: isPortuguese ? "Me siga" : "Follow me",
        services: {
            title: isPortuguese ? "Serviços disponíveis" : "Available services",
            dataScience: isPortuguese ? "Ciência de Dados" : "Data Science",
            webDev: isPortuguese ? "Desenvolvimento Web" : "Web Development",
            consulting: isPortuguese ? "Consultoria Tech" : "Tech Consulting",
            channelManagement: isPortuguese
                ? "Gestão de Canais"
                : "Channel Management",
        },
        availability: {
            title: isPortuguese ? "Disponibilidade" : "Availability",
            status: isPortuguese
                ? "Disponível para novos projetos"
                : "Available for new projects",
            timezone: isPortuguese ? "Fuso horário: UTC-3" : "Timezone: UTC-3",
            response: isPortuguese
                ? "Resposta em até 24h"
                : "Response within 24h",
        },
        contactForm: {
            name: isPortuguese ? "Seu nome" : "Your name",
            email: "Email",
            subject: isPortuguese ? "Assunto" : "Subject",
            message: isPortuguese ? "Mensagem" : "Message",
            send: isPortuguese ? "Enviar mensagem" : "Send message",
            sending: isPortuguese ? "Enviando..." : "Sending...",
            success: isPortuguese
                ? "Mensagem enviada com sucesso!"
                : "Message sent successfully!",
            error: isPortuguese
                ? "Erro ao enviar mensagem. Tente novamente."
                : "Error sending message. Please try again.",
        },
    }
}

export default function ContactSection() {
    const { locale } = useLocale()
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<
        "idle" | "success" | "error"
    >("idle")

    const t = getTranslations(locale)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                setSubmitStatus("success")
                setFormData({ name: "", email: "", subject: "", message: "" })
            } else {
                setSubmitStatus("error")
            }
        } catch (_) {
            setSubmitStatus("error")
        } finally {
            setIsSubmitting(false)
            setTimeout(() => setSubmitStatus("idle"), 5000)
        }
    }

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const downloadResume = () => {
        const resumeFile =
            locale === "pt-BR"
                ? "/resume/Gabriel-Toth-Goncalves-Curriculo-PT.pdf"
                : "/resume/Gabriel-Toth-Goncalves-Resume-EN.pdf"

        const link = document.createElement("a")
        link.href = resumeFile
        link.download = `Gabriel-Toth-Goncalves-${locale === "pt-BR" ? "Curriculo" : "Resume"}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <section id="contact" className="py-24 bg-gray-50 dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {t.title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        {t.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                {t.getInTouch}
                            </h3>

                            <div className="space-y-4">
                                <a
                                    href="mailto:contato@gabrieltoth.com"
                                    className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Mail size={20} />
                                    <span>contato@gabrieltoth.com</span>
                                </a>

                                <a
                                    href="https://calendly.com/gabrieltoth"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Calendar size={20} />
                                    <span>{t.scheduleCall}</span>
                                </a>

                                <button
                                    onClick={downloadResume}
                                    className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Download size={20} />
                                    <span>{t.downloadResume}</span>
                                </button>
                            </div>
                        </div>

                        {/* Services */}
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                {t.services.title}
                            </h4>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                <li className="flex items-center space-x-2">
                                    <FileText size={16} />
                                    <span>{t.services.dataScience}</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <FileText size={16} />
                                    <span>{t.services.webDev}</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <MessageCircle size={16} />
                                    <span>{t.services.consulting}</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Youtube size={16} />
                                    <span>{t.services.channelManagement}</span>
                                </li>
                            </ul>
                        </div>

                        {/* Availability */}
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                {t.availability.title}
                            </h4>
                            <div className="space-y-2 text-gray-600 dark:text-gray-300">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>{t.availability.status}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock size={16} />
                                    <span>{t.availability.timezone}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Mail size={16} />
                                    <span>{t.availability.response}</span>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                {t.followMe}
                            </h4>
                            <div className="flex space-x-4">
                                <a
                                    href="https://github.com/GabrielToth"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    <Github size={24} />
                                </a>
                                <a
                                    href="https://linkedin.com/in/gabriel-toth-goncalves"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                    <Linkedin size={24} />
                                </a>
                                <a
                                    href="https://youtube.com/@WaveIGL"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    <Youtube size={24} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                                >
                                    {t.contactForm.name}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                                >
                                    {t.contactForm.email}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="subject"
                                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                                >
                                    {t.contactForm.subject}
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="message"
                                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                                >
                                    {t.contactForm.message}
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={6}
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting
                                    ? t.contactForm.sending
                                    : t.contactForm.send}
                            </button>

                            {submitStatus === "success" && (
                                <p className="text-green-600 text-sm text-center">
                                    {t.contactForm.success}
                                </p>
                            )}

                            {submitStatus === "error" && (
                                <p className="text-red-600 text-sm text-center">
                                    {t.contactForm.error}
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}
