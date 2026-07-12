/**
 * Stream Schedule Service
 * Manages scheduled live streams with CRUD operations
 * Follows PublicationQueue pattern from src/lib/queue/publication-queue.ts
 */

import { createClient } from "@supabase/supabase-js"
import { createLogger } from "../logger"

const logger = createLogger("StreamScheduleService")

/**
 * Scheduled stream record
 */
export interface ScheduledStream {
    id: string
    userId: string
    platform: string[]
    title: string
    description: string
    scheduledStartTime: string
    durationMinutes: number
    status: "scheduled" | "cancelled" | "live" | "completed"
    notificationMethods: string[]
    notificationSent: boolean
    createdAt: string
    updatedAt: string
}

/**
 * Input for creating a scheduled stream
 */
export interface CreateScheduledStreamInput {
    userId: string
    platform: string[]
    title: string
    description?: string
    scheduledStartTime: string
    durationMinutes?: number
    notificationMethods?: string[]
}

/**
 * Input for updating a scheduled stream
 */
export interface UpdateScheduledStreamInput {
    title?: string
    description?: string
    scheduledStartTime?: string
    durationMinutes?: number
    platform?: string[]
    notificationMethods?: string[]
}

/**
 * Stream Schedule Service
 * CRUD operations for scheduled streams
 */
