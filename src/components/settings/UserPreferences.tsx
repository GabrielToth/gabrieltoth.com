"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AlertCircle, CheckCircle, Download, Upload } from "lucide-react"
import { useTranslations } from "next-intl"
import React, { useState } from "react"

interface UserPreferencesProps {
    onPreferencesChange?: (preferences: UserPreferences) => void
    onExport?: () => void
    onImport?: (file: File) => void
}

interface UserPreferences {
    timezone: string
    defaultNetworks: string[]
    notificationsEnabled: boolean
    retryAttempts: number
    privacySettings: Record<string, string>
}

const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
    "America/Sao_Paulo",
    "America/Argentina/Buenos_Aires",
]

export default function UserPreferences({
    onPreferencesChange,
    onExport,
    onImport,
}: UserPreferencesProps) {
    const t = useTranslations("dashboard.settings")
    const [preferences, setPreferences] = useState<UserPreferences>({
        timezone: "America/New_York",
        defaultNetworks: [],
        notificationsEnabled: true,
        retryAttempts: 3,
        privacySettings: {
            youtube: "public",
            facebook: "public",
            instagram: "public",
            twitter: "public",
            linkedin: "public",
        },
    })

    const [isSaved, setIsSaved] = useState(false)
    const [error, setError] = useState("")

    const handleSave = () => {
        setError("")
        try {
            onPreferencesChange?.(preferences)
            setIsSaved(true)
            setTimeout(() => setIsSaved(false), 3000)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            setError(t("failedToSavePreferences"))
        }
    }

    const handleExport = () => {
        try {
            onExport?.()
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            setError(t("failedToExportPreferences"))
        }
    }

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            try {
                onImport?.(file)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (err) {
                setError(t("failedToImportPreferences"))
            }
        }
    }

    return (
        <div className="space-y-6 rounded-lg border p-4">
            <div className="space-y-2">
                <h3 className="font-semibold">{t("userPreferences")}</h3>
                <p className="text-sm text-gray-600">
                    {t("userPreferencesDescription")}
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-800">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {isSaved && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-800">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">{t("preferencesSaved")}</p>
                </div>
            )}

            <div className="space-y-4 border-b pb-4">
                <h4 className="font-medium">{t("generalSettings")}</h4>

                <div className="space-y-2">
                    <Label htmlFor="timezone">{t("defaultTimezone")}</Label>
                    <Select
                        value={preferences.timezone}
                        onValueChange={value =>
                            setPreferences({ ...preferences, timezone: value })
                        }
                    >
                        <SelectTrigger id="timezone">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {timezones.map(tz => (
                                <SelectItem key={tz} value={tz}>
                                    {tz}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="retry-attempts">{t("retryAttempts")}</Label>
                    <Input
                        id="retry-attempts"
                        type="number"
                        min="1"
                        max="10"
                        value={preferences.retryAttempts}
                        onChange={e =>
                            setPreferences({
                                ...preferences,
                                retryAttempts: parseInt(e.target.value),
                            })
                        }
                    />
                    <p className="text-xs text-gray-600">
                        {t("retryDescription")}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="notifications"
                        checked={preferences.notificationsEnabled}
                        onCheckedChange={checked =>
                            setPreferences({
                                ...preferences,
                                notificationsEnabled: checked as boolean,
                            })
                        }
                    />
                    <Label htmlFor="notifications" className="cursor-pointer">
                        {t("enableNotifications")}
                    </Label>
                </div>
            </div>

            <div className="space-y-4 border-b pb-4">
                <h4 className="font-medium">{t("privacySettings")}</h4>
                <p className="text-sm text-gray-600">
                    {t("privacyDescription")}
                </p>

                <div className="space-y-3">
                    {Object.entries(preferences.privacySettings).map(
                        ([network, value]) => (
                            <div key={network} className="space-y-2">
                                <Label
                                    htmlFor={`privacy-${network}`}
                                    className="capitalize"
                                >
                                    {network}
                                </Label>
                                <Select
                                    value={value}
                                    onValueChange={newValue =>
                                        setPreferences({
                                            ...preferences,
                                            privacySettings: {
                                                ...preferences.privacySettings,
                                                [network]: newValue,
                                            },
                                        })
                                    }
                                >
                                    <SelectTrigger id={`privacy-${network}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public">
                                            {t("public")}
                                        </SelectItem>
                                        <SelectItem value="friends">
                                            {t("friendsOnly")}
                                        </SelectItem>
                                        <SelectItem value="private">
                                            {t("private")}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )
                    )}
                </div>
            </div>

            <div className="space-y-4 border-b pb-4">
                <h4 className="font-medium">{t("importExport")}</h4>
                <p className="text-sm text-gray-600">
                    {t("importExportDescription")}
                </p>

                <div className="flex gap-2">
                    <Button
                        onClick={handleExport}
                        variant="outline"
                        className="flex-1 gap-2"
                    >
                        <Download className="h-4 w-4" />
                        {t("export")}
                    </Button>

                    <div className="flex-1">
                        <label htmlFor="import-file">
                            <Button
                                asChild
                                variant="outline"
                                className="w-full gap-2 cursor-pointer"
                            >
                                <span>
                                    <Upload className="h-4 w-4" />
                                    {t("import")}
                                </span>
                            </Button>
                        </label>
                        <input
                            id="import-file"
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                            aria-label={t("importFile")}
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                    {t("resetToDefaults")}
                </Button>
                <Button onClick={handleSave} className="flex-1">
                    {t("savePreferences")}
                </Button>
            </div>
        </div>
    )
}
