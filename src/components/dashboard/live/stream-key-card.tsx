/**
 * StreamKeyCard Component
 * Displays and manages stream keys for Twitch and Kick platforms
 * Twitch: fetches via API (masked, toggle reveal, copy)
 * Kick: manual entry stored in localStorage
 */

"use client"

import { createLogger } from "@/lib/logger"
import { useEffect, useState } from "react"

const logger = createLogger("StreamKeyCard")

interface StreamKeyCardProps {
    platform: string
}

interface FetchState {
    loading: boolean
    key: string | null
    note?: string
    error: string | null
}

export function StreamKeyCard({ platform }: StreamKeyCardProps) {
    const [fetchState, setFetchState] = useState<FetchState>({
        loading: true,
        key: null,
        error: null,
    })
    const [revealed, setRevealed] = useState(false)
    const [copied, setCopied] = useState(false)
    const [kickKey, setKickKey] = useState("")
    const [kickSavedKey, setKickSavedKey] = useState("")
    const [kickSaving, setKickSaving] = useState(false)
    const [kickSaveMessage, setKickSaveMessage] = useState<{
        type: "success" | "error"
        text: string
    } | null>(null)

    // Load Kick key from localStorage on mount
    useEffect(() => {
        if (platform === "kick") {
            const saved = localStorage.getItem("kick_stream_key") || ""
            setKickSavedKey(saved)
            setKickKey(saved)
        }
    }, [platform])

    // Fetch stream key for Twitch on mount and platform change
    useEffect(() => {
        if (platform !== "twitch") {
            setFetchState({
                loading: false,
                key: null,
                error: null,
            })
            return
        }

        let cancelled = false

        async function fetchKey() {
            setFetchState(prev => ({ ...prev, loading: true, error: null }))

            try {
                const response = await fetch(
                    `/api/live/stream-key?platform=${platform}`
                )

                if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.error || "Failed to fetch stream key")
                }

                const data = await response.json()

                if (!cancelled) {
                    setFetchState({
                        loading: false,
                        key: data.key || null,
                        note: data.note,
                        error: null,
                    })
                }
            } catch (err) {
                if (!cancelled) {
                    logger.error("Failed to fetch stream key", {
                        error: err instanceof Error ? err.message : String(err),
                        platform,
                    })
                    setFetchState({
                        loading: false,
                        key: null,
                        error:
                            err instanceof Error
                                ? err.message
                                : "Unknown error",
                    })
                }
            }
        }

        fetchKey()

        return () => {
            cancelled = true
        }
    }, [platform])

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            logger.warn("Failed to copy to clipboard")
        }
    }

    const handleKickSave = () => {
        setKickSaving(true)
        setKickSaveMessage(null)

        try {
            if (!kickKey.trim()) {
                // Clearing the key
                localStorage.removeItem("kick_stream_key")
                setKickSavedKey("")
                setKickSaveMessage({
                    type: "success",
                    text: "Stream key cleared.",
                })
            } else {
                localStorage.setItem("kick_stream_key", kickKey.trim())
                setKickSavedKey(kickKey.trim())
                setKickSaveMessage({
                    type: "success",
                    text: "Stream key saved to browser.",
                })
            }
        } catch {
            setKickSaveMessage({
                type: "error",
                text: "Failed to save. Browser storage may be unavailable.",
            })
        } finally {
            setKickSaving(false)
            setTimeout(() => setKickSaveMessage(null), 3000)
        }
    }

    const handleRetry = () => {
        setFetchState(prev => ({ ...prev, loading: true, error: null }))
        // Re-trigger effect by toggling a state
        setFetchState(prev => ({ ...prev, loading: false }))
        // Re-fetch by re-running the effect
        setTimeout(() => {
            setFetchState({
                loading: true,
                key: null,
                error: null,
            })
        }, 0)
    }

    // Loading state
    if (fetchState.loading) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Stream Key
                </h3>
                <div className="flex items-center justify-center py-8">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500"></div>
                    <span className="ml-2 text-sm text-gray-500">
                        Loading stream key...
                    </span>
                </div>
            </div>
        )
    }

    // Error state
    if (fetchState.error) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Stream Key
                </h3>
                <div className="rounded-md bg-red-50 p-3 text-center dark:bg-red-950/30">
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {fetchState.error}
                    </p>
                    <button
                        onClick={handleRetry}
                        className="mt-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    // Empty state
    if (platform === "twitch" && !fetchState.key) {
        return (
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Stream Key
                </h3>
                <div className="rounded-md bg-gray-50 p-3 text-center dark:bg-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No stream key available. Ensure your Twitch account has
                        the required permissions.
                    </p>
                </div>
            </div>
        )
    }

    const displayKey =
        platform === "twitch"
            ? fetchState.key || ""
            : revealed
              ? kickSavedKey
              : kickSavedKey
                ? "•••••••••"
                : ""

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Stream Key
            </h3>

            {platform === "twitch" && fetchState.key && (
                <div className="space-y-4">
                    {/* Twitch: Stream key display */}
                    <div className="flex items-center gap-2">
                        <code className="flex-1 rounded-md bg-gray-100 px-3 py-2 font-mono text-sm dark:bg-gray-800 dark:text-gray-200">
                            {revealed
                                ? fetchState.key
                                : "••••••••••••••••••••••••••••••"}
                        </code>

                        {/* Show/Hide toggle */}
                        <button
                            onClick={() => setRevealed(!revealed)}
                            className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                            title={
                                revealed ? "Hide stream key" : "Show stream key"
                            }
                        >
                            {revealed ? (
                                /* Eye-off icon */
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                /* Eye icon */
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>

                        {/* Copy button */}
                        <button
                            onClick={() => handleCopy(fetchState.key || "")}
                            className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                            title={copied ? "Copied!" : "Copy to clipboard"}
                        >
                            {copied ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-green-500"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <rect
                                        x="9"
                                        y="9"
                                        width="13"
                                        height="13"
                                        rx="2"
                                        ry="2"
                                    />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {fetchState.note}
                    </p>

                    {/* Reset link */}
                    <a
                        href="https://dashboard.twitch.tv/settings/stream"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
                    >
                        Reset on Twitch &rarr;
                    </a>
                </div>
            )}

            {platform === "kick" && (
                <div className="space-y-4">
                    {/* Kick: Manual entry */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Stream Key
                        </label>
                        <div className="flex items-center gap-2">
                            {revealed && kickSavedKey ? (
                                <span className="flex-1 rounded-md bg-gray-100 px-3 py-2 font-mono text-sm dark:bg-gray-800 dark:text-gray-200">
                                    {kickSavedKey}
                                </span>
                            ) : (
                                <input
                                    type={revealed ? "text" : "password"}
                                    value={kickKey}
                                    onChange={e => setKickKey(e.target.value)}
                                    placeholder="Enter your Kick stream key..."
                                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                            )}

                            {/* Show/Hide toggle */}
                            <button
                                onClick={() => setRevealed(!revealed)}
                                className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                                title={
                                    revealed
                                        ? "Hide stream key"
                                        : "Show stream key"
                                }
                            >
                                {revealed ? (
                                    /* Eye-off icon */
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    /* Eye icon */
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>

                            {/* Copy button (only when saved key exists) */}
                            {kickSavedKey && (
                                <button
                                    onClick={() => handleCopy(kickSavedKey)}
                                    className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                                    title={
                                        copied ? "Copied!" : "Copy to clipboard"
                                    }
                                >
                                    {copied ? (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-green-500"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <rect
                                                x="9"
                                                y="9"
                                                width="13"
                                                height="13"
                                                rx="2"
                                                ry="2"
                                            />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Save button */}
                    <button
                        onClick={handleKickSave}
                        disabled={kickSaving}
                        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {kickSaving
                            ? "Saving..."
                            : kickKey.trim() !== kickSavedKey
                              ? "Save to Browser"
                              : "Saved"}
                    </button>

                    {kickSaveMessage && (
                        <p
                            className={`text-sm ${
                                kickSaveMessage.type === "success"
                                    ? "text-green-600"
                                    : "text-red-600"
                            }`}
                        >
                            {kickSaveMessage.text}
                        </p>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Kick does not provide stream keys via API. Your key is
                        stored in your browser only (localStorage).
                    </p>
                </div>
            )}
        </div>
    )
}