export class StreamScheduleService {
    private supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )

    /**
     * Validate a scheduled stream title
     */
    private validateTitle(title: string): void {
        if (!title || title.trim().length === 0) {
            throw new Error("Title is required")
        }
        if (title.length > 140) {
            throw new Error("Title must be 140 characters or less")
        }
    }

    /**
     * Validate scheduled start time is in the future
     */
    private validateScheduledStartTime(scheduledStartTime: string): void {
        const startTime = new Date(scheduledStartTime)
        if (isNaN(startTime.getTime())) {
            throw new Error("Invalid scheduled start time format")
        }
        if (startTime <= new Date()) {
            throw new Error("Scheduled start time must be in the future")
        }
    }

    /**
     * Validate at least one platform is selected
     */
    private validatePlatforms(platform: string[]): void {
        if (!platform || platform.length === 0) {
            throw new Error("At least one platform must be selected")
        }
        const validPlatforms = ["twitch", "kick"]
        for (const p of platform) {
            if (!validPlatforms.includes(p)) {
                throw new Error(
                    `Invalid platform: ${p}. Must be one of: ${validPlatforms.join(", ")}`
                )
            }
        }
    }

    /**
     * Validate create input
     */
    private validateCreateInput(input: CreateScheduledStreamInput): void {
        this.validateTitle(input.title)
        this.validatePlatforms(input.platform)
        this.validateScheduledStartTime(input.scheduledStartTime)
    }

    /**
     * Map database record to ScheduledStream interface
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapToScheduledStream(dbRecord: any): ScheduledStream {
        return {
            id: dbRecord.id,
            userId: dbRecord.user_id,
            platform: dbRecord.platform || [],
            title: dbRecord.title,
            description: dbRecord.description || "",
            scheduledStartTime: dbRecord.scheduled_start_time,
            durationMinutes: dbRecord.duration_minutes || 60,
            status: dbRecord.status,
            notificationMethods: dbRecord.notification_methods || ["discord"],
            notificationSent: dbRecord.notification_sent || false,
            createdAt: dbRecord.created_at,
            updatedAt: dbRecord.updated_at,
        }
    }

    /**
     * Create a new scheduled stream
     */
    async create(input: CreateScheduledStreamInput): Promise<ScheduledStream> {
        try {
            this.validateCreateInput(input)

            const { data, error } = await this.supabase
                .from("scheduled_streams")
                .insert({
                    user_id: input.userId,
                    platform: input.platform,
                    title: input.title.trim(),
                    description: (input.description || "").trim(),
                    scheduled_start_time: input.scheduledStartTime,
                    duration_minutes: input.durationMinutes || 60,
                    notification_methods: input.notificationMethods || [
                        "discord",
                    ],
                    status: "scheduled",
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            logger.info("Scheduled stream created", {
                userId: input.userId,
                streamId: data.id,
                title: input.title,
            })

            return this.mapToScheduledStream(data)
        } catch (error) {
            logger.error("Failed to create scheduled stream", {
                userId: input.userId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Get all scheduled streams for a user
     */
    async getScheduled(userId: string): Promise<ScheduledStream[]> {
        try {
            const { data, error } = await this.supabase
                .from("scheduled_streams")
                .select("*")
                .eq("user_id", userId)
                .eq("status", "scheduled")
                .order("scheduled_start_time", { ascending: true })

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            return (data || []).map(this.mapToScheduledStream)
        } catch (error) {
            logger.error("Failed to get scheduled streams", {
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Get upcoming streams within a time window (default: 30 minutes)
     */
    async getUpcoming(
        userId: string,
        minutes: number = 30
    ): Promise<ScheduledStream[]> {
        try {
            const now = new Date().toISOString()
            const windowEnd = new Date(
                Date.now() + minutes * 60 * 1000
            ).toISOString()

            const { data, error } = await this.supabase
                .from("scheduled_streams")
                .select("*")
                .eq("user_id", userId)
                .eq("status", "scheduled")
                .gte("scheduled_start_time", now)
                .lte("scheduled_start_time", windowEnd)
                .order("scheduled_start_time", { ascending: true })

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            return (data || []).map(this.mapToScheduledStream)
        } catch (error) {
            logger.error("Failed to get upcoming streams", {
                userId,
                minutes,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Get all scheduled streams (any status) for a user
     */
    async getAll(userId: string): Promise<ScheduledStream[]> {
        try {
            const { data, error } = await this.supabase
                .from("scheduled_streams")
                .select("*")
                .eq("user_id", userId)
                .order("scheduled_start_time", { ascending: true })

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            return (data || []).map(this.mapToScheduledStream)
        } catch (error) {
            logger.error("Failed to get all streams", {
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Update a scheduled stream
     */
    async update(
        id: string,
        userId: string,
        input: UpdateScheduledStreamInput
    ): Promise<ScheduledStream> {
        try {
            const updates: Record<string, unknown> = {}

            if (input.title !== undefined) {
                this.validateTitle(input.title)
                updates.title = input.title.trim()
            }
            if (input.description !== undefined) {
                updates.description = input.description.trim()
            }
            if (input.scheduledStartTime !== undefined) {
                this.validateScheduledStartTime(input.scheduledStartTime)
                updates.scheduled_start_time = input.scheduledStartTime
            }
            if (input.durationMinutes !== undefined) {
                updates.duration_minutes = input.durationMinutes
            }
            if (input.platform !== undefined) {
                this.validatePlatforms(input.platform)
                updates.platform = input.platform
            }
            if (input.notificationMethods !== undefined) {
                updates.notification_methods = input.notificationMethods
            }

            if (Object.keys(updates).length === 0) {
                throw new Error("No fields to update")
            }

            const { data, error } = await this.supabase
                .from("scheduled_streams")
                .update(updates)
                .eq("id", id)
                .eq("user_id", userId)
                .select()
                .single()

            if (error) {
                if (error.code === "PGRST116") {
                    throw new Error("Scheduled stream not found")
                }
                throw new Error(`Database error: ${error.message}`)
            }

            logger.info("Scheduled stream updated", { streamId: id, userId })

            return this.mapToScheduledStream(data)
        } catch (error) {
            logger.error("Failed to update scheduled stream", {
                streamId: id,
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Cancel a scheduled stream
     */
    async cancel(id: string, userId: string): Promise<ScheduledStream> {
        try {
            const { data, error } = await this.supabase
                .from("scheduled_streams")
                .update({ status: "cancelled" })
                .eq("id", id)
                .eq("user_id", userId)
                .select()
                .single()

            if (error) {
                if (error.code === "PGRST116") {
                    throw new Error("Scheduled stream not found")
                }
                throw new Error(`Database error: ${error.message}`)
            }

            logger.info("Scheduled stream cancelled", { streamId: id, userId })

            return this.mapToScheduledStream(data)
        } catch (error) {
            logger.error("Failed to cancel scheduled stream", {
                streamId: id,
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Mark a scheduled stream as live
     */
    async markAsLive(id: string, userId: string): Promise<ScheduledStream> {
        try {
            const { data, error } = await this.supabase
                .from("scheduled_streams")
                .update({ status: "live" })
                .eq("id", id)
                .eq("user_id", userId)
                .select()
                .single()

            if (error) {
                if (error.code === "PGRST116") {
                    throw new Error("Scheduled stream not found")
                }
                throw new Error(`Database error: ${error.message}`)
            }

            logger.info("Scheduled stream marked as live", {
                streamId: id,
                userId,
            })

            return this.mapToScheduledStream(data)
        } catch (error) {
            logger.error("Failed to mark stream as live", {
                streamId: id,
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Mark a scheduled stream as completed
     */
    async markAsCompleted(
        id: string,
        userId: string
    ): Promise<ScheduledStream> {
        try {
            const { data, error } = await this.supabase
                .from("scheduled_streams")
                .update({ status: "completed" })
                .eq("id", id)
                .eq("user_id", userId)
                .select()
                .single()

            if (error) {
                if (error.code === "PGRST116") {
                    throw new Error("Scheduled stream not found")
                }
                throw new Error(`Database error: ${error.message}`)
            }

            logger.info("Scheduled stream marked as completed", {
                streamId: id,
                userId,
            })

            return this.mapToScheduledStream(data)
        } catch (error) {
            logger.error("Failed to mark stream as completed", {
                streamId: id,
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }
}

/**
 * Get or create the StreamScheduleService singleton
 */
let scheduleServiceInstance: StreamScheduleService | null = null

export function getStreamScheduleService(): StreamScheduleService {
    if (!scheduleServiceInstance) {
        scheduleServiceInstance = new StreamScheduleService()
    }
    return scheduleServiceInstance
}

/**
 * Reset the StreamScheduleService singleton (useful for testing)
 */
export function resetStreamScheduleService(): void {
    scheduleServiceInstance = null
}
