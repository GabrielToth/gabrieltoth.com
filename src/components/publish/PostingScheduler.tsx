"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { addDays, formatDistanceToNow, isBefore } from "date-fns"
import { format, fromZonedTime, toZonedTime } from "date-fns-tz"
import { AlertCircle, Calendar, Clock } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

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

function getBrowserTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    } catch {
        return "UTC"
    }
}

function getStoredTimezone(): string {
    if (typeof window === "undefined") return "UTC"
    try {
        return localStorage.getItem("user-timezone") || getBrowserTimezone()
    } catch {
        return getBrowserTimezone()
    }
}

function formatDateForInput(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

interface PostingSchedulerProps {
    onScheduleChange: (schedule: {
        type: "immediate" | "scheduled"
        scheduledTime?: Date
        timezone?: string
    }) => void
    defaultDate?: Date
}

export default function PostingScheduler({
    onScheduleChange,
    defaultDate,
}: PostingSchedulerProps) {
    const userTz = getStoredTimezone()
    const t = useTranslations("dashboard.publish")
    const [scheduleType, setScheduleType] = useState<"immediate" | "scheduled">(
        defaultDate ? "scheduled" : "immediate"
    )
    const [selectedTimezone, setSelectedTimezone] = useState(userTz)

    const initialDate = useMemo(() => {
        if (!defaultDate) return formatDateForInput(new Date())
        const zoned = toZonedTime(defaultDate, selectedTimezone)
        return formatDateForInput(zoned)
    }, [defaultDate, selectedTimezone])

    const [selectedDate, setSelectedDate] = useState(initialDate)
    const [selectedTime, setSelectedTime] = useState("00:00")
    const [error, setError] = useState("")

    useEffect(() => {
        if (defaultDate) {
            const zoned = toZonedTime(defaultDate, selectedTimezone)
            setSelectedDate(formatDateForInput(zoned))
            setSelectedTime("00:00")
        }
    }, [defaultDate, selectedTimezone])

    const maxDate = useMemo(() => {
        const max = addDays(new Date(), 365)
        return formatDateForInput(max)
    }, [])

    const minDate = useMemo(() => {
        return formatDateForInput(new Date())
    }, [])

    const previewTime = useMemo(() => {
        if (scheduleType === "immediate") {
            return t("now")
        }

        if (!selectedDate || !selectedTime) {
            return ""
        }

        try {
            const [hours, minutes] = selectedTime.split(":")
            const localDateTime = new Date(
                `${selectedDate}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
            )

            const utcTime = fromZonedTime(localDateTime, selectedTimezone)

            if (isBefore(utcTime, new Date())) {
                setError(t("scheduleTimeFuture"))
                return ""
            }

            setError("")

            const formatted = format(localDateTime, "PPP p zzz", {
                timeZone: selectedTimezone,
            })

            return `${formatted} (${formatDistanceToNow(utcTime, { addSuffix: true })})`
        } catch {
            return ""
        }
    }, [scheduleType, selectedDate, selectedTime, selectedTimezone])

    const handleScheduleChange = () => {
        if (scheduleType === "immediate") {
            onScheduleChange({ type: "immediate" })
            return
        }

        if (!selectedDate || !selectedTime) {
            setError(t("selectDate") + " " + t("selectTime"))
            return
        }

        const [hours, minutes] = selectedTime.split(":")
        const localDateTime = new Date(
            `${selectedDate}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
        )

        const utcTime = fromZonedTime(localDateTime, selectedTimezone)

        if (isBefore(utcTime, new Date())) {
            setError(t("scheduleTimeFuture"))
            return
        }

        setError("")
        onScheduleChange({
            type: "scheduled",
            scheduledTime: utcTime,
            timezone: selectedTimezone,
        })
    }

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-2">
                <h3 className="font-semibold">{t("schedule")}</h3>
                <p className="text-sm text-gray-600">
                    {t("scheduleDescription")}
                </p>
            </div>

            <RadioGroup
                value={scheduleType}
                onValueChange={(v: any) => setScheduleType(v)}
            >
                <div className="flex items-center gap-2">
                    <RadioGroupItem value="immediate" id="immediate" />
                    <Label htmlFor="immediate" className="cursor-pointer">
                        {t("publishNow")}
                    </Label>
                </div>

                <div className="flex items-center gap-2">
                    <RadioGroupItem value="scheduled" id="scheduled" />
                    <Label htmlFor="scheduled" className="cursor-pointer">
                        {t("scheduleForLater")}
                    </Label>
                </div>
            </RadioGroup>

            {scheduleType !== "immediate" && (
                <div className="space-y-3 border-t pt-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label
                                htmlFor="date"
                                className="flex items-center gap-2"
                            >
                                <Calendar className="h-4 w-4" />
                                {t("scheduleDate")}
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                min={minDate}
                                max={maxDate}
                                aria-label={t("selectDate")}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="time"
                                className="flex items-center gap-2"
                            >
                                <Clock className="h-4 w-4" />
                                {t("scheduleTime")}
                            </Label>
                            <Input
                                id="time"
                                type="time"
                                value={selectedTime}
                                onChange={e => setSelectedTime(e.target.value)}
                                aria-label={t("selectTime")}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="timezone">{t("timezone")}</Label>
                        <Select
                            value={selectedTimezone}
                            onValueChange={setSelectedTimezone}
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
                        <p className="text-xs text-gray-500">
                            {t("timezoneDescription")}
                        </p>
                    </div>

                    {previewTime && (
                        <div className="rounded bg-blue-50 p-3">
                            <p className="text-sm font-medium text-blue-900">
                                {t("schedulePost")}: {previewTime}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 rounded bg-red-50 p-3 text-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                </div>
            )}

            <Button
                onClick={handleScheduleChange}
                className="w-full"
                aria-label={t("confirmSchedule")}
            >
                {scheduleType === "immediate"
                    ? t("readyToPublish")
                    : t("schedulePost")}
            </Button>
        </div>
    )
}
