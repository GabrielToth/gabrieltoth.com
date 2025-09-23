"use client"

import { useMessages } from "next-intl"

export function useNamespace<T = Record<string, unknown>>(
    namespace: string
): T {
    const messages = useMessages() as Record<string, unknown>
    return (messages?.[namespace] as T) ?? ({} as T)
}
