"use client"

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface PrivacyScheduleSectionProps {
    privacyStatus: "public" | "unlisted" | "private"
    onPrivacyStatusChange: (value: "public" | "unlisted" | "private") => void
    scheduleType: "now" | "later"
    onScheduleTypeChange: (value: "now" | "later") => void
    scheduledDate: Date | null
    onScheduledDateChange: (date: Date | null) => void
    scheduledTime: string
    onScheduledTimeChange: (time: string) => void
    allowSchedule: boolean
    errors: Record<string, string>
}

export default function PrivacyScheduleSection({
    privacyStatus,
    onPrivacyStatusChange,
    scheduleType,
    onScheduleTypeChange,
    scheduledDate,
    onScheduledDateChange,
    scheduledTime,
    onScheduledTimeChange,
    allowSchedule,
    errors,
}: PrivacyScheduleSectionProps) {
    const t = useTranslations("publish")

    // Set default schedule time to tomorrow 10am if switching to schedule
    useEffect(() => {
        if (scheduleType === "later" && !scheduledDate) {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            tomorrow.setHours(10, 0, 0, 0)
            onScheduledDateChange(tomorrow)
            onScheduledTimeChange("10:00")
        }
    }, [scheduleType]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{t("step4.privacy")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Privacy Status */}
                <div className="space-y-2">
                    <Label>{t("step4.privacyStatus")}</Label>
                    <Select
                        value={privacyStatus}
                        onValueChange={(v: "public" | "unlisted" | "private") =>
                            onPrivacyStatusChange(v)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="public">
                                {t("step4.public")}
                            </SelectItem>
                            <SelectItem value="unlisted">
                                {t("step4.unlisted")}
                            </SelectItem>
                            <SelectItem value="private">
                                {t("step4.private")}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Schedule type */}
                {allowSchedule && (
                    <div className="space-y-3 border-t pt-3 dark:border-gray-700">
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="scheduleType"
                                    checked={scheduleType === "now"}
                                    onChange={() => onScheduleTypeChange("now")}
                                    className="h-4 w-4"
                                />
                                <span className="text-sm">
                                    {t("step4.scheduleNow")}
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="scheduleType"
                                    checked={scheduleType === "later"}
                                    onChange={() =>
                                        onScheduleTypeChange("later")
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm">
                                    {t("step4.scheduleLater")}
                                </span>
                            </label>
                        </div>

                        {scheduleType === "later" && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="schedule-date">
                                        {t("step4.scheduleDate")}
                                    </Label>
                                    <Input
                                        id="schedule-date"
                                        type="date"
                                        value={
                                            scheduledDate
                                                ? scheduledDate
                                                      .toISOString()
                                                      .split("T")[0]
                                                : ""
                                        }
                                        onChange={e => {
                                            const dateVal = e.target.value
                                            const d = dateVal
                                                ? new Date(
                                                      dateVal +
                                                          "T" +
                                                          (scheduledTime ||
                                                              "10:00")
                                                  )
                                                : null
                                            onScheduledDateChange(d)
                                        }}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="schedule-time">
                                        {t("step4.scheduleTime")}
                                    </Label>
                                    <Input
                                        id="schedule-time"
                                        type="time"
                                        value={scheduledTime}
                                        onChange={e =>
                                            onScheduledTimeChange(
                                                e.target.value
                                            )
                                        }
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        )}

                        {scheduleType === "later" && (
                            <div className="rounded bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                                {t("step4.scheduleWarning")}
                            </div>
                        )}

                        {errors.schedule && (
                            <span className="text-xs text-red-500">
                                {errors.schedule}
                            </span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
