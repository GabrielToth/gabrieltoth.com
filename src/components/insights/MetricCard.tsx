"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Heart, TrendingUp, Users } from "lucide-react"
import React from "react"

/**
 * Metric type definition
 */
export interface Metric {
    id: string
    name: string
    value: number
    change: number
    changePercent: number
    icon: string
    channel?: string
}

/**
 * MetricCardProps
 */
export interface MetricCardProps {
    metric: Metric
}

/**
 * Get icon component based on icon name
 */
const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
        users: <Users className="h-5 w-5" />,
        heart: <Heart className="h-5 w-5" />,
        "trending-up": <TrendingUp className="h-5 w-5" />,
        eye: <Eye className="h-5 w-5" />,
    }
    return iconMap[iconName] || <Users className="h-5 w-5" />
}

/**
 * MetricCard Component
 * Individual metric display with value, change, icon
 *
 * Features:
 * - Display metric name, value, change, and icon
 * - Show positive/negative change with color coding
 * - Responsive design
 * - Accessible
 */
export const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
    const isPositive = metric.change >= 0
    const changeColor = isPositive ? "text-green-600" : "text-red-600"
    const changeBgColor = isPositive ? "bg-green-50" : "bg-red-50"

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                        {metric.name}
                    </CardTitle>
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                        {getIconComponent(metric.icon)}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {/* Value */}
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {metric.value.toLocaleString()}
                    </div>

                    {/* Change */}
                    <div
                        className={`flex items-center gap-1 ${changeBgColor} rounded px-2 py-1 w-fit`}
                    >
                        <span
                            className={`text-xs sm:text-sm font-medium ${changeColor}`}
                        >
                            {isPositive ? "+" : ""}
                            {metric.change.toLocaleString()}
                        </span>
                        <span className={`text-xs font-medium ${changeColor}`}>
                            ({metric.changePercent.toFixed(2)}%)
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default MetricCard
