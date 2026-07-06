"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import { useTranslations } from "next-intl"
import React, { useEffect, useState } from "react"
import { Preferences } from "./SettingsContainer"

const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Madrid",
    "Europe/Lisbon",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Kolkata",
    "Australia/Sydney",
    "Pacific/Auckland",
    "America/Sao_Paulo",
    "America/Argentina/Buenos_Aires",
    "Africa/Cairo",
    "Africa/Lagos",
    "UTC",
]

/**
 * PreferencesSectionProps
 */
export interface PreferencesSectionProps {
    preferences: Preferences
    onSave: (preferences: Preferences) => void
}

/**
 * PreferencesSection Component
 * User preferences management
 * Notifications toggle
 * Language select (English, Portuguese, Spanish, French)
 * Theme select (Light, Dark, Auto)
 * Apply changes immediately
 *
 * Features:
 * - Toggle notifications
 * - Select language
 * - Select theme
 * - Apply changes immediately
 * - Persist preferences
 */
export const PreferencesSection: React.FC<PreferencesSectionProps> = ({
    preferences,
    onSave,
}) => {
    const t = useTranslations("dashboard.settings")
    // Local state for preferences
    const [localPreferences, setLocalPreferences] = useState(preferences)

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem("user-timezone")
                if (stored && !localPreferences.timezone) {
                    setLocalPreferences(prev => ({ ...prev, timezone: stored }))
                }
            } catch {}
        }
    }, [localPreferences.timezone])

    /**
     * Handle notifications toggle
     */
    const handleNotificationsToggle = (checked: boolean) => {
        const updated = {
            ...localPreferences,
            notificationsEnabled: checked,
        }
        setLocalPreferences(updated)
        onSave(updated)
    }

    /**
     * Handle language change
     */
    const handleLanguageChange = (language: string) => {
        const updated = {
            ...localPreferences,
            language: language as "en" | "pt" | "es" | "fr",
        }
        setLocalPreferences(updated)
        onSave(updated)
    }

    /**
     * Handle theme change
     */
    const handleThemeChange = (theme: string) => {
        const updated = {
            ...localPreferences,
            theme: theme as "light" | "dark" | "auto",
        }
        setLocalPreferences(updated)
        onSave(updated)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("preferences")}</CardTitle>
                <CardDescription>{t("preferences")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Notifications Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("notifications")}
                        </label>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {t("notificationsDescription")}
                        </p>
                    </div>
                    <Toggle
                        pressed={localPreferences.notificationsEnabled}
                        onPressedChange={handleNotificationsToggle}
                        aria-label={t("toggleNotifications")}
                    >
                        {localPreferences.notificationsEnabled
                            ? t("on")
                            : t("off")}
                    </Toggle>
                </div>

                {/* Language Select */}
                <div className="space-y-2">
                    <label
                        htmlFor="language"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        {t("language")}
                    </label>
                    <Select
                        value={localPreferences.language}
                        onValueChange={handleLanguageChange}
                    >
                        <SelectTrigger id="language">
                            <SelectValue placeholder={t("selectLanguage")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">
                                {t("languageEnglish") || "English"}
                            </SelectItem>
                            <SelectItem value="pt">
                                {t("languagePortuguese") || "Portuguese"}
                            </SelectItem>
                            <SelectItem value="es">
                                {t("languageSpanish") || "Spanish"}
                            </SelectItem>
                            <SelectItem value="fr">
                                {t("languageFrench") || "French"}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("languageDescription")}
                    </p>
                </div>

                {/* Theme Select */}
                <div className="space-y-2">
                    <label
                        htmlFor="theme"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        {t("theme")}
                    </label>
                    <Select
                        value={localPreferences.theme}
                        onValueChange={handleThemeChange}
                    >
                        <SelectTrigger id="theme">
                            <SelectValue placeholder={t("selectTheme")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">{t("light")}</SelectItem>
                            <SelectItem value="dark">{t("dark")}</SelectItem>
                            <SelectItem value="auto">
                                {t("autoTheme")}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("themeDescription")}
                    </p>
                </div>

                {/* Timezone Select */}
                <div className="space-y-2">
                    <label
                        htmlFor="timezone"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        {t("timezone")}
                    </label>
                    <Select
                        value={localPreferences.timezone}
                        onValueChange={value => {
                            const updated = {
                                ...localPreferences,
                                timezone: value,
                            }
                            setLocalPreferences(updated)
                            onSave(updated)
                            if (typeof window !== "undefined") {
                                try {
                                    localStorage.setItem("user-timezone", value)
                                } catch {}
                            }
                        }}
                    >
                        <SelectTrigger id="timezone">
                            <SelectValue placeholder={t("selectTimezone")} />
                        </SelectTrigger>
                        <SelectContent>
                            {timezones.map(tz => (
                                <SelectItem key={tz} value={tz}>
                                    {tz}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("timezoneDescription")}
                    </p>
                </div>

                {/* Info Message */}
                <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                    {t("preferencesSavedAutomatically")}
                </div>
            </CardContent>
        </Card>
    )
}

export default PreferencesSection
