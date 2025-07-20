"use client"

import { useLocale } from "@/hooks/use-locale"
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
import { getContactTranslations } from "./translations"

export default function ContactSection() {
    const { locale } = useLocale()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<
        "idle" | "success" | "error"
    >("idle")

    // Get translations
    const t = getContactTranslations(locale)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSubmitStatus("idle")

        try {
            const formData = new FormData(e.currentTarget)
            const response = await fetch("/api/contact", {
                method: "POST",
                body: formData,
            })

            if (response.ok) {
                setSubmitStatus("success")
                ;(e.target as HTMLFormElement).reset()
            } else {
                setSubmitStatus("error")
            }
        } catch {
            setSubmitStatus("error")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section id="contact" className="py-24 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {t.title}
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        {t.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Information */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                {t.getInTouch}
                            </h3>

                            {/* Contact Methods */}
                            <div className="space-y-4">
                                <a
                                    href="mailto:contato@gabrieltoth.com"
                                    className="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Mail className="h-5 w-5" />
                                    <span>contato@gabrieltoth.com</span>
                                </a>

                                <a
                                    href="https://calendly.com/gabrieltoth"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Calendar className="h-5 w-5" />
                                    <span>{t.scheduleCall}</span>
                                </a>

                                <a
                                    href="/resume/Gabriel-Toth-Goncalves-Curriculo-PT.pdf"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    <Download className="h-5 w-5" />
                                    <span>{t.downloadResume}</span>
                                </a>
                            </div>
                        </div>

                        {/* Services */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                {t.services.title}
                            </h4>
                            <ul className="space-y-3">
                                <li className="flex items-center space-x-2">
                                    <FileText size={16} />
                                    <span>{t.services.dataScience.title}</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <FileText size={16} />
                                    <span>{t.services.webDev.title}</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <MessageCircle size={16} />
                                    <span>{t.services.consulting.title}</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Youtube size={16} />
                                    <span>{t.services.channelManagement}</span>
                                </li>
                            </ul>
                        </div>

                        {/* Availability */}
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                {t.availability.title}
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>{t.availability.current}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock size={16} />
                                    <span>{t.availability.response}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock size={16} />
                                    <span>{t.availability.timezone}</span>
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
                                    href="https://github.com/gabrieltoth"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                                >
                                    <Github className="h-6 w-6" />
                                </a>
                                <a
                                    href="https://linkedin.com/in/gabriel-toth"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                                >
                                    <Linkedin className="h-6 w-6" />
                                </a>
                                <a
                                    href="https://youtube.com/@gabrieltoth"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                                >
                                    <Youtube className="h-6 w-6" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            {t.getInTouch}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                                >
                                    {t.form.name}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                                >
                                    {t.form.email}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    placeholder={t.form.emailPlaceholder}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="subject"
                                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                                >
                                    {t.form.subject}
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="message"
                                    className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                                >
                                    {t.form.message}
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={4}
                                    required
                                    placeholder={t.form.messagePlaceholder}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? t.form.sending : t.form.send}
                            </button>

                            {submitStatus === "success" && (
                                <p className="text-green-600 text-sm text-center">
                                    {t.form.success}
                                </p>
                            )}

                            {submitStatus === "error" && (
                                <p className="text-red-600 text-sm text-center">
                                    {t.form.error}
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}
