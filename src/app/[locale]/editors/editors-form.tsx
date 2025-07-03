"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { type Locale } from "@/lib/i18n"
import {
    Edit3,
    MessageSquare,
    TrendingUp,
    User,
    Users,
    Youtube,
} from "lucide-react"
import { useState } from "react"

interface ApplicationFormProps {
    locale: Locale
    type: "channel-management" | "editor-application"
}

const getTranslations = (locale: Locale, type: string) => {
    const isPortuguese = locale === "pt-BR"

    if (type === "channel-management") {
        return {
            title: isPortuguese
                ? "Solicitar Consultoria de Canal"
                : "Request Channel Consulting",
            subtitle: isPortuguese
                ? "Preencha as informações do seu canal para uma análise personalizada"
                : "Fill in your channel information for a personalized analysis",
            form: {
                personalInfo: isPortuguese
                    ? "Informações Pessoais"
                    : "Personal Information",
                name: isPortuguese ? "Nome completo" : "Full name",
                email: isPortuguese ? "Email" : "Email",
                channelInfo: isPortuguese
                    ? "Informações do Canal"
                    : "Channel Information",
                channelName: isPortuguese ? "Nome do canal" : "Channel name",
                channelUrl: isPortuguese
                    ? "URL do canal (YouTube)"
                    : "Channel URL (YouTube)",
                subscribers: isPortuguese
                    ? "Número de inscritos"
                    : "Number of subscribers",
                monthlyViews: isPortuguese
                    ? "Visualizações mensais"
                    : "Monthly views",
                currentRevenue: isPortuguese
                    ? "Receita mensal atual (R$)"
                    : "Current monthly revenue (R$)",
                goals: isPortuguese
                    ? "Objetivos e Desafios"
                    : "Goals and Challenges",
                mainGoal: isPortuguese ? "Principal objetivo" : "Main goal",
                biggestChallenge: isPortuguese
                    ? "Maior desafio atual"
                    : "Biggest current challenge",
                expectedGrowth: isPortuguese
                    ? "Crescimento esperado (%)"
                    : "Expected growth (%)",
                budget: isPortuguese
                    ? "Orçamento para consultoria (R$)"
                    : "Consulting budget (R$)",
                additionalInfo: isPortuguese
                    ? "Informações adicionais"
                    : "Additional information",
                submit: isPortuguese
                    ? "Solicitar Consultoria"
                    : "Request Consulting",
            },
            placeholders: {
                name: isPortuguese ? "Seu nome completo" : "Your full name",
                email: isPortuguese ? "seu@email.com" : "your@email.com",
                channelName: isPortuguese
                    ? "Nome do seu canal"
                    : "Your channel name",
                channelUrl: isPortuguese
                    ? "https://youtube.com/@seucanal"
                    : "https://youtube.com/@yourchannel",
                subscribers: isPortuguese ? "Ex: 10000" : "Ex: 10000",
                monthlyViews: isPortuguese ? "Ex: 100000" : "Ex: 100000",
                currentRevenue: isPortuguese ? "Ex: 5000" : "Ex: 5000",
                mainGoal: isPortuguese
                    ? "Ex: Aumentar monetização, crescer audiência..."
                    : "Ex: Increase monetization, grow audience...",
                biggestChallenge: isPortuguese
                    ? "Ex: Baixo engajamento, views estagnadas..."
                    : "Ex: Low engagement, stagnant views...",
                expectedGrowth: isPortuguese
                    ? "Ex: 200% em 6 meses"
                    : "Ex: 200% in 6 months",
                budget: isPortuguese ? "Ex: 1500" : "Ex: 1500",
                additionalInfo: isPortuguese
                    ? "Conte mais sobre seu canal e necessidades..."
                    : "Tell us more about your channel and needs...",
            },
        }
    } else {
        return {
            title: isPortuguese ? "Aplicar como Editor" : "Apply as Editor",
            subtitle: isPortuguese
                ? "Junte-se à nossa equipe de editores talentosos"
                : "Join our team of talented editors",
            form: {
                personalInfo: isPortuguese
                    ? "Informações Pessoais"
                    : "Personal Information",
                name: isPortuguese ? "Nome completo" : "Full name",
                email: isPortuguese ? "Email" : "Email",
                age: isPortuguese ? "Idade" : "Age",
                location: isPortuguese ? "Localização" : "Location",
                experience: isPortuguese ? "Experiência" : "Experience",
                experienceLevel: isPortuguese
                    ? "Nível de experiência"
                    : "Experience level",
                software: isPortuguese
                    ? "Softwares de edição"
                    : "Editing software",
                portfolio: isPortuguese ? "Portfólio" : "Portfolio",
                portfolioUrl: isPortuguese
                    ? "Link do portfólio"
                    : "Portfolio link",
                sampleWork: isPortuguese
                    ? "Trabalho de amostra"
                    : "Sample work",
                workStyle: isPortuguese ? "Estilo de trabalho" : "Work style",
                availability: isPortuguese ? "Disponibilidade" : "Availability",
                hoursPerWeek: isPortuguese
                    ? "Horas por semana"
                    : "Hours per week",
                preferredContent: isPortuguese
                    ? "Tipo de conteúdo preferido"
                    : "Preferred content type",
                expectedRate: isPortuguese
                    ? "Taxa esperada (R$/hora)"
                    : "Expected rate (R$/hour)",
                motivation: isPortuguese ? "Motivação" : "Motivation",
                whyJoin: isPortuguese
                    ? "Por que quer se juntar?"
                    : "Why do you want to join?",
                submit: isPortuguese
                    ? "Enviar Aplicação"
                    : "Submit Application",
            },
            placeholders: {
                name: isPortuguese ? "Seu nome completo" : "Your full name",
                email: isPortuguese ? "seu@email.com" : "your@email.com",
                age: isPortuguese ? "Ex: 25" : "Ex: 25",
                location: isPortuguese ? "Cidade, Estado" : "City, State",
                software: isPortuguese
                    ? "Ex: Adobe Premiere, After Effects, DaVinci..."
                    : "Ex: Adobe Premiere, After Effects, DaVinci...",
                portfolioUrl: isPortuguese
                    ? "https://seu-portfolio.com"
                    : "https://your-portfolio.com",
                sampleWork: isPortuguese
                    ? "Link para vídeo editado por você"
                    : "Link to video edited by you",
                hoursPerWeek: isPortuguese ? "Ex: 20" : "Ex: 20",
                preferredContent: isPortuguese
                    ? "Gaming, vlogs, educacional..."
                    : "Gaming, vlogs, educational...",
                expectedRate: isPortuguese ? "Ex: 50" : "Ex: 50",
                whyJoin: isPortuguese
                    ? "Conte sobre sua paixão por edição e objetivos..."
                    : "Tell us about your passion for editing and goals...",
            },
            options: {
                experienceLevel: isPortuguese
                    ? ["Iniciante", "Intermediário", "Avançado", "Profissional"]
                    : ["Beginner", "Intermediate", "Advanced", "Professional"],
            },
        }
    }
}

