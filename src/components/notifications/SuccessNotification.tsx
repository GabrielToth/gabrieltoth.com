"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, X } from "lucide-react"
import React from "react"

interface SuccessNotificationProps {
    title?: string
    message: string
    onDismiss?: () => void
    autoClose?: boolean
    autoCloseDelay?: number
}

export default function SuccessNotification({
    title = "Success",
    message,
    onDismiss,
    autoClose = true,
    autoCloseDelay = 5000,
}: SuccessNotificationProps) {
    React.useEffect(() => {
        if (autoClose && onDismiss) {
            const timer = setTimeout(onDismiss, autoCloseDelay)
            return () => clearTimeout(timer)
        }
    }, [autoClose, autoCloseDelay, onDismiss])

    return (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />

                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-green-900">{title}</h3>
                    <p className="text-sm text-green-800 mt-1">{message}</p>

                    {onDismiss && (
                        <div className="flex gap-2 mt-3">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onDismiss}
                                className="text-green-600 hover:text-green-700"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
