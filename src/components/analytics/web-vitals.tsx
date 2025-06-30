"use client"

import { useEffect } from "react"
import { onCLS, onFCP, onLCP, onTTFB, type Metric } from "web-vitals"

interface WebVitalsReportProps {
    onMetric?: (metric: Metric) => void
}

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void
        va?: (
            action: string,
            event: string,
            data: Record<string, unknown>
        ) => void
    }
}

function sendToAnalytics(metric: Metric) {
    // Send to Google Analytics if available
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", metric.name, {
            custom_parameter_1: metric.value,
            custom_parameter_2: metric.id,
            custom_parameter_3: metric.name,
        })
    }

    // Send to Vercel Analytics if available
    if (typeof window !== "undefined" && window.va) {
        window.va("track", "Web Vitals", {
            metric: metric.name,
            value: metric.value,
            id: metric.id,
        })
    }

    // Console log for development
    if (process.env.NODE_ENV === "development") {
        console.log(`[Web Vitals] ${metric.name}:`, {
            value: metric.value,
            id: metric.id,
            rating: getVitalRating(metric),
        })
    }
}

function getVitalRating(metric: Metric): "good" | "needs-improvement" | "poor" {
    const thresholds = {
        CLS: [0.1, 0.25],
        FCP: [1800, 3000],
        LCP: [2500, 4000],
        TTFB: [800, 1800],
    }

    const [good, poor] = thresholds[metric.name as keyof typeof thresholds] || [
        0, 0,
    ]

    if (metric.value <= good) return "good"
    if (metric.value <= poor) return "needs-improvement"
    return "poor"
}

const WebVitalsReport = ({ onMetric }: WebVitalsReportProps) => {
    useEffect(() => {
        const handleMetric = (metric: Metric) => {
            sendToAnalytics(metric)
            onMetric?.(metric)
        }

        // Capture all Core Web Vitals
        onCLS(handleMetric)
        onFCP(handleMetric)
        onLCP(handleMetric)
        onTTFB(handleMetric)

        // Performance observer for additional metrics
        if (typeof window !== "undefined" && "PerformanceObserver" in window) {
            // Observe navigation timing
            const navObserver = new PerformanceObserver(list => {
                list.getEntries().forEach(entry => {
                    if (entry.entryType === "navigation") {
                        const navEntry = entry as PerformanceNavigationTiming

                        // Custom metrics
                        const domContentLoaded =
                            navEntry.domContentLoadedEventEnd -
                            navEntry.domContentLoadedEventStart
                        const loadComplete =
                            navEntry.loadEventEnd - navEntry.loadEventStart

                        if (process.env.NODE_ENV === "development") {
                            console.log("[Performance] Navigation Timing:", {
                                domContentLoaded,
                                loadComplete,
                                domInteractive:
                                    navEntry.domInteractive -
                                    navEntry.fetchStart,
                                domComplete:
                                    navEntry.domComplete - navEntry.fetchStart,
                            })
                        }
                    }
                })
            })

            // Observe resource timing
            const resourceObserver = new PerformanceObserver(list => {
                list.getEntries().forEach(entry => {
                    if (entry.entryType === "resource") {
                        const resourceEntry = entry as PerformanceResourceTiming

                        // Check for slow resources (> 1s)
                        if (resourceEntry.duration > 1000) {
                            if (process.env.NODE_ENV === "development") {
                                console.warn("[Performance] Slow Resource:", {
                                    name: resourceEntry.name,
                                    duration: resourceEntry.duration,
                                    size: resourceEntry.transferSize,
                                })
                            }
                        }
                    }
                })
            })

            try {
                navObserver.observe({ entryTypes: ["navigation"] })
                resourceObserver.observe({ entryTypes: ["resource"] })
            } catch (error) {
                console.warn("Performance observer not supported:", error)
            }

            return () => {
                navObserver.disconnect()
                resourceObserver.disconnect()
            }
        }
    }, [onMetric])

    return null
}

export default WebVitalsReport
