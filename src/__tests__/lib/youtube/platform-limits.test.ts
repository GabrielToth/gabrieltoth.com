/**
 * Unit Tests: Platform Limits
 * Tests for validateVideoForPlatform and PLATFORM_LIMITS
 */

import { describe, it, expect } from "vitest"
import {
    validateVideoForPlatform,
    getPlatformLimit,
    PLATFORM_LIMITS,
} from "@/lib/youtube/platform-limits"

describe("PLATFORM_LIMITS", () => {
    it("defines YouTube limits", () => {
        const yt = PLATFORM_LIMITS.youtube
        expect(yt).toBeDefined()
        expect(yt.maxFileSizeBytes).toBe(256 * 1024 * 1024 * 1024)
        expect(yt.maxDurationSeconds).toBe(432000)
    })

    it("defines TikTok limits", () => {
        const tk = PLATFORM_LIMITS.tiktok
        expect(tk).toBeDefined()
        expect(tk.maxDurationSeconds).toBe(600)
    })

    it("defines Instagram limits", () => {
        const ig = PLATFORM_LIMITS.instagram
        expect(ig).toBeDefined()
        expect(ig.maxFileSizeBytes).toBe(650 * 1024 * 1024)
    })

    it("defines Facebook limits", () => {
        const fb = PLATFORM_LIMITS.facebook
        expect(fb).toBeDefined()
        expect(fb.maxFileSizeBytes).toBe(10 * 1024 * 1024 * 1024)
    })
})

describe("getPlatformLimit", () => {
    it("returns limits for valid platform", () => {
        const limits = getPlatformLimit("youtube")
        expect(limits).toBeDefined()
        expect(limits!.maxDurationSeconds).toBe(432000)
    })

    it("is case-insensitive", () => {
        const limits = getPlatformLimit("YouTube")
        expect(limits).toBeDefined()
    })

    it("returns undefined for unknown platform", () => {
        const limits = getPlatformLimit("twitch")
        expect(limits).toBeUndefined()
    })
})

describe("validateVideoForPlatform", () => {
    const validFileSize = 100 * 1024 * 1024 // 100MB
    const validDuration = 120 // 2 minutes

    it("returns valid for YouTube-valid video", () => {
        const result = validateVideoForPlatform(
            "youtube",
            validFileSize,
            validDuration
        )
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })

    it("returns errors for file exceeding YouTube limit", () => {
        const result = validateVideoForPlatform(
            "youtube",
            300 * 1024 * 1024 * 1024, // 300GB > 256GB
            validDuration
        )
        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors[0].toLowerCase()).toContain("exceed")
    })

    it("returns errors for duration exceeding TikTok limit", () => {
        const result = validateVideoForPlatform("tiktok", validFileSize, 900)
        expect(result.valid).toBe(false)
        expect(result.errors[0].toLowerCase()).toContain("exceed")
    })

    it("returns errors for duration below YouTube minimum", () => {
        const result = validateVideoForPlatform("youtube", validFileSize, 10)
        expect(result.valid).toBe(false)
        expect(result.errors[0].toLowerCase()).toContain("below")
    })

    it("returns valid for TikTok video within limits", () => {
        const result = validateVideoForPlatform("tiktok", 50 * 1024 * 1024, 300)
        expect(result.valid).toBe(true)
    })

    it("returns error for unsupported platform", () => {
        const result = validateVideoForPlatform(
            "twitch",
            validFileSize,
            validDuration
        )
        expect(result.valid).toBe(false)
        expect(result.errors[0]).toContain("Unsupported")
    })

    it("validates Facebook video", () => {
        const result = validateVideoForPlatform("facebook", 5 * 1024 * 1024 * 1024, 3600)
        expect(result.valid).toBe(true)
    })

    it("returns multiple errors for multiple violations", () => {
        const result = validateVideoForPlatform("tiktok", 600 * 1024 * 1024, 700)
        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThanOrEqual(2)
    })
})
