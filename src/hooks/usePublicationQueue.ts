"use client"

import { useSession } from "next-auth/react"
import { useCallback, useEffect, useRef } from "react"

interface UsePublicationQueueOptions {
    enabled?: boolean
    interval?: number // milliseconds
}

export function usePublicationQueue({
    enabled = true,
    interval = 60000, // 1 minute
}: UsePublicationQueueOptions = {}) {
    const { data: session } = useSession()
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const processQueue = useCallback(async () => {
        if (!session?.user) return

        try {
            const response = await fetch("/api/queue/process", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                console.error("Failed to process queue:", response.statusText)
            }

            const result = await response.json()

            if (result.processed > 0) {
                console.log(`Processed ${result.processed} publications`)

                // Trigger notification or update UI
                if (window.dispatchEvent) {
                    window.dispatchEvent(
                        new CustomEvent("publicationProcessed", {
                            detail: result,
                        })
                    )
                }
            }
        } catch (error) {
            console.error("Error processing queue:", error)
        }
    }, [session])

    useEffect(() => {
        if (!enabled || !session?.user) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            return
        }

        // Process immediately on mount
        processQueue()

        // Set up interval
        intervalRef.current = setInterval(processQueue, interval)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [enabled, session, interval, processQueue])

    return { processQueue }
}
