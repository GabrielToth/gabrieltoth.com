/**
 * GoLiveButton Component
 * Button to go live or end a stream for a scheduled stream
 */

"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"

interface GoLiveButtonProps {
    scheduleId: string
    platform: string
    isLive: boolean
    onStatusChange?: () => void
}

export function GoLiveButton({
    scheduleId,
    platform,
    isLive,
    onStatusChange,
}: GoLiveButtonProps) {
    const t = useTranslations("dashboard.live")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleGoLive() {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/streams/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "go-live",
                    scheduleId,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to go live")
            }

            // Open the platform's streaming URL
            const streamUrl =
                platform === "twitch"
                    ? "https://twitch.tv/broadcast"
                    : "https://kick.com/dashboard/settings/stream"

            window.open(streamUrl, "_blank", "noopener,noreferrer")

            onStatusChange?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to go live")
        } finally {
            setLoading(false)
        }
    }

    async function handleEndStream() {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/streams/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "end",
                    scheduleId,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to end stream")
            }

            onStatusChange?.()
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to end stream"
            )
        } finally {
            setLoading(false)
        }
    }

    if (error) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-xs text-error">{error}</span>
                <button
                    onClick={() => setError(null)}
                    className="text-xs text-primary hover:text-primary"
                >
                    Dismiss
                </button>
            </div>
        )
    }

    if (isLive) {
        return (
            <button
                onClick={handleEndStream}
                disabled={loading}
                className="inline-flex items-center rounded-md bg-error px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-error/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <span className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : null}
                {t("endStream")}
            </button>
        )
    }

    return (
        <button
            onClick={handleGoLive}
            disabled={loading}
className="inline-flex items-center rounded-md bg-success px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-success/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <span className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : null}
                {t("goLive")}
        </button>
    )
}
