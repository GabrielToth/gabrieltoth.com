"use client"

import { useEffect, useState } from "react"

export interface ChatSettings {
    showTimestamps: boolean
    useUniversalNickname: boolean
    showBadges: boolean
    fontSize: "xs" | "sm" | "md" | "lg"
    executionMode: "cloud" | "local"
}

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
    showTimestamps: true,
    useUniversalNickname: true,
    showBadges: true,
    fontSize: "sm",
    executionMode: "local",
}

const SETTINGS_KEY = "live-chat-settings"

export function getStoredChatSettings(): ChatSettings {
    if (typeof window === "undefined") return DEFAULT_CHAT_SETTINGS
    try {
        const stored = localStorage.getItem(SETTINGS_KEY)
        if (stored) {
            return { ...DEFAULT_CHAT_SETTINGS, ...JSON.parse(stored) }
        }
    } catch {
        // Fallback
    }
    return DEFAULT_CHAT_SETTINGS
}

export function saveChatSettings(settings: ChatSettings): void {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
        window.dispatchEvent(new Event("chat-settings-updated"))
    } catch {
        // Fallback
    }
}

export function useChatSettings() {
    const [settings, setSettings] = useState<ChatSettings>(
        getStoredChatSettings
    )

    useEffect(() => {
        const handleUpdate = () => {
            setSettings(getStoredChatSettings())
        }
        window.addEventListener("chat-settings-updated", handleUpdate)
        window.addEventListener("storage", handleUpdate)
        return () => {
            window.removeEventListener("chat-settings-updated", handleUpdate)
            window.removeEventListener("storage", handleUpdate)
        }
    }, [])

    const updateSettings = (newSettings: Partial<ChatSettings>) => {
        const updated = { ...settings, ...newSettings }
        setSettings(updated)
        saveChatSettings(updated)
    }

    return { settings, updateSettings }
}
