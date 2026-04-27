"use client"

import { usePublicationQueue } from "@/hooks/usePublicationQueue"
import React from "react"

interface PublicationQueueProviderProps {
    children: React.ReactNode
    enabled?: boolean
    interval?: number
}

/**
 * Provider that automatically processes publication queue
 * when user is logged in
 */
export function PublicationQueueProvider({
    children,
    enabled = true,
    interval = 60000, // 1 minute
}: PublicationQueueProviderProps) {
    usePublicationQueue({ enabled, interval })

    return <>{children}</>
}
