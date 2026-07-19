/**
 * StreamScheduler Component
 * Form to schedule new live streams and display upcoming schedules
 */

"use client"

import { useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"

interface ScheduledStream {
    id: string
    userId: string
    platform: string[]
    title: string
    description: string
    scheduledStartTime: string
    durationMinutes: number
    status: string
    notificationMethods: string[]
    notificationSent: boolean
    createdAt: string
    updatedAt: string
}

interface FormData {
    title: string
    platform: string[]
    scheduledStartTime: string
    durationMinutes: number
    description: string
    notificationMethods: string[]
}

const DURATION_OPTIONS = [15, 30, 60, 90, 120, 180, 240, 360, 480]

function getMinDateTime(): string {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 15)
    return now.toISOString().slice(0, 16)
}

export function StreamScheduler() {
    const t = useTranslations("dashboard.live")
    const [schedules, setSchedules] = useState<ScheduledStream[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<FormData>({
        title: "",
        platform: ["twitch"],
        scheduledStartTime: "",
        durationMinutes: 60,
        description: "",
        notificationMethods: ["discord"],
    })
    const [validationErrors, setValidationErrors] = useState<
        Record<string, string>
    >({})
    const lastFetch = useRef(0)

    const fetchSchedules = useCallback(async () => {
        const now = Date.now()
        if (now - lastFetch.current < 15000) return
        lastFetch.current = now
        try {
            const response = await fetch("/api/streams/schedule")
            if (!response.ok) throw new Error("Failed to fetch schedules")
            const data = await response.json()
            if (data.success) {
                setSchedules(data.data)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSchedules()
    }, [fetchSchedules])

    function validateForm(): boolean {
        const errors: Record<string, string> = {}

        if (!formData.title.trim()) {
            errors.title = "Title is required"
        } else if (formData.title.length > 140) {
            errors.title = "Title must be 140 characters or less"
        }

        if (formData.platform.length === 0) {
            errors.platform = "At least one platform must be selected"
        }

        if (!formData.scheduledStartTime) {
            errors.scheduledStartTime = "Start time is required"
        } else {
            const startTime = new Date(formData.scheduledStartTime)
            const minTime = new Date()
            minTime.setMinutes(minTime.getMinutes() + 15)
            if (startTime <= minTime) {
                errors.scheduledStartTime =
                    "Start time must be at least 15 minutes from now"
            }
        }

        if (formData.description.length > 500) {
            errors.description = "Description must be 500 characters or less"
        }

        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!validateForm()) return

        setSubmitting(true)
        setError(null)

        try {
            const response = await fetch("/api/streams/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title.trim(),
                    platform: formData.platform,
                    scheduled_start_time: new Date(
                        formData.scheduledStartTime
                    ).toISOString(),
                    duration_minutes: formData.durationMinutes,
                    description: formData.description.trim(),
                    notification_methods: formData.notificationMethods,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to create schedule")
            }

            // Reset form
            setFormData({
                title: "",
                platform: ["twitch"],
                scheduledStartTime: "",
                durationMinutes: 60,
                description: "",
                notificationMethods: ["discord"],
            })
            setValidationErrors({})

            // Refresh schedules list
            await fetchSchedules()
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to create schedule"
            )
        } finally {
            setSubmitting(false)
        }
    }

    async function handleCancel(scheduleId: string) {
        try {
            const response = await fetch("/api/streams/schedule", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: scheduleId }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to cancel schedule")
            }

            await fetchSchedules()
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to cancel schedule"
            )
        }
    }

    function togglePlatform(platform: string) {
        setFormData(prev => ({
            ...prev,
            platform: prev.platform.includes(platform)
                ? prev.platform.filter(p => p !== platform)
                : [...prev.platform, platform],
        }))
    }

    function toggleNotificationMethod(method: string) {
        setFormData(prev => ({
            ...prev,
            notificationMethods: prev.notificationMethods.includes(method)
                ? prev.notificationMethods.filter(m => m !== method)
                : [...prev.notificationMethods, method],
        }))
    }

    return (
        <div className="space-y-6">
            {/* New Schedule Form */}
            <div className="rounded-lg border border-border bg-white p-4 dark:border-border dark:bg-background">
                <h3 className="mb-4 text-lg font-semibold text-foreground dark:text-foreground">
                    {t("newSchedule")}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label
                            htmlFor="stream-title"
                            className="block text-sm font-medium text-foreground dark:text-foreground"
                        >
                            {t("title")}
                        </label>
                        <input
                            id="stream-title"
                            type="text"
                            value={formData.title}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    title: e.target.value,
                                }))
                            }
                            maxLength={140}
                            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring dark:bg-card dark:text-foreground ${
                                validationErrors.title
                                    ? "border-red-500"
                                    : "border-input dark:border-input"
                            }`}
                            placeholder={t("title")}
                        />
                        {validationErrors.title && (
                            <p className="mt-1 text-xs text-red-500">
                                {validationErrors.title}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                            {formData.title.length}/140
                        </p>
                    </div>

                    {/* Platform Selection */}
                    <div>
                        <label className="block text-sm font-medium text-foreground dark:text-foreground">
                            {t("platform")}
                        </label>
                        <div className="mt-2 flex gap-4">
                            {["twitch", "kick"].map(platform => (
                                <label
                                    key={platform}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.platform.includes(
                                            platform
                                        )}
                                        onChange={() =>
                                            togglePlatform(platform)
                                        }
                                        className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                                    />
                                    <span className="text-sm text-foreground dark:text-foreground capitalize">
                                        {platform}
                                    </span>
                                </label>
                            ))}
                        </div>
                        {validationErrors.platform && (
                            <p className="mt-1 text-xs text-red-500">
                                {validationErrors.platform}
                            </p>
                        )}
                    </div>

                    {/* Scheduled Start Time */}
                    <div>
                        <label
                            htmlFor="stream-start-time"
                            className="block text-sm font-medium text-foreground dark:text-foreground"
                        >
                            {t("scheduledStart")}
                        </label>
                        <input
                            id="stream-start-time"
                            type="datetime-local"
                            value={formData.scheduledStartTime}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    scheduledStartTime: e.target.value,
                                }))
                            }
                            min={getMinDateTime()}
                            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring dark:bg-card dark:text-foreground ${
                                validationErrors.scheduledStartTime
                                    ? "border-red-500"
                                    : "border-input dark:border-input"
                            }`}
                        />
                        {validationErrors.scheduledStartTime && (
                            <p className="mt-1 text-xs text-red-500">
                                {validationErrors.scheduledStartTime}
                            </p>
                        )}
                    </div>

                    {/* Duration */}
                    <div>
                        <label
                            htmlFor="stream-duration"
                            className="block text-sm font-medium text-foreground dark:text-foreground"
                        >
                            {t("duration")}
                        </label>
                        <select
                            id="stream-duration"
                            value={formData.durationMinutes}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    durationMinutes: parseInt(
                                        e.target.value,
                                        10
                                    ),
                                }))
                            }
                            className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring dark:border-input dark:bg-card dark:text-foreground"
                        >
                            {DURATION_OPTIONS.map(duration => (
                                <option key={duration} value={duration}>
                                    {duration >= 60
                                        ? `${Math.floor(duration / 60)}h ${duration % 60}m`
                                        : `${duration}m`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label
                            htmlFor="stream-description"
                            className="block text-sm font-medium text-foreground dark:text-foreground"
                        >
                            {t("description")}
                        </label>
                        <textarea
                            id="stream-description"
                            value={formData.description}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            maxLength={500}
                            rows={3}
                            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring dark:bg-card dark:text-foreground ${
                                validationErrors.description
                                    ? "border-red-500"
                                    : "border-input dark:border-input"
                            }`}
                            placeholder={t("description")}
                        />
                        {validationErrors.description && (
                            <p className="mt-1 text-xs text-red-500">
                                {validationErrors.description}
                            </p>
                        )}
                    </div>

                    {/* Notification Methods */}
                    <div>
                        <label className="block text-sm font-medium text-foreground dark:text-foreground">
                            {t("notificationMethods")}
                        </label>
                        <div className="mt-2 flex gap-4">
                            {["discord", "telegram"].map(method => (
                                <label
                                    key={method}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.notificationMethods.includes(
                                            method
                                        )}
                                        onChange={() =>
                                            toggleNotificationMethod(method)
                                        }
                                        className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                                    />
                                    <span className="text-sm text-foreground dark:text-foreground capitalize">
                                        {method === "discord"
                                            ? t("discord")
                                            : t("telegram")}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <>
                                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                {t("saving")}
                            </>
                        ) : (
                            t("save")
                        )}
                    </button>
                </form>
            </div>

            {/* Upcoming Schedules */}
            <div className="rounded-lg border border-border bg-white p-4 dark:border-border dark:bg-background">
                <h3 className="mb-4 text-lg font-semibold text-foreground dark:text-foreground">
                    {t("upcomingStreams")}
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-blue-500"></div>
                    </div>
                ) : schedules.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                        {t("noScheduledStreams")}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {schedules.map(schedule => (
                            <div
                                key={schedule.id}
                                className="flex items-center justify-between rounded-md border border-gray-100 p-3 dark:border-border"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-foreground dark:text-foreground">
                                        {schedule.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(
                                            schedule.scheduledStartTime
                                        ).toLocaleString()}{" "}
                                        · {schedule.platform.join(", ")} ·{" "}
                                        {schedule.durationMinutes >= 60
                                            ? `${Math.floor(schedule.durationMinutes / 60)}h ${schedule.durationMinutes % 60}m`
                                            : `${schedule.durationMinutes}m`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleCancel(schedule.id)}
                                    className="ml-4 shrink-0 rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400"
                                >
                                    {t("cancel")}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
