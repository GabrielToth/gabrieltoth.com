/**
 * Tests for /api/streams/schedule route
 * Covers CRUD operations, authentication, and validation
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { GET, POST, PUT, DELETE } from "./route"

// Mock getServerSession
vi.mock("@/lib/auth/get-server-session", () => ({
    getServerSession: vi.fn(),
}))

import { getServerSession } from "@/lib/auth/get-server-session"

// Mock the schedule service
vi.mock("@/lib/stream/schedule-service", () => {
    const mockService = {
        create: vi.fn(),
        getScheduled: vi.fn(),
        update: vi.fn(),
        cancel: vi.fn(),
        markAsLive: vi.fn(),
        markAsCompleted: vi.fn(),
    }
    return {
        getStreamScheduleService: vi.fn(() => mockService),
        resetStreamScheduleService: vi.fn(),
        StreamScheduleService: vi.fn(),
    }
})

import { getStreamScheduleService } from "@/lib/stream/schedule-service"

const mockUserSession = { user: { id: "user-1" } }
const TEST_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

const mockCreateData = {
    id: TEST_UUID,
    userId: "user-1",
    platform: ["twitch", "kick"],
    title: "Test Stream",
    description: "A test stream",
    scheduledStartTime: new Date(Date.now() + 86400000).toISOString(),
    durationMinutes: 60,
    status: "scheduled" as const,
    notificationMethods: ["discord"],
    notificationSent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
}

describe("GET /api/streams/schedule", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should return 401 without auth", async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)

        const request = new NextRequest("http://localhost/api/streams/schedule")
        const response = await GET(request)

        expect(response.status).toBe(401)
        const body = await response.json()
        expect(body.success).toBe(false)
        expect(body.error).toBe("UNAUTHORIZED")
    })

    it("should return scheduled streams", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockUserSession)
        const mockService = getStreamScheduleService()
        vi.mocked(mockService.getScheduled).mockResolvedValue([mockCreateData])

        const request = new NextRequest("http://localhost/api/streams/schedule")
        const response = await GET(request)

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.success).toBe(true)
        expect(body.data).toHaveLength(1)
        expect(body.data[0].title).toBe("Test Stream")
    })
})

describe("POST /api/streams/schedule", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should return 401 without auth", async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)

        const request = new NextRequest(
            "http://localhost/api/streams/schedule",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mockCreateData),
            }
        )
        const response = await POST(request)

        expect(response.status).toBe(401)
    })

    it("should create schedule and return 201", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockUserSession)
        const mockService = getStreamScheduleService()
        vi.mocked(mockService.create).mockResolvedValue(mockCreateData)

        const request = new NextRequest(
            "http://localhost/api/streams/schedule",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: ["twitch"],
                    title: "Test Stream",
                    scheduled_start_time: new Date(
                        Date.now() + 86400000
                    ).toISOString(),
                    duration_minutes: 60,
                }),
            }
        )
        const response = await POST(request)

        expect(response.status).toBe(201)
        const body = await response.json()
        expect(body.success).toBe(true)
        expect(body.data.title).toBe("Test Stream")
    })

    it("should return 400 without title", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockUserSession)

        const request = new NextRequest(
            "http://localhost/api/streams/schedule",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: ["twitch"],
                    scheduled_start_time: new Date(
                        Date.now() + 86400000
                    ).toISOString(),
                }),
            }
        )
        const response = await POST(request)

        expect(response.status).toBe(400)
        const body = await response.json()
        expect(body.error).toBe("VALIDATION_ERROR")
    })

    it("should validate the request with Zod schema (datetime format check)", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockUserSession)
        const mockService = getStreamScheduleService()
        vi.mocked(mockService.create).mockResolvedValue(mockCreateData)

        const request = new NextRequest(
            "http://localhost/api/streams/schedule",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    platform: ["twitch"],
                    title: "Test Stream",
                    scheduled_start_time: new Date(
                        Date.now() - 86400000
                    ).toISOString(),
                }),
            }
        )
        const response = await POST(request)

        expect(response.status).toBe(201)
        const body = await response.json()
        expect(body.success).toBe(true)
    })

    it("should handle go-live action", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockUserSession)
        const mockService = getStreamScheduleService()
        vi.mocked(mockService.markAsLive).mockResolvedValue({
            ...mockCreateData,
            status: "live",
        })

        const request = new NextRequest(
            "http://localhost/api/streams/schedule",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "go-live",
                    scheduleId: TEST_UUID,
                }),
            }
        )
        const response = await POST(request)

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.data.status).toBe("live")
    })
})

describe("PUT /api/streams/schedule", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should return 401 without auth", async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)

        const request = new NextRequest(
            "http://localhost/api/streams/schedule",
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: TEST_UUID, title: "Updated" }),
            }
        )
        const response = await PUT(request)

        expect(response.status).toBe(401)
    })

    it("should update schedule", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockUserSession)
        const mockService = getStreamScheduleService()
        vi.mocked(mockService.update).mockResolvedValue({
            ...mockCreateData,
            title: "Updated Title",
        })

        const request = new NextRequest(
            "http://localhost/api/streams/schedule",
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: TEST_UUID,
                    title: "Updated Title",
                }),
            }
        )
        const response = await PUT(request)

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.data.title).toBe("Updated Title")
    })
})

describe("DELETE /api/streams/schedule", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should return 401 without auth", async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)

        const request = new NextRequest(
            "http://localhost/api/streams/schedule",
            {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: TEST_UUID }),
            }
        )
        const response = await DELETE(request)

        expect(response.status).toBe(401)
    })

    it("should cancel schedule", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockUserSession)
        const mockService = getStreamScheduleService()
        vi.mocked(mockService.cancel).mockResolvedValue({
            ...mockCreateData,
            status: "cancelled",
        })

        const request = new NextRequest(
            "http://localhost/api/streams/schedule",
            {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: TEST_UUID }),
            }
        )
        const response = await DELETE(request)

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.data.status).toBe("cancelled")
    })
})
