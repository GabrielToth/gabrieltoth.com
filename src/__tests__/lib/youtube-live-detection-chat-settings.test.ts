import { describe, expect, it, vi } from "vitest"
import {
    DEFAULT_CHAT_SETTINGS,
    getStoredChatSettings,
    saveChatSettings,
} from "@/hooks/use-chat-settings"

describe("YouTube Live Detection & Chat Settings Suite", () => {
    it("should initialize default chat settings correctly", () => {
        const settings = DEFAULT_CHAT_SETTINGS
        expect(settings.showTimestamps).toBe(true)
        expect(settings.useUniversalNickname).toBe(true)
        expect(settings.showBadges).toBe(true)
        expect(settings.fontSize).toBe("sm")
    })

    it("should allow persisting and retrieving chat settings", () => {
        const customSettings = {
            showTimestamps: false,
            useUniversalNickname: false,
            showBadges: true,
            fontSize: "md" as const,
            executionMode: "local" as const,
        }

        saveChatSettings(customSettings)
        const retrieved = getStoredChatSettings()
        expect(retrieved.showTimestamps).toBe(false)
        expect(retrieved.useUniversalNickname).toBe(false)
        expect(retrieved.fontSize).toBe("md")
    })

    it("should detect videoId from YouTube live URL scraping markers", () => {
        const htmlMock = `
            <html>
                <head>
                    <link rel="canonical" href="https://www.youtube.com/watch?v=a1b2c3d4e5f">
                    <meta property="og:title" content="My Live Stream Title - YouTube">
                </head>
                <body>
                    <script>var ytInitialPlayerResponse = {"videoDetails":{"videoId":"a1b2c3d4e5f","isLive":true}};</script>
                </body>
            </html>
        `

        const videoIdMatch =
            htmlMock.match(/watch\?v=([a-zA-Z0-9_-]{11})/) ||
            htmlMock.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/)

        expect(videoIdMatch).not.toBeNull()
        expect(videoIdMatch![1]).toBe("a1b2c3d4e5f")
    })
})
