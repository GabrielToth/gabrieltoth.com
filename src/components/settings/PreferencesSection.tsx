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
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                    Customize your experience with language, theme, and
                    notification settings
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Notifications Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Notifications
                        </label>
                        <p className="mt-1 text-sm text-gray-600">
                            Receive email notifications about your account
                            activity
                        </p>
                    </div>
                    <Toggle
                        pressed={localPreferences.notificationsEnabled}
                        onPressedChange={handleNotificationsToggle}
                        aria-label="Toggle notifications"
                    >
                        {localPreferences.notificationsEnabled ? "On" : "Off"}
                    </Toggle>
                </div>

                {/* Language Select */}
                <div className="space-y-2">
                    <label
                        htmlFor="language"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Language
                    </label>
                    <Select
                        value={localPreferences.language}
                        onValueChange={handleLanguageChange}
                    >
                        <SelectTrigger id="language">
                            <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="pt">Portuguese</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                        Choose your preferred language for the interface
                    </p>
                </div>

                {/* Theme Select */}
                <div className="space-y-2">
                    <label
                        htmlFor="theme"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Theme
                    </label>
                    <Select
                        value={localPreferences.theme}
                        onValueChange={handleThemeChange}
                    >
                        <SelectTrigger id="theme">
                            <SelectValue placeholder="Select a theme" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="auto">Auto (System)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                        Choose how the interface should look
                    </p>
                </div>

                {/* Timezone Select */}
                <div className="space-y-2">
                    <label
                        htmlFor="timezone"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Timezone
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
                                    localStorage.setItem(
                                        "user-timezone",
                                        value,
                                    )
                                } catch {}
                            }
                        }}
                    >
                        <SelectTrigger id="timezone">
                            <SelectValue placeholder="Select a timezone" />
                        </SelectTrigger>
                        <SelectContent>
                            {timezones.map(tz => (
                                <SelectItem key={tz} value={tz}>
                                    {tz}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                        Your timezone is auto-detected from your browser. Change
                        it here to override. Used for scheduling posts.
                    </p>
                </div>

                {/* Info Message */}
                <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
                    Your preferences are saved automatically when you make
                    changes.
                </div>
            </CardContent>
        </Card>
    )
}

export default PreferencesSection