export default function ApplicationForm({
    locale,
    type,
}: ApplicationFormProps) {
    const t = getTranslations(locale, type)
    const [formData, setFormData] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    subject:
                        type === "channel-management"
                            ? "Solicitação de Consultoria de Canal"
                            : "Aplicação para Editor",
                    message: JSON.stringify(formData, null, 2),
                    type: type,
                }),
            })

            if (response.ok) {
                setIsSubmitted(true)
                setFormData({})
            }
        } catch (error) {
            console.error("Error submitting form:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSubmitted) {
        return (
            <Card className="p-8 max-w-2xl mx-auto text-center">
                <div className="text-green-600 dark:text-green-400 mb-4">
                    <MessageSquare size={48} className="mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {locale === "pt-BR"
                        ? "Aplicação Enviada!"
                        : "Application Submitted!"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                    {locale === "pt-BR"
                        ? "Obrigado! Analisaremos sua aplicação e entraremos em contato em breve."
                        : "Thank you! We'll review your application and get back to you soon."}
                </p>
            </Card>
        )
    }

    return (
        <Card className="p-8 max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {t.title}
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                    {t.subtitle}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <User className="mr-2" size={20} />
                        {t.form.personalInfo}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t.form.name} *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name || ""}
                                onChange={e =>
                                    handleInputChange("name", e.target.value)
                                }
                                placeholder={t.placeholders.name}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t.form.email} *
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email || ""}
                                onChange={e =>
                                    handleInputChange("email", e.target.value)
                                }
                                placeholder={t.placeholders.email}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                        {type === "editor-application" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t.form.age}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.age || ""}
                                        onChange={e =>
                                            handleInputChange(
                                                "age",
                                                e.target.value
                                            )
                                        }
                                        placeholder={t.placeholders.age}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t.form.location}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location || ""}
                                        onChange={e =>
                                            handleInputChange(
                                                "location",
                                                e.target.value
                                            )
                                        }
                                        placeholder={t.placeholders.location}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Channel Information or Editor Experience */}
                {type === "channel-management" ? (
                    <div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <Youtube className="mr-2" size={20} />
                            {t.form.channelInfo}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t.form.channelName} *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.channelName || ""}
                                    onChange={e =>
                                        handleInputChange(
                                            "channelName",
                                            e.target.value
                                        )
                                    }
                                    placeholder={t.placeholders.channelName}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t.form.channelUrl} *
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={formData.channelUrl || ""}
                                    onChange={e =>
                                        handleInputChange(
                                            "channelUrl",
                                            e.target.value
                                        )
                                    }
                                    placeholder={t.placeholders.channelUrl}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t.form.subscribers}
                                </label>
                                <input
                                    type="number"
                                    value={formData.subscribers || ""}
                                    onChange={e =>
                                        handleInputChange(
                                            "subscribers",
                                            e.target.value
                                        )
                                    }
                                    placeholder={t.placeholders.subscribers}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t.form.monthlyViews}
                                </label>
                                <input
                                    type="number"
                                    value={formData.monthlyViews || ""}
                                    onChange={e =>
                                        handleInputChange(
                                            "monthlyViews",
                                            e.target.value
                                        )
                                    }
                                    placeholder={t.placeholders.monthlyViews}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t.form.currentRevenue}
                                </label>
                                <input
                                    type="number"
                                    value={formData.currentRevenue || ""}
                                    onChange={e =>
                                        handleInputChange(
                                            "currentRevenue",
                                            e.target.value
                                        )
                                    }
                                    placeholder={t.placeholders.currentRevenue}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            <Edit3 className="mr-2" size={20} />
                            {t.form.experience}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t.form.experienceLevel} *
                                </label>
                                <select
                                    required
                                    value={formData.experienceLevel || ""}
                                    onChange={e =>
                                        handleInputChange(
                                            "experienceLevel",
                                            e.target.value
                                        )
                                    }
                                    aria-label={t.form.experienceLevel}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                >
                                    <option value="">Selecione...</option>
                                    {t.options?.experienceLevel.map(level => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t.form.software}
                                </label>
                                <input
                                    type="text"
                                    value={formData.software || ""}
                                    onChange={e =>
                                        handleInputChange(
                                            "software",
                                            e.target.value
                                        )
                                    }
                                    placeholder={t.placeholders.software}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t.form.portfolioUrl}
                                </label>
                                <input
                                    type="url"
                                    value={formData.portfolioUrl || ""}
                                    onChange={e =>
                                        handleInputChange(
                                            "portfolioUrl",
                                            e.target.value
                                        )
                                    }
                                    placeholder={t.placeholders.portfolioUrl}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t.form.sampleWork}
                                </label>
                                <input
                                    type="url"
                                    value={formData.sampleWork || ""}
                                    onChange={e =>
                                        handleInputChange(
                                            "sampleWork",
                                            e.target.value
                                        )
                                    }
                                    placeholder={t.placeholders.sampleWork}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Goals/Availability Section */}
                <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        {type === "channel-management" ? (
                            <>
                                <TrendingUp className="mr-2" size={20} />
                                {t.form.goals}
                            </>
                        ) : (
                            <>
                                <Users className="mr-2" size={20} />
                                {t.form.availability}
                            </>
                        )}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {type === "channel-management" ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t.form.mainGoal}
                                    </label>
                                    <textarea
                                        value={formData.mainGoal || ""}
                                        onChange={e =>
                                            handleInputChange(
                                                "mainGoal",
                                                e.target.value
                                            )
                                        }
                                        placeholder={t.placeholders.mainGoal}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t.form.biggestChallenge}
                                    </label>
                                    <textarea
                                        value={formData.biggestChallenge || ""}
                                        onChange={e =>
                                            handleInputChange(
                                                "biggestChallenge",
                                                e.target.value
                                            )
                                        }
                                        placeholder={
                                            t.placeholders.biggestChallenge
                                        }
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t.form.expectedGrowth}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.expectedGrowth || ""}
                                        onChange={e =>
                                            handleInputChange(
                                                "expectedGrowth",
                                                e.target.value
                                            )
                                        }
                                        placeholder={
                                            t.placeholders.expectedGrowth
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t.form.budget}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.budget || ""}
                                        onChange={e =>
                                            handleInputChange(
                                                "budget",
                                                e.target.value
                                            )
                                        }
                                        placeholder={t.placeholders.budget}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t.form.hoursPerWeek}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.hoursPerWeek || ""}
                                        onChange={e =>
                                            handleInputChange(
                                                "hoursPerWeek",
                                                e.target.value
                                            )
                                        }
                                        placeholder={
                                            t.placeholders.hoursPerWeek
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t.form.preferredContent}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.preferredContent || ""}
                                        onChange={e =>
                                            handleInputChange(
                                                "preferredContent",
                                                e.target.value
                                            )
                                        }
                                        placeholder={
                                            t.placeholders.preferredContent
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t.form.expectedRate}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.expectedRate || ""}
                                        onChange={e =>
                                            handleInputChange(
                                                "expectedRate",
                                                e.target.value
                                            )
                                        }
                                        placeholder={
                                            t.placeholders.expectedRate
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Additional Information */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {type === "channel-management"
                            ? t.form.additionalInfo
                            : t.form.whyJoin}
                    </label>
                    <textarea
                        value={formData.additionalInfo || ""}
                        onChange={e =>
                            handleInputChange("additionalInfo", e.target.value)
                        }
                        placeholder={
                            type === "channel-management"
                                ? t.placeholders.additionalInfo
                                : t.placeholders.whyJoin
                        }
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    />
                </div>

                <div className="text-center">
                    <Button
                        type="submit"
                        disabled={
                            isSubmitting || !formData.name || !formData.email
                        }
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting
                            ? locale === "pt-BR"
                                ? "Enviando..."
                                : "Submitting..."
                            : t.form.submit}
                    </Button>
                </div>
            </form>
        </Card>
    )
}
