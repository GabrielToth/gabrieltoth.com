/**
 * API Route: /api/streams/schedule
 * CRUD operations for scheduled streams
 * All endpoints require authentication
 *
 * GET  - List user's scheduled streams
 * POST - Create a new scheduled stream
 * PUT  - Update a scheduled stream
 * DELETE - Cancel a scheduled stream
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getStreamScheduleService } from "@/lib/stream/schedule-service"
import { notifyStreamScheduled } from "@/lib/notifications/discord-stream-notifier"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const logger = createLogger("StreamScheduleEndpoint")

// Zod schemas for request validation
const platformEnum = z.enum(["twitch", "kick"])
const notificationMethodEnum = z.enum(["discord", "telegram"])

const createStreamSchema = z.object({
    platform: z.array(platformEnum).min(1, "At least one platform is required"),
    title: z
        .string()
        .min(1, "Title is required")
        .max(140, "Title must be 140 characters or less"),
    description: z
        .string()
        .max(500, "Description must be 500 characters or less")
        .optional(),
    scheduled_start_time: z.string().datetime("Invalid datetime format"),
    duration_minutes: z
        .number()
        .int()
        .min(15, "Duration must be at least 15 minutes")
        .max(480, "Duration must be at most 480 minutes")
        .optional(),
    notification_methods: z.array(notificationMethodEnum).optional(),
})

const updateStreamSchema = z.object({
    id: z.string().uuid("Invalid stream ID"),
    title: z
        .string()
        .min(1, "Title is required")
        .max(140, "Title must be 140 characters or less")
        .optional(),
    description: z.string().max(500).optional(),
    scheduled_start_time: z.string().datetime().optional(),
    duration_minutes: z.number().int().min(15).max(480).optional(),
    platform: z.array(platformEnum).min(1).optional(),
    notification_methods: z.array(notificationMethodEnum).optional(),
})

const cancelStreamSchema = z.object({
    id: z.string().uuid("Invalid stream ID"),
})

const goLiveSchema = z.object({
    action: z.literal("go-live"),
    scheduleId: z.string().uuid("Invalid stream ID"),
})

const endStreamSchema = z.object({
    action: z.literal("end"),
    scheduleId: z.string().uuid("Invalid stream ID"),
})

/**
 * GET /api/streams/schedule
 * List all scheduled streams for the authenticated user
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const scheduleService = getStreamScheduleService()
        const streams = await scheduleService.getScheduled(session.user.id)

        return NextResponse.json({
            success: true,
            data: streams,
        })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to list scheduled streams", err)
        return NextResponse.json(
            { success: false, error: "INTERNAL_ERROR" },
            { status: 500 }
        )
    }
}

/**
 * POST /api/streams/schedule
 * Create a new scheduled stream or perform actions (go-live/end)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const body = await request.json()

        // Check if this is an action (go-live or end)
        if (body.action === "go-live") {
            const parsed = goLiveSchema.safeParse(body)
            if (!parsed.success) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "VALIDATION_ERROR",
                        details: parsed.error.flatten(),
                    },
                    { status: 400 }
                )
            }

            const scheduleService = getStreamScheduleService()
            const stream = await scheduleService.markAsLive(
                parsed.data.scheduleId,
                session.user.id
            )

            return NextResponse.json({ success: true, data: stream })
        }

        if (body.action === "end") {
            const parsed = endStreamSchema.safeParse(body)
            if (!parsed.success) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "VALIDATION_ERROR",
                        details: parsed.error.flatten(),
                    },
                    { status: 400 }
                )
            }

            const scheduleService = getStreamScheduleService()
            const stream = await scheduleService.markAsCompleted(
                parsed.data.scheduleId,
                session.user.id
            )

            return NextResponse.json({ success: true, data: stream })
        }

        // Create new scheduled stream
        const parsed = createStreamSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    details: parsed.error.flatten(),
                },
                { status: 400 }
            )
        }

        const scheduleService = getStreamScheduleService()
        const stream = await scheduleService.create({
            userId: session.user.id,
            platform: parsed.data.platform,
            title: parsed.data.title,
            description: parsed.data.description,
            scheduledStartTime: parsed.data.scheduled_start_time,
            durationMinutes: parsed.data.duration_minutes,
            notificationMethods: parsed.data.notification_methods,
        })

        // Send Discord notification if configured
        if (
            !parsed.data.notification_methods ||
            parsed.data.notification_methods.includes("discord")
        ) {
            try {
                await notifyStreamScheduled(
                    parsed.data.title,
                    parsed.data.platform,
                    parsed.data.scheduled_start_time,
                    parsed.data.duration_minutes || 60
                )
            } catch (notifyError) {
                logger.warn("Failed to send Discord notification", {
                    error: notifyError,
                })
            }
        }

        return NextResponse.json(
            { success: true, data: stream },
            { status: 201 }
        )
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to create scheduled stream", err)
        return NextResponse.json(
            { success: false, error: "INTERNAL_ERROR" },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/streams/schedule
 * Update a scheduled stream
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const body = await request.json()
        const parsed = updateStreamSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    details: parsed.error.flatten(),
                },
                { status: 400 }
            )
        }

        const scheduleService = getStreamScheduleService()
        const stream = await scheduleService.update(
            parsed.data.id,
            session.user.id,
            {
                title: parsed.data.title,
                description: parsed.data.description,
                scheduledStartTime: parsed.data.scheduled_start_time,
                durationMinutes: parsed.data.duration_minutes,
                platform: parsed.data.platform,
                notificationMethods: parsed.data.notification_methods,
            }
        )

        return NextResponse.json({ success: true, data: stream })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to update scheduled stream", err)
        return NextResponse.json(
            { success: false, error: "INTERNAL_ERROR" },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/streams/schedule
 * Cancel a scheduled stream
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const body = await request.json()
        const parsed = cancelStreamSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "VALIDATION_ERROR",
                    details: parsed.error.flatten(),
                },
                { status: 400 }
            )
        }

        const scheduleService = getStreamScheduleService()
        const stream = await scheduleService.cancel(
            parsed.data.id,
            session.user.id
        )

        return NextResponse.json({ success: true, data: stream })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to cancel scheduled stream", err)
        return NextResponse.json(
            { success: false, error: "INTERNAL_ERROR" },
            { status: 500 }
        )
    }
}
