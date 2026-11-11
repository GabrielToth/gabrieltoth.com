import { describe, it, expect } from "vitest"
import {
    PLATFORM_CAPABILITY_MATRIX,
    PLATFORM_CAPABILITY_MATRIX_VERSION,
    PLATFORM_KEYS,
    POST_CONTENT_TYPES,
    normalizePlatformKey,
    validateCrossPlatformPublishing,
    type PlatformKey,
} from "./platform-capabilities"

describe("Platform Capabilities & Matrix Validation", () => {
    it("loads the shared JSON matrix used by the Rust core", () => {
        expect(PLATFORM_CAPABILITY_MATRIX_VERSION).toBe(1)
        expect(Object.keys(PLATFORM_CAPABILITY_MATRIX).sort()).toEqual(
            [...PLATFORM_KEYS].sort()
        )
        for (const platform of PLATFORM_KEYS) {
            const definition = PLATFORM_CAPABILITY_MATRIX[platform]
            expect(definition.platform).toBe(platform)
            expect(Object.keys(definition.capabilities).sort()).toEqual(
                [...POST_CONTENT_TYPES].sort()
            )
        }
    })

    it("normalizes aliases to matrix keys", () => {
        expect(normalizePlatformKey("X")).toBe("twitter")
        expect(normalizePlatformKey("Meta")).toBe("facebook")
        expect(normalizePlatformKey(" FB ")).toBe("facebook")
        expect(normalizePlatformKey("youtube")).toBe("youtube")
        expect(normalizePlatformKey("myspace")).toBeNull()
        expect(normalizePlatformKey("")).toBeNull()
    })

    it("should define all 9 platforms correctly with liveChat and content capabilities", () => {
        const platforms: PlatformKey[] = [
            "youtube",
            "facebook",
            "instagram",
            "twitch",
            "kick",
            "tiktok",
            "linkedin",
            "kwai",
            "twitter",
        ]

        for (const p of platforms) {
            const def = PLATFORM_CAPABILITY_MATRIX[p]
            expect(def).toBeDefined()
            expect(def.platform).toBe(p)
            expect(def.liveChat).toBeDefined()
            expect(def.capabilities.text_only).toBeDefined()
            expect(def.capabilities.image_text).toBeDefined()
            expect(def.capabilities.short_video).toBeDefined()
            expect(def.capabilities.long_video).toBeDefined()
        }
    })

    describe("validateCrossPlatformPublishing - Text Only", () => {
        it("should accept text_only on Facebook, LinkedIn, Twitter in cloud mode", () => {
            const validation = validateCrossPlatformPublishing({
                platforms: ["facebook", "linkedin", "twitter"],
                contentType: "text_only",
                environment: "cloud",
                characterCount: 200,
            })

            expect(validation.allValid).toBe(true)
            expect(validation.compatiblePlatforms).toEqual([
                "facebook",
                "linkedin",
                "twitter",
            ])
            expect(validation.incompatiblePlatforms).toHaveLength(0)
        })

        it("should reject text_only on YouTube, Twitch, Kick, Instagram, TikTok, Kwai", () => {
            const validation = validateCrossPlatformPublishing({
                platforms: [
                    "youtube",
                    "twitch",
                    "kick",
                    "instagram",
                    "tiktok",
                    "kwai",
                ],
                contentType: "text_only",
                environment: "cloud",
                characterCount: 100,
            })

            expect(validation.allValid).toBe(false)
            expect(validation.compatiblePlatforms).toHaveLength(0)
            expect(validation.incompatiblePlatforms).toEqual([
                "youtube",
                "twitch",
                "kick",
                "instagram",
                "tiktok",
                "kwai",
            ])
        })

        it("should reject Facebook in local mode because it requires cloud tokens", () => {
            const validation = validateCrossPlatformPublishing({
                platforms: ["facebook", "twitter"],
                contentType: "text_only",
                environment: "local",
                characterCount: 150,
            })

            expect(validation.allValid).toBe(false)
            expect(validation.compatiblePlatforms).toEqual(["twitter"])
            expect(validation.incompatiblePlatforms).toEqual(["facebook"])
            expect(validation.results.facebook.recommendedAction).toContain(
                "modo Cloud"
            )
        })

        it("should reject if character limit is exceeded on Twitter (max 280)", () => {
            const validation = validateCrossPlatformPublishing({
                platforms: ["twitter"],
                contentType: "text_only",
                environment: "cloud",
                characterCount: 300,
            })

            expect(validation.allValid).toBe(false)
            expect(validation.results.twitter.reasons[0]).toContain(
                "excede o limite"
            )
        })
    })

    describe("validateCrossPlatformPublishing - Video", () => {
        it("should allow short video on YouTube, TikTok, Instagram, Facebook in cloud", () => {
            const validation = validateCrossPlatformPublishing({
                platforms: ["youtube", "tiktok", "instagram", "facebook"],
                contentType: "short_video",
                environment: "cloud",
                durationSeconds: 45,
                fileSizeBytes: 50 * 1024 * 1024,
            })

            expect(validation.allValid).toBe(true)
        })

        it("should reject YouTube Shorts if duration exceeds 60s", () => {
            const validation = validateCrossPlatformPublishing({
                platforms: ["youtube"],
                contentType: "short_video",
                environment: "cloud",
                durationSeconds: 90,
            })

            expect(validation.allValid).toBe(false)
            expect(validation.results.youtube.reasons[0]).toContain(
                "excede o tempo limite de 60s"
            )
        })
    })

    describe("Live Chat Capabilities", () => {
        it("identifies official local livechat platforms correctly", () => {
            expect(
                PLATFORM_CAPABILITY_MATRIX.youtube.liveChat.allowedInLocal
            ).toBe(true)
            expect(
                PLATFORM_CAPABILITY_MATRIX.twitch.liveChat.allowedInLocal
            ).toBe(true)
            expect(
                PLATFORM_CAPABILITY_MATRIX.kick.liveChat.allowedInLocal
            ).toBe(true)

            // Restricted / enterprise
            expect(
                PLATFORM_CAPABILITY_MATRIX.tiktok.liveChat.allowedInLocal
            ).toBe(false)
            expect(
                PLATFORM_CAPABILITY_MATRIX.kwai.liveChat.allowedInLocal
            ).toBe(false)
            expect(
                PLATFORM_CAPABILITY_MATRIX.facebook.liveChat.allowedInLocal
            ).toBe(false)
        })
    })
})
