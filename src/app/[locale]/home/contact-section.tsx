"use client"

import { useLocale } from "@/hooks/use-locale"
import {
    Briefcase,
    Calendar,
    Clock,
    Code2,
    Download,
    Mail,
    Play,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

export default function ContactSection() {
    const { locale } = useLocale()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<
        "idle" | "success" | "error"
    >("idle")
    const [turnstileReady, setTurnstileReady] = useState(false)

    useEffect(() => {
        /* c8 ignore start */
        const id = "cf-turnstile-script"
        if (document.getElementById(id)) {
            setTurnstileReady(true)
            return
        }
        const script = document.createElement("script")
        script.id = id
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"
        script.async = true
        script.defer = true
        script.onload = () => setTurnstileReady(true)
        document.body.appendChild(script)
        /* c8 ignore stop */
    }, [])

    // Get translations
    const t = useTranslations("home.contact")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSubmitStatus("idle")

        try {
            const formData = new FormData(e.currentTarget)
            formData.set("locale", locale)
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
            /* c8 ignore next */
            setSubmitStatus("error")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section id="contact" className="py-20 bg-card dark:bg-background">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground dark:text-foreground mb-4">
                            {t("title")}
                        </h2>
                        <p className="text-lg text-muted-foreground dark:text-foreground">
                            {t("subtitle")}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* Contact Info */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <a
                                    href={`mailto:${t("contactEmail")}`}
                                    className="flex items-center space-x-3 text-muted-foreground dark:text-foreground hover:text-primary dark:hover:text-primary transition-colors"
                                >
                                    <Mail className="h-5 w-5" />
                                    <span>{t("contactEmail")}</span>
                                </a>

                                <a
                                    href="https://calendly.com/gabrieltoth"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-3 text-muted-foreground dark:text-foreground hover:text-primary dark:hover:text-primary transition-colors"
                                >
                                    <Calendar className="h-5 w-5" />
                                    <span>{t("scheduleCall")}</span>
                                </a>

                                <a
                                    href={t("resumeUrl")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-3 text-muted-foreground dark:text-foreground hover:text-primary dark:hover:text-primary transition-colors"
                                >
                                    <Download className="h-5 w-5" />
                                    <span>{t("downloadResume")}</span>
                                </a>
                            </div>

                            {/* Services */}
                            <div>
                                <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-4">
                                    {t("services.title")}
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-foreground dark:text-muted-foreground">
                                            {t("services.dataScience.title")}
                                        </h4>
                                        <p className="text-muted-foreground dark:text-muted-foreground text-sm">
                                            {t(
                                                "services.dataScience.description"
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-foreground dark:text-muted-foreground">
                                            {t("services.webDev.title")}
                                        </h4>
                                        <p className="text-muted-foreground dark:text-muted-foreground text-sm">
                                            {t("services.webDev.description")}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-foreground dark:text-muted-foreground">
                                            {t("services.consulting.title")}
                                        </h4>
                                        <p className="text-muted-foreground dark:text-muted-foreground text-sm">
                                            {t(
                                                "services.consulting.description"
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Availability */}
                            <div>
                                <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-4">
                                    {t("availability.title")}
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                                        <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400" />
                                        <span>{t("availability.current")}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-muted-foreground dark:text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>
                                            {t("availability.response")}
                                        </span>
                                    </div>
                                    <div className="text-muted-foreground dark:text-muted-foreground">
                                        {t("availability.timezone")}
                                    </div>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div>
                                <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-4">
                                    {t("followMe")}
                                </h3>
                                <div className="flex space-x-4">
                                    <a
                                        href="https://github.com/gabrieltoth"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
                                        aria-label="GitHub"
                                        title="GitHub"
                                    >
                                        <Code2 className="h-6 w-6" />
                                    </a>
                                    <a
                                        href="https://linkedin.com/in/OGabrielToth"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
                                        aria-label="LinkedIn"
                                        title="LinkedIn"
                                    >
                                        <Briefcase className="h-6 w-6" />
                                    </a>
                                    <a
                                        href="https://youtube.com/@ogabrieltoth"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground"
                                        aria-label="YouTube"
                                        title="YouTube"
                                    >
                                        <Play className="h-6 w-6" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-6"
                            data-testid="contact-form"
                        >
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-foreground dark:text-foreground mb-1"
                                >
                                    {t("form.name")}
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    className="w-full px-4 py-2 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400 focus:border-transparent bg-card text-foreground dark:text-foreground"
                                    data-testid="contact-name"
                                />
                            </div>

                            {/* Turnstile */}
                            <div
                                className="cf-turnstile"
                                data-sitekey={
                                    process.env
                                        .NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""
                                }
                                data-theme="auto"
                                hidden={!turnstileReady}
                            />

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-foreground dark:text-foreground mb-1"
                                >
                                    {t("form.email")}
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    required
                                    placeholder={t("form.emailPlaceholder")}
                                    className="w-full px-4 py-2 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400 focus:border-transparent bg-card text-foreground dark:text-foreground"
                                    data-testid="contact-email"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="subject"
                                    className="block text-sm font-medium text-foreground dark:text-foreground mb-1"
                                >
                                    {t("form.subject")}
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    id="subject"
                                    required
                                    className="w-full px-4 py-2 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400 focus:border-transparent bg-card text-foreground dark:text-foreground"
                                    data-testid="contact-subject"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="message"
                                    className="block text-sm font-medium text-foreground dark:text-foreground mb-1"
                                >
                                    {t("form.message")}
                                </label>
                                <textarea
                                    name="message"
                                    id="message"
                                    rows={4}
                                    required
                                    placeholder={t("form.messagePlaceholder")}
                                    className="w-full px-4 py-2 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-400 focus:border-transparent bg-card text-foreground dark:text-foreground"
                                    data-testid="contact-message"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full px-6 py-3 bg-primary text-white font-medium rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                data-testid="contact-submit"
                            >
                                {isSubmitting
                                    ? t("form.sending")
                                    : t("form.send")}
                            </button>

                            {submitStatus === "success" && (
                                <p
                                    className="text-green-600 dark:text-green-400 text-center"
                                    data-testid="contact-success"
                                >
                                    {t("form.success")}
                                </p>
                            )}

                            {submitStatus === "error" && (
                                <p
                                    className="text-red-600 dark:text-red-400 text-center"
                                    data-testid="contact-error"
                                >
                                    {t("form.error")}
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}
