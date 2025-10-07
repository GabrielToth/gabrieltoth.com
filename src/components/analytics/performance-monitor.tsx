"use client"

import { useEffect, useState } from "react"
import { type Metric } from "web-vitals"

interface PerformanceMetrics {
    lcp?: number
    fcp?: number
    cls?: number
    ttfb?: number
    resourceCount?: number
    bundleSize?: number
}

interface PerformanceMonitorProps {
    enabled?: boolean
}

const PerformanceMonitor = ({
    enabled = process.env.NODE_ENV === "development",
}: PerformanceMonitorProps) => {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({})
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (!enabled) return

        // Listen for Web Vitals metrics
        const handleMetric = (metric: Metric) => {
            setMetrics(prev => ({
                ...prev,
                [metric.name.toLowerCase()]: metric.value,
            }))
        }

        // Listen for custom events from WebVitalsReport
        const handleWebVital = ((event: CustomEvent) => {
            handleMetric(event.detail)
        }) as EventListener

        window.addEventListener("web-vital", handleWebVital)

        let interval: any

        // Get resource count
        if (typeof window !== "undefined" && "performance" in window) {
            const updateResourceMetrics = () => {
                const resources = performance.getEntriesByType("resource")
                const totalSize = resources.reduce((acc, resource) => {
                    const resourceEntry = resource as PerformanceResourceTiming
                    return acc + (resourceEntry.transferSize || 0)
                }, 0)

                setMetrics(prev => ({
                    ...prev,
                    resourceCount: resources.length,
                    bundleSize: totalSize,
                }))
            }

            updateResourceMetrics()

            // Update every 5 seconds
            interval = setInterval(updateResourceMetrics, 5000)
        }

        return () => {
            window.removeEventListener("web-vital", handleWebVital)
            if (interval) clearInterval(interval)
        }
    }, [enabled])

    const getMetricColor = (metric: string, value: number): string => {
        const thresholds: Record<string, [number, number]> = {
            lcp: [2500, 4000],
            fcp: [1800, 3000],
            cls: [0.1, 0.25],
            ttfb: [800, 1800],
        }

        const [good, poor] = thresholds[metric] || [0, 0]

        if (value <= good) return "text-green-500"
        if (value <= poor) return "text-yellow-500"
        return "text-red-500"
    }

    const formatMetric = (metric: string, value: number): string => {
        if (metric === "cls") return value.toFixed(3)
        if (metric === "bundleSize") return `${(value / 1024).toFixed(1)}KB`
        if (metric === "resourceCount") return value.toString()
        return `${Math.round(value)}ms`
    }

    if (!enabled) return null

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                title="Performance Monitor"
            >
                📊
            </button>

            {/* Performance Panel */}
            {isVisible && (
                <div className="fixed bottom-16 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 min-w-[280px] border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                            Performance Metrics
                        </h3>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-2 text-sm">
                        {/* Core Web Vitals */}
                        <div className="border-b border-gray-200 dark:border-gray-600 pb-2">
                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Core Web Vitals
                            </h4>
                            {metrics.lcp && (
                                <div className="flex justify-between">
                                    <span>LCP:</span>
                                    <span
                                        className={getMetricColor(
                                            "lcp",
                                            metrics.lcp
                                        )}
                                    >
                                        {formatMetric("lcp", metrics.lcp)}
                                    </span>
                                </div>
                            )}
                            {metrics.fcp && (
                                <div className="flex justify-between">
                                    <span>FCP:</span>
                                    <span
                                        className={getMetricColor(
                                            "fcp",
                                            metrics.fcp
                                        )}
                                    >
                                        {formatMetric("fcp", metrics.fcp)}
                                    </span>
                                </div>
                            )}
                            {metrics.cls !== undefined && (
                                <div className="flex justify-between">
                                    <span>CLS:</span>
                                    <span
                                        className={getMetricColor(
                                            "cls",
                                            metrics.cls
                                        )}
                                    >
                                        {formatMetric("cls", metrics.cls)}
                                    </span>
                                </div>
                            )}
                            {metrics.ttfb && (
                                <div className="flex justify-between">
                                    <span>TTFB:</span>
                                    <span
                                        className={getMetricColor(
                                            "ttfb",
                                            metrics.ttfb
                                        )}
                                    >
                                        {formatMetric("ttfb", metrics.ttfb)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Resource Metrics */}
                        <div>
                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Resources
                            </h4>
                            {metrics.resourceCount && (
                                <div className="flex justify-between">
                                    <span>Count:</span>
                                    <span className="text-blue-600">
                                        {formatMetric(
                                            "resourceCount",
                                            metrics.resourceCount
                                        )}
                                    </span>
                                </div>
                            )}
                            {metrics.bundleSize && (
                                <div className="flex justify-between">
                                    <span>Size:</span>
                                    <span className="text-blue-600">
                                        {formatMetric(
                                            "bundleSize",
                                            metrics.bundleSize
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between text-xs">
                            <span className="text-green-500">● Good</span>
                            <span className="text-yellow-500">
                                ● Needs Improvement
                            </span>
                            <span className="text-red-500">● Poor</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default PerformanceMonitor
