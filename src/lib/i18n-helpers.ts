"use client"

import { useMessages } from "next-intl"

export function useNamespace<T = any>(namespace: string): T {
    const messages = useMessages() as any
    return (messages?.[namespace] ?? {}) as T
}
