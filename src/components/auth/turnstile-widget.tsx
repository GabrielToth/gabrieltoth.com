"use client"

import { useEffect, useRef, useState } from "react"

interface TurnstileWidgetProps {
    onTokenChange: (token: string | null) => void
    theme?: "light" | "dark"
    size?: "normal" | "compact"
    language?: string
    className?: string
}

export default function TurnstileWidget({
    onTokenChange,
    theme = "light",
    size = "normal",
    language,
    className = "",
}: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const widgetIdRef = useRef<string | null>(null)

    useEffect(() => {
        // Load Cloudflare Turnstile script
        const scriptId = "turnstile-script"

        // Check if script already exists
        if (document.getElementById(scriptId)) {
            renderWidget()
            return
        }

        const script = document.createElement("script")
        script.id = scriptId
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"
        script.async = true
        script.defer = true

        script.onload = () => {
            renderWidget()
        }

        script.onerror = () => {
            setError("Failed to load CAPTCHA widget")
            setIsLoading(false)
        }

        document.head.appendChild(script)

        return () => {
            // Cleanup: remove rendered widget if component unmounts
            if (widgetIdRef.current && window.turnstile) {
                try {
                    window.turnstile.remove(widgetIdRef.current)
                } catch (err) {
                    console.warn("Error removing Turnstile widget:", err)
                }
            }
        }
    }, [])

    const renderWidget = () => {
        if (!containerRef.current) {
            setError("Container reference not found")
            setIsLoading(false)
            return
        }

        if (!window.turnstile) {
            setError("Turnstile API not available")
            setIsLoading(false)
            return
        }

        const siteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY

        if (!siteKey) {
            setError("CAPTCHA site key not configured")
            setIsLoading(false)
            return
        }

        try {
            widgetIdRef.current = window.turnstile.render("#turnstile-widget", {
                sitekey: siteKey,
                theme,
                size,
                language,
                callback: (token: string) => {
                    onTokenChange(token)
                },
                "error-callback": () => {
                    onTokenChange(null)
                    setError("CAPTCHA verification failed. Please try again.")
                },
                "expired-callback": () => {
                    onTokenChange(null)
                },
                "timeout-callback": () => {
                    onTokenChange(null)
                    setError(
                        "CAPTCHA verification timed out. Please try again."
                    )
                },
            })

            setIsLoading(false)
        } catch (err) {
            console.error("Error rendering Turnstile widget:", err)
            setError("Failed to render CAPTCHA widget")
            setIsLoading(false)
        }
    }

    return (
        <div className={`w-full ${className}`}>
            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {isLoading && (
                <div className="mb-4 p-4 bg-muted dark:bg-card border border-input dark:border-input rounded-lg flex items-center justify-center min-h-[78px]">
                    <div className="text-muted-foreground dark:text-muted-foreground text-sm">
                        Loading security verification...
                    </div>
                </div>
            )}

            <div
                id="turnstile-widget"
                ref={containerRef}
                className={`w-full ${isLoading ? "hidden" : ""}`}
            ></div>
        </div>
    )
}

// Type definitions for Turnstile API
declare global {
    interface Window {
        turnstile: {
            render: (
                containerId: string,
                options: Record<string, unknown>
            ) => string
            reset: (widgetId: string) => void
            remove: (widgetId: string) => void
            getResponse: (widgetId: string) => string | undefined
        }
    }
}
