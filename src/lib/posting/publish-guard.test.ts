import { describe, it, expect } from "vitest"
import {
    ERROR_LOCAL_MODE_ON_SERVER,
    isLocalExecutionRequest,
    validatePublishRequest,
} from "./publish-guard"

describe("publish guard — server side", () => {
    describe("LOCAL execution never reaches the backend", () => {
        it("detects local mode case-insensitively and trims whitespace", () => {
            expect(isLocalExecutionRequest("local")).toBe(true)
            expect(isLocalExecutionRequest(" LOCAL ")).toBe(true)
            expect(isLocalExecutionRequest("cloud")).toBe(false)
            expect(isLocalExecutionRequest(undefined)).toBe(false)
            expect(isLocalExecutionRequest(null)).toBe(false)
            expect(isLocalExecutionRequest(1)).toBe(false)
            expect(isLocalExecutionRequest({ mode: "local" })).toBe(false)
        })

        it("exposes a stable error code for local requests", () => {
            expect(ERROR_LOCAL_MODE_ON_SERVER).toBe("LOCAL_MODE_NOT_ALLOWED")
        })
    })

    describe("platform normalization", () => {
        it("resolves aliases and de-duplicates", () => {
            const result = validatePublishRequest({
                platforms: ["X", "twitter", "Meta", "FB"],
                contentType: "text_only",
                environment: "cloud",
                characterCount: 100,
            })

            expect(result.unknownPlatforms).toEqual([])
            expect(result.platforms.sort()).toEqual(["facebook", "twitter"])
        })

        it("flags unknown platforms instead of ignoring them", () => {
            const result = validatePublishRequest({
                platforms: ["myspace"],
                contentType: "text_only",
                environment: "cloud",
            })

            expect(result.ok).toBe(false)
            expect(result.unknownPlatforms).toEqual(["myspace"])
            expect(result.issues[0].platform).toBe("myspace")
        })

        it("rejects an empty platform list", () => {
            const result = validatePublishRequest({
                platforms: [],
                contentType: "text_only",
                environment: "cloud",
            })

            expect(result.ok).toBe(false)
        })
    })

    describe("CLOUD validation", () => {
        it("accepts text on Facebook, LinkedIn and X", () => {
            const result = validatePublishRequest({
                platforms: ["facebook", "linkedin", "twitter"],
                contentType: "text_only",
                environment: "cloud",
                characterCount: 250,
            })

            expect(result.ok).toBe(true)
            expect(result.compatiblePlatforms).toEqual([
                "facebook",
                "linkedin",
                "twitter",
            ])
        })

        it("rejects text-only on video platforms", () => {
            const result = validatePublishRequest({
                platforms: ["youtube", "twitch", "instagram"],
                contentType: "text_only",
                environment: "cloud",
            })

            expect(result.ok).toBe(false)
            expect(result.incompatiblePlatforms).toEqual([
                "youtube",
                "twitch",
                "instagram",
            ])
        })

        it("infers image_text when images are present", () => {
            const result = validatePublishRequest({
                platforms: ["instagram"],
                environment: "cloud",
                hasImages: true,
                characterCount: 100,
            })

            expect(result.contentType).toBe("image_text")
            expect(result.ok).toBe(true)
        })

        it("infers long_video for videos longer than 3 minutes", () => {
            const result = validatePublishRequest({
                platforms: ["youtube"],
                environment: "cloud",
                hasVideo: true,
                durationSeconds: 600,
            })

            expect(result.contentType).toBe("long_video")
            expect(result.ok).toBe(true)
        })

        it("reports character, size and duration violations together", () => {
            const result = validatePublishRequest({
                platforms: ["twitter"],
                contentType: "short_video",
                environment: "cloud",
                characterCount: 400,
                fileSizeBytes: 900 * 1024 * 1024,
                durationSeconds: 200,
            })

            expect(result.ok).toBe(false)
            const reasons = result.issues[0].reasons.join(" | ")
            expect(reasons).toContain("excede o limite")
            expect(reasons).toContain("excede o tempo limite")
            expect(reasons).toContain("excede o limite máximo permitido")
        })
    })

    describe("LOCAL validation", () => {
        it("rejects cloud-only platforms in local mode", () => {
            const result = validatePublishRequest({
                platforms: [
                    "facebook",
                    "instagram",
                    "tiktok",
                    "linkedin",
                    "kwai",
                ],
                contentType: "image_text",
                environment: "local",
                characterCount: 100,
                fileSizeBytes: 1024,
            })

            expect(result.ok).toBe(false)
            expect(result.compatiblePlatforms).toEqual([])
            expect(result.incompatiblePlatforms).toHaveLength(5)
            expect(result.issues[0].recommendedAction).toContain("Cloud")
        })

        it("keeps X text available in local mode", () => {
            const result = validatePublishRequest({
                platforms: ["twitter"],
                contentType: "text_only",
                environment: "local",
                characterCount: 140,
            })

            expect(result.ok).toBe(true)
            expect(result.compatiblePlatforms).toEqual(["twitter"])
        })

        it("does not grant local mode for YouTube community text", () => {
            const result = validatePublishRequest({
                platforms: ["youtube"],
                contentType: "text_only",
                environment: "local",
            })

            expect(result.ok).toBe(false)
            expect(result.issues[0].reasons.join(" ")).toContain("Comunidade")
        })
    })
})
