"use client"

import { useCallback, useEffect, useRef } from "react"

interface UsePublicationQueueOptions {
    enabled?: boolean
    interval?: number // milliseconds
}

export function usePublicationQueue({
    enabled = true,
    interval = 60000, // 1 minute
}: UsePublicationQueueOptions = {}) {
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const processQueue = useCallback(async () => {
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
    }, [])

    useEffect(() => {
        if (!enabled) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            return
        }

        processQueue()

        intervalRef.current = setInterval(processQueue, interval)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [enabled, interval, processQueue])

    return { processQueue }
}
