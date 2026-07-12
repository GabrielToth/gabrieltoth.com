/**
 * Tests for StreamScheduleService
 * Covers CRUD operations and validation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
    getStreamScheduleService,
    resetStreamScheduleService,
} from "./schedule-service"
import type { CreateScheduledStreamInput } from "./schedule-service"

// Mock supabase client
vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => mockSupabaseClient),
}))

const mockSupabaseClient = {
    from: vi.fn(),
}

function createMockQueryBuilder() {
    const builder = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
    }
    return builder
}

const validCreateInput: CreateScheduledStreamInput = {
    userId: "user-1",
    platform: ["twitch", "kick"],
    title: "Test Stream",
    description: "A test stream",
    scheduledStartTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    durationMinutes: 60,
    notificationMethods: ["discord"],
}

describe("StreamScheduleService", () => {
    let service = getStreamScheduleService()

    beforeEach(() => {
        resetStreamScheduleService()
        service = getStreamScheduleService()
        vi.clearAllMocks()

        // Default mock: from() returns a query builder
        mockSupabaseClient.from.mockReturnValue(createMockQueryBuilder())
    })

    afterEach(() => {
        resetStreamScheduleService()
    })

    describe("create", () => {
        it("should create a scheduled stream with valid data", async () => {
            const mockData = {
                id: "stream-1",
                user_id: "user-1",
                platform: ["twitch", "kick"],
                title: "Test Stream",
                description: "A test stream",
                scheduled_start_time: validCreateInput.scheduledStartTime,
                duration_minutes: 60,
                status: "scheduled",
                notification_methods: ["discord"],
                notification_sent: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }

            const builder = createMockQueryBuilder()
            builder.insert.mockReturnValue(builder)
            builder.select.mockReturnValue(builder)
            builder.single.mockResolvedValue({ data: mockData, error: null })
            mockSupabaseClient.from.mockReturnValue(builder)

            const result = await service.create(validCreateInput)

            expect(result.id).toBe("stream-1")
            expect(result.title).toBe("Test Stream")
            expect(result.status).toBe("scheduled")
            expect(result.platform).toEqual(["twitch", "kick"])
        })

        it("should reject schedule with past start time", async () => {
            const pastInput = {
                ...validCreateInput,
                scheduledStartTime: new Date(
                    Date.now() - 86400000
                ).toISOString(),
            }

            await expect(service.create(pastInput)).rejects.toThrow(
                "Scheduled start time must be in the future"
            )
        })

        it("should reject schedule with no platforms", async () => {
            const noPlatformInput = {
                ...validCreateInput,
                platform: [],
            }

            await expect(service.create(noPlatformInput)).rejects.toThrow(
                "At least one platform must be selected"
            )
        })

        it("should reject schedule with title > 140 chars", async () => {
            const longTitleInput = {
                ...validCreateInput,
                title: "a".repeat(141),
            }

            await expect(service.create(longTitleInput)).rejects.toThrow(
                "Title must be 140 characters or less"
            )
        })

        it("should reject schedule with empty title", async () => {
            const emptyTitleInput = {
                ...validCreateInput,
                title: "",
            }

            await expect(service.create(emptyTitleInput)).rejects.toThrow(
                "Title is required"
            )
        })
    })

    describe("getScheduled", () => {
        it("should return only user's scheduled streams", async () => {
            const mockData = [
                {
                    id: "stream-1",
                    user_id: "user-1",
                    platform: ["twitch"],
                    title: "Stream 1",
                    description: "",
                    scheduled_start_time: new Date(
                        Date.now() + 86400000
                    ).toISOString(),
                    duration_minutes: 60,
                    status: "scheduled",
                    notification_methods: ["discord"],
                    notification_sent: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            ]

            const builder = createMockQueryBuilder()
            builder.select.mockReturnValue(builder)
            builder.eq.mockReturnValue(builder)
            builder.order.mockResolvedValue({ data: mockData, error: null })
            mockSupabaseClient.from.mockReturnValue(builder)

            const result = await service.getScheduled("user-1")

            expect(result).toHaveLength(1)
            expect(result[0].userId).toBe("user-1")
            expect(result[0].status).toBe("scheduled")
        })

        it("should return empty array when no streams", async () => {
            const builder = createMockQueryBuilder()
            builder.select.mockReturnValue(builder)
            builder.eq.mockReturnValue(builder)
            builder.order.mockResolvedValue({ data: [], error: null })
            mockSupabaseClient.from.mockReturnValue(builder)

            const result = await service.getScheduled("user-1")

            expect(result).toEqual([])
        })
    })

    describe("getUpcoming", () => {
        it("should return streams within the time window", async () => {
            const mockData = [
                {
                    id: "stream-1",
                    user_id: "user-1",
                    platform: ["twitch"],
                    title: "Upcoming Stream",
                    description: "",
                    scheduled_start_time: new Date(
                        Date.now() + 600000
                    ).toISOString(), // 10 minutes from now
                    duration_minutes: 60,
                    status: "scheduled",
                    notification_methods: ["discord"],
                    notification_sent: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            ]

            const builder = createMockQueryBuilder()
            builder.select.mockReturnValue(builder)
            builder.eq.mockReturnValue(builder)
            builder.gte.mockReturnValue(builder)
            builder.lte.mockReturnValue(builder)
            builder.order.mockResolvedValue({ data: mockData, error: null })
            mockSupabaseClient.from.mockReturnValue(builder)

            const result = await service.getUpcoming("user-1", 30)

            expect(result).toHaveLength(1)
            expect(result[0].title).toBe("Upcoming Stream")
        })
    })

    describe("update", () => {
        it("should update stream fields", async () => {
            const mockData = {
                id: "stream-1",
                user_id: "user-1",
                platform: ["twitch"],
                title: "Updated Title",
                description: "",
                scheduled_start_time: new Date(
                    Date.now() + 86400000
                ).toISOString(),
                duration_minutes: 120,
                status: "scheduled",
                notification_methods: ["discord"],
                notification_sent: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }

            const builder = createMockQueryBuilder()
            builder.update.mockReturnValue(builder)
            builder.eq.mockReturnValue(builder)
            builder.select.mockReturnValue(builder)
            builder.single.mockResolvedValue({ data: mockData, error: null })
            mockSupabaseClient.from.mockReturnValue(builder)

            const result = await service.update("stream-1", "user-1", {
                title: "Updated Title",
                durationMinutes: 120,
            })

            expect(result.title).toBe("Updated Title")
            expect(result.durationMinutes).toBe(120)
        })
    })

    describe("cancel", () => {
        it("should cancel a scheduled stream", async () => {
            const mockData = {
                id: "stream-1",
                user_id: "user-1",
                platform: ["twitch"],
                title: "Test Stream",
                description: "",
                scheduled_start_time: new Date(
                    Date.now() + 86400000
                ).toISOString(),
                duration_minutes: 60,
                status: "cancelled",
                notification_methods: ["discord"],
                notification_sent: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }

            const builder = createMockQueryBuilder()
            builder.update.mockReturnValue(builder)
            builder.eq.mockReturnValue(builder)
            builder.select.mockReturnValue(builder)
            builder.single.mockResolvedValue({ data: mockData, error: null })
            mockSupabaseClient.from.mockReturnValue(builder)

            const result = await service.cancel("stream-1", "user-1")

            expect(result.status).toBe("cancelled")
        })
    })

    describe("markAsLive", () => {
        it("should mark stream as live", async () => {
            const mockData = {
                id: "stream-1",
                user_id: "user-1",
                platform: ["twitch"],
                title: "Test Stream",
                description: "",
                scheduled_start_time: new Date(
                    Date.now() + 86400000
                ).toISOString(),
                duration_minutes: 60,
                status: "live",
                notification_methods: ["discord"],
                notification_sent: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }

            const builder = createMockQueryBuilder()
            builder.update.mockReturnValue(builder)
            builder.eq.mockReturnValue(builder)
            builder.select.mockReturnValue(builder)
            builder.single.mockResolvedValue({ data: mockData, error: null })
            mockSupabaseClient.from.mockReturnValue(builder)

            const result = await service.markAsLive("stream-1", "user-1")

            expect(result.status).toBe("live")
        })
    })

    describe("markAsCompleted", () => {
        it("should mark stream as completed", async () => {
            const mockData = {
                id: "stream-1",
                user_id: "user-1",
                platform: ["twitch"],
                title: "Test Stream",
                description: "",
                scheduled_start_time: new Date(
                    Date.now() + 86400000
                ).toISOString(),
                duration_minutes: 60,
                status: "completed",
                notification_methods: ["discord"],
                notification_sent: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }

            const builder = createMockQueryBuilder()
            builder.update.mockReturnValue(builder)
            builder.eq.mockReturnValue(builder)
            builder.select.mockReturnValue(builder)
            builder.single.mockResolvedValue({ data: mockData, error: null })
            mockSupabaseClient.from.mockReturnValue(builder)

            const result = await service.markAsCompleted("stream-1", "user-1")

            expect(result.status).toBe("completed")
        })
    })

    describe("error handling", () => {
        it("should throw error on non-existent id", async () => {
            const builder = createMockQueryBuilder()
            builder.update.mockReturnValue(builder)
            builder.eq.mockReturnValue(builder)
            builder.select.mockReturnValue(builder)
            builder.single.mockResolvedValue({
                data: null,
                error: { code: "PGRST116", message: "Not found" },
            })
            mockSupabaseClient.from.mockReturnValue(builder)

            await expect(
                service.cancel("non-existent", "user-1")
            ).rejects.toThrow("Scheduled stream not found")
        })

        it("should throw error on database failure", async () => {
            const builder = createMockQueryBuilder()
            builder.insert.mockReturnValue(builder)
            builder.select.mockReturnValue(builder)
            builder.single.mockResolvedValue({
                data: null,
                error: { message: "Connection failed" },
            })
            mockSupabaseClient.from.mockReturnValue(builder)

            await expect(service.create(validCreateInput)).rejects.toThrow(
                "Database error: Connection failed"
            )
        })
    })
})
