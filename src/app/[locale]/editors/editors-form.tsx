"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { type Locale } from "@/lib/i18n"
import { SiYoutube } from "@icons-pack/react-simple-icons"
import { Edit3, MessageSquare, TrendingUp, User, Users } from "lucide-react"
import { useState } from "react"
import { useTranslations } from "next-intl"

interface ApplicationFormProps {
    locale: Locale
    type: "channel-management" | "editor-application"
}

export default function ApplicationForm({
    locale,
    type,
}: ApplicationFormProps) {
    const tCM = useTranslations("channelManagement")
    const tEd = useTranslations("editors")
    const t = type === "channel-management" ? tCM : tEd
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
                            ? "Channel Consulting Request"
                            : "Editor Application",
                    message: JSON.stringify(formData, null, 2),
                    type: type,
                }),
            })

            if (response.ok) {
                setIsSubmitted(true)
                setFormData({})
            }
        } catch (error) {
            /* c8 ignore next */
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
                <h3 className="text-2xl font-bold text-foreground dark:text-foreground mb-4">
                    {t("formSubmitted.title")}
                </h3>
                <p className="text-muted-foreground dark:text-foreground">
                    {t("formSubmitted.description")}
                </p>
            </Card>
        )
    }

    return (
        <Card className="p-8 max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
                    {t("title")}
                </h3>
                <p className="text-lg text-muted-foreground dark:text-foreground">
                    {t("subtitle")}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information */}
                <div>
                    <h4 className="text-xl font-semibold text-foreground dark:text-foreground mb-4 flex items-center">
                        <User className="mr-2" size={20} />
                        {t("form.personalInfo")}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                {t("form.name")} *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name || ""}
                                onChange={e =>
                                    handleInputChange("name", e.target.value)
                                }
                                placeholder={t("placeholders.name")}
                                className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                {t("form.email")} *
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email || ""}
                                onChange={e =>
                                    handleInputChange("email", e.target.value)
                                }
                                placeholder={t("placeholders.email")}
                                className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                            />
                        </div>
                        {type === "editor-application" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                        {t("form.age")}
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
                                        placeholder={t("placeholders.age")}
                                        className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                        {t("form.location")}
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
                                        placeholder={t("placeholders.location")}
                                        className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Channel Information or Editor Experience */}
                {type === "channel-management" ? (
                    <div>
                        <h4 className="text-xl font-semibold text-foreground dark:text-foreground mb-4 flex items-center">
                            <SiYoutube className="mr-2" size={20} />
                            {t("form.channelInfo")}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                    {t("form.channelName")} *
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
                                    placeholder={t("placeholders.channelName")}
                                    className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                    {t("form.channelUrl")} *
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
                                    placeholder={t("placeholders.channelUrl")}
                                    className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                    {t("form.subscribers")}
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
                                    placeholder={t("placeholders.subscribers")}
                                    className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                    {t("form.monthlyViews")}
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
                                    placeholder={t("placeholders.monthlyViews")}
                                    className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                    {t("form.currentRevenue")}
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
                                    placeholder={t("placeholders.currentRevenue")}
                                    className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h4 className="text-xl font-semibold text-foreground dark:text-foreground mb-4 flex items-center">
                            <Edit3 className="mr-2" size={20} />
                            {t("form.experience")}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                    {t("form.experienceLevel")} *
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
                                    aria-label={t("form.experienceLevel")}
                                    className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                >
                                    <option value="">{t("placeholders.selectOption")}</option>
                                    {(t.raw("options.experienceLevel") as string[]).map(level => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                    {t("form.software")}
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
                                    placeholder={t("placeholders.software")}
                                    className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                    {t("form.portfolioUrl")}
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
                                    placeholder={t("placeholders.portfolioUrl")}
                                    className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                    {t("form.sampleWork")}
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
                                    placeholder={t("placeholders.sampleWork")}
                                    className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Goals/Availability Section */}
                <div>
                    <h4 className="text-xl font-semibold text-foreground dark:text-foreground mb-4 flex items-center">
                        {type === "channel-management" ? (
                            <>
                                <TrendingUp className="mr-2" size={20} />
                                {t("form.goals")}
                            </>
                        ) : (
                            <>
                                <Users className="mr-2" size={20} />
                                {t("form.availability")}
                            </>
                        )}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {type === "channel-management" ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                        {t("form.mainGoal")}
                                    </label>
                                    <textarea
                                        value={formData.mainGoal || ""}
                                        onChange={e =>
                                            handleInputChange(
                                                "mainGoal",
                                                e.target.value
                                            )
                                        }
                                        placeholder={t("placeholders.mainGoal")}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                        {t("form.biggestChallenge")}
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
                                            t("placeholders.biggestChallenge")
                                        }
                                        rows={3}
                                        className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                        {t("form.expectedGrowth")}
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
                                            t("placeholders.expectedGrowth")
                                        }
                                        className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                        {t("form.budget")}
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
                                        placeholder={t("placeholders.budget")}
                                        className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                        {t("form.hoursPerWeek")}
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
                                            t("placeholders.hoursPerWeek")
                                        }
                                        className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                        {t("form.preferredContent")}
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
                                            t("placeholders.preferredContent")
                                        }
                                        className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                                        {t("form.expectedRate")}
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
                                            t("placeholders.expectedRate")
                                        }
                                        className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Additional Information */}
                <div>
                    <label className="block text-sm font-medium text-foreground dark:text-foreground mb-2">
                        {type === "channel-management"
                            ? t("form.additionalInfo")
                            : t("form.whyJoin")}
                    </label>
                    <textarea
                        value={formData.additionalInfo || ""}
                        onChange={e =>
                            handleInputChange("additionalInfo", e.target.value)
                        }
                        placeholder={
                            type === "channel-management"
                                ? t("placeholders.additionalInfo")
                                : t("placeholders.whyJoin")
                        }
                        rows={4}
                        className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent dark:bg-card dark:text-foreground"
                    />
                </div>

                <div className="text-center">
                    <Button
                        type="submit"
                        disabled={
                            isSubmitting || !formData.name || !formData.email
                        }
                        className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting
                            ? t("submitting")
                            : t("form.submit")}
                    </Button>
                </div>
            </form>
        </Card>
    )
}
