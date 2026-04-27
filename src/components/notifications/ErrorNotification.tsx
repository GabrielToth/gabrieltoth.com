"use client"

import { Button } from "@/components/ui/button"
import { AlertCircle, RotateCcw, X } from "lucide-react"

interface ErrorNotificationProps {
    title?: string
    message: string
    details?: string
    onDismiss?: () => void
    onRetry?: () => void
    isRetrying?: boolean
}

export default function ErrorNotification({
    title = "Error",
    message,
    details,
    onDismiss,
    onRetry,
    isRetrying = false,
}: ErrorNotificationProps) {
    return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />

                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-red-900">{title}</h3>
                    <p className="text-sm text-red-800 mt-1">{message}</p>

                    {details && (
                        <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-red-700 hover:text-red-900">
                                Show details
                            </summary>
                            <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-32 text-red-900">
                                {details}
                            </pre>
                        </details>
                    )}

                    <div className="flex gap-2 mt-3">
                        {onRetry && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onRetry}
                                disabled={isRetrying}
                                className="gap-1"
                            >
                                <RotateCcw className="h-3 w-3" />
                                {isRetrying ? "Retrying..." : "Retry"}
                            </Button>
                        )}

                        {onDismiss && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onDismiss}
                                className="text-red-600 hover:text-red-700"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
