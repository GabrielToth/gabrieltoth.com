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
import { format, toZonedTime } from "date-fns-tz"
import { AlertCircle, Calendar, Clock } from "lucide-react"
import { useMemo, useState } from "react"

interface PostingSchedulerProps {
    onScheduleChange: (schedule: {
        type: "immediate" | "scheduled" | "recurring"
        scheduledTime?: Date
        timezone?: string
        recurrence?: "daily" | "weekly" | "monthly"
    }) => void
    timezone?: string
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

export default function PostingScheduler({
    onScheduleChange,
    timezone = "America/New_York",
}: PostingSchedulerProps) {
    const [scheduleType, setScheduleType] = useState<
        "immediate" | "scheduled" | "recurring"
    >("immediate")
    const [selectedDate, setSelectedDate] = useState("")
    const [selectedTime, setSelectedTime] = useState("12:00")
    const [selectedTimezone, setSelectedTimezone] = useState(timezone)
    const [recurrence, setRecurrence] = useState<
        "daily" | "weekly" | "monthly"
    >("daily")
    const [error, setError] = useState("")

    const maxDate = useMemo(() => {
        const max = addDays(new Date(), 365)
        return max.toISOString().split("T")[0]
    }, [])

    const minDate = useMemo(() => {
        return new Date().toISOString().split("T")[0]
    }, [])

    const previewTime = useMemo(() => {
        if (scheduleType === "immediate") {
            return "Now"
        }

        if (!selectedDate || !selectedTime) {
            return ""
        }

        try {
            const [hours, minutes] = selectedTime.split(":")
            const dateTime = new Date(`${selectedDate}T${selectedTime}:00`)

            if (isBefore(dateTime, new Date())) {
                setError("Scheduled time must be in the future")
                return ""
            }

            setError("")

            const zonedTime = toZonedTime(dateTime, selectedTimezone)
            const formatted = format(zonedTime, "PPP p zzz", {
                timeZone: selectedTimezone,
            })

            return `${formatted} (${formatDistanceToNow(dateTime, { addSuffix: true })})`
        } catch (e) {
            return ""
        }
    }, [scheduleType, selectedDate, selectedTime, selectedTimezone])

    const handleScheduleChange = () => {
        if (scheduleType === "immediate") {
            onScheduleChange({
                type: "immediate",
            })
        } else if (scheduleType === "scheduled") {
            if (!selectedDate || !selectedTime) {
                setError("Please select date and time")
                return
            }

            const dateTime = new Date(`${selectedDate}T${selectedTime}:00`)

            if (isBefore(dateTime, new Date())) {
                setError("Scheduled time must be in the future")
                return
            }

            setError("")
            onScheduleChange({
                type: "scheduled",
                scheduledTime: dateTime,
                timezone: selectedTimezone,
            })
        } else if (scheduleType === "recurring") {
            if (!selectedDate || !selectedTime) {
                setError("Please select date and time")
                return
            }

            const dateTime = new Date(`${selectedDate}T${selectedTime}:00`)

            if (isBefore(dateTime, new Date())) {
                setError("Scheduled time must be in the future")
                return
            }

            setError("")
            onScheduleChange({
                type: "recurring",
                scheduledTime: dateTime,
                timezone: selectedTimezone,
                recurrence,
            })
        }
    }

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-2">
                <h3 className="font-semibold">Schedule</h3>
                <p className="text-sm text-gray-600">
                    Choose when to publish your content
                </p>
            </div>

            <RadioGroup
                value={scheduleType}
                onValueChange={(v: any) => setScheduleType(v)}
            >
                <div className="flex items-center gap-2">
                    <RadioGroupItem value="immediate" id="immediate" />
                    <Label htmlFor="immediate" className="cursor-pointer">
                        Publish Now
                    </Label>
                </div>

                <div className="flex items-center gap-2">
                    <RadioGroupItem value="scheduled" id="scheduled" />
                    <Label htmlFor="scheduled" className="cursor-pointer">
                        Schedule for Later
                    </Label>
                </div>

                <div className="flex items-center gap-2">
                    <RadioGroupItem value="recurring" id="recurring" />
                    <Label htmlFor="recurring" className="cursor-pointer">
                        Recurring Schedule
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
                                Date
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                min={minDate}
                                max={maxDate}
                                aria-label="Select date"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="time"
                                className="flex items-center gap-2"
                            >
                                <Clock className="h-4 w-4" />
                                Time
                            </Label>
                            <Input
                                id="time"
                                type="time"
                                value={selectedTime}
                                onChange={e => setSelectedTime(e.target.value)}
                                aria-label="Select time"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
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
                    </div>

                    {scheduleType === "recurring" && (
                        <div className="space-y-2">
                            <Label htmlFor="recurrence">Repeat</Label>
                            <Select
                                value={recurrence}
                                onValueChange={(v: any) => setRecurrence(v)}
                            >
                                <SelectTrigger id="recurrence">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">
                                        Weekly
                                    </SelectItem>
                                    <SelectItem value="monthly">
                                        Monthly
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {previewTime && (
                        <div className="rounded bg-blue-50 p-3">
                            <p className="text-sm font-medium text-blue-900">
                                Scheduled for: {previewTime}
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
                aria-label="Confirm schedule"
            >
                {scheduleType === "immediate"
                    ? "Ready to Publish"
                    : "Schedule Post"}
            </Button>
        </div>
    )
}
