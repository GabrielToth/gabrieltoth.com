/**
 * Publication Queue Service
 * Manages scheduled posts and publication queue processing
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8
 */

import { createClient } from "@supabase/supabase-js"
import { CACHE_KEYS, CacheManager } from "../cache"
import { createLogger } from "../logger"
import type { SocialPlatform } from "../networks"

const logger = createLogger("PublicationQueue")

/**
 * Scheduled post record
 */
export interface ScheduledPost {
    id: string
    userId: string
    content: string
    scheduledTime: number
    status: "pending" | "processing" | "published" | "failed"
    retryCount: number
    lastRetryAt?: number
    errorMessage?: string
    networks: ScheduledPostNetwork[]
    createdAt: number
    updatedAt: number
}

/**
 * Scheduled post network record
 */
export interface ScheduledPostNetwork {
    id: string
    postId: string
    platform: SocialPlatform
    status: "pending" | "published" | "failed"
    externalId?: string
    externalUrl?: string
    errorMessage?: string
    createdAt: number
    updatedAt: number
}

/**
 * Publication history record
 */
export interface PublicationHistoryEntry {
    id: string
    userId: string
    postId?: string
    platform: SocialPlatform
    status: "success" | "failed" | "pending"
    externalId?: string
    externalUrl?: string
    errorMessage?: string
    publishedAt: number
    createdAt: number
}

/**
 * Publication Queue
 * Manages scheduled posts and publication processing
 */
export class PublicationQueue {
    private supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )

    /**
     * Create a scheduled post
     */
    async createScheduledPost(
        userId: string,
        content: string,
        scheduledTime: number,
        platforms: SocialPlatform[]
    ): Promise<ScheduledPost> {
        try {
            const now = Date.now()

            // Create the scheduled post
            const { data: post, error: postError } = await this.supabase
                .from("scheduled_posts")
                .insert({
                    user_id: userId,
                    content,
                    scheduled_time: new Date(scheduledTime),
                    status: "pending",
                    created_at: new Date(now),
                    updated_at: new Date(now),
                })
                .select()
                .single()

            if (postError) {
                throw new Error(`Database error: ${postError.message}`)
            }

            // Create network entries
            const networkEntries = platforms.map(platform => ({
                post_id: post.id,
                platform,
                status: "pending",
                created_at: new Date(now),
                updated_at: new Date(now),
            }))

            const { error: networkError } = await this.supabase
                .from("scheduled_post_networks")
                .insert(networkEntries)

            if (networkError) {
                throw new Error(`Database error: ${networkError.message}`)
            }

            // Invalidate cache
            await CacheManager.delete(CACHE_KEYS.PUBLICATION_QUEUE(userId))

            logger.info("Scheduled post created", {
                userId,
                postId: post.id,
                platforms,
                scheduledTime,
            })

            return this.mapDatabaseToScheduledPost(post, platforms)
        } catch (error) {
            logger.error("Failed to create scheduled post", {
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Get a scheduled post
     */
    async getScheduledPost(
        userId: string,
        postId: string
    ): Promise<ScheduledPost | null> {
        try {
            const { data: post, error: postError } = await this.supabase
                .from("scheduled_posts")
                .select("*")
                .eq("id", postId)
                .eq("user_id", userId)
                .single()

            if (postError) {
                if (postError.code === "PGRST116") {
                    return null
                }
                throw new Error(`Database error: ${postError.message}`)
            }

            // Get networks
            const { data: networks, error: networkError } = await this.supabase
                .from("scheduled_post_networks")
                .select("*")
                .eq("post_id", postId)

            if (networkError) {
                throw new Error(`Database error: ${networkError.message}`)
            }

            logger.info("Scheduled post retrieved", { userId, postId })

            return this.mapDatabaseToScheduledPost(
                post,
                (networks || []).map(n => n.platform)
            )
        } catch (error) {
            logger.error("Failed to retrieve scheduled post", {
                userId,
                postId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Get all scheduled posts for a user
     */
    async getUserScheduledPosts(userId: string): Promise<ScheduledPost[]> {
        try {
            const { data: posts, error: postError } = await this.supabase
                .from("scheduled_posts")
                .select("*")
                .eq("user_id", userId)
                .order("scheduled_time", { ascending: true })

            if (postError) {
                throw new Error(`Database error: ${postError.message}`)
            }

            const scheduledPosts: ScheduledPost[] = []

            for (const post of posts || []) {
                const { data: networks } = await this.supabase
                    .from("scheduled_post_networks")
                    .select("*")
                    .eq("post_id", post.id)

                scheduledPosts.push(
                    this.mapDatabaseToScheduledPost(
                        post,
                        (networks || []).map(n => n.platform)
                    )
                )
            }

            logger.info("User scheduled posts retrieved", {
                userId,
                count: scheduledPosts.length,
            })

            return scheduledPosts
        } catch (error) {
            logger.error("Failed to retrieve user scheduled posts", {
                userId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Get posts ready for publication
     */
    async getPostsReadyForPublication(): Promise<ScheduledPost[]> {
        try {
            const now = new Date()

            const { data: posts, error } = await this.supabase
                .from("scheduled_posts")
                .select("*")
                .eq("status", "pending")
                .lte("scheduled_time", now)
                .order("scheduled_time", { ascending: true })
                .limit(100)

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            const scheduledPosts: ScheduledPost[] = []

            for (const post of posts || []) {
                const { data: networks } = await this.supabase
                    .from("scheduled_post_networks")
                    .select("*")
                    .eq("post_id", post.id)

                scheduledPosts.push(
                    this.mapDatabaseToScheduledPost(
                        post,
                        (networks || []).map(n => n.platform)
                    )
                )
            }

            logger.info("Posts ready for publication retrieved", {
                count: scheduledPosts.length,
            })

            return scheduledPosts
        } catch (error) {
            logger.error("Failed to retrieve posts ready for publication", {
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Update post status
     */
    async updatePostStatus(
        postId: string,
        status: "pending" | "processing" | "published" | "failed"
    ): Promise<void> {
        try {
            const { error } = await this.supabase
                .from("scheduled_posts")
                .update({
                    status,
                    updated_at: new Date(),
                })
                .eq("id", postId)

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            logger.info("Post status updated", { postId, status })
        } catch (error) {
            logger.error("Failed to update post status", {
                postId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Update network publication status
     */
    async updateNetworkStatus(
        postId: string,
        platform: SocialPlatform,
        status: "pending" | "published" | "failed",
        externalId?: string,
        externalUrl?: string,
        errorMessage?: string
    ): Promise<void> {
        try {
            const { error } = await this.supabase
                .from("scheduled_post_networks")
                .update({
                    status,
                    external_id: externalId || null,
                    external_url: externalUrl || null,
                    error_message: errorMessage || null,
                    updated_at: new Date(),
                })
                .eq("post_id", postId)
                .eq("platform", platform)

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            logger.info("Network status updated", {
                postId,
                platform,
                status,
            })
        } catch (error) {
            logger.error("Failed to update network status", {
                postId,
                platform,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Record publication in history
     */
    async recordPublication(
        userId: string,
        postId: string | undefined,
        platform: SocialPlatform,
        status: "success" | "failed" | "pending",
        externalId?: string,
        externalUrl?: string,
        errorMessage?: string
    ): Promise<PublicationHistoryEntry> {
        try {
            const now = Date.now()

            const { data, error } = await this.supabase
                .from("publication_history")
                .insert({
                    user_id: userId,
                    post_id: postId || null,
                    platform,
                    status,
                    external_id: externalId || null,
                    external_url: externalUrl || null,
                    error_message: errorMessage || null,
                    published_at: new Date(now),
                    created_at: new Date(now),
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            logger.info("Publication recorded in history", {
                userId,
                postId,
                platform,
                status,
            })

            return this.mapDatabaseToPublicationHistory(data)
        } catch (error) {
            logger.error("Failed to record publication", {
                userId,
                postId,
                platform,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Delete a scheduled post
     */
    async deleteScheduledPost(
        userId: string,
        postId: string
    ): Promise<boolean> {
        try {
            // Delete networks first
            await this.supabase
                .from("scheduled_post_networks")
                .delete()
                .eq("post_id", postId)

            // Delete the post
            const { error } = await this.supabase
                .from("scheduled_posts")
                .delete()
                .eq("id", postId)
                .eq("user_id", userId)

            if (error) {
                throw new Error(`Database error: ${error.message}`)
            }

            // Invalidate cache
            await CacheManager.delete(CACHE_KEYS.PUBLICATION_QUEUE(userId))

            logger.info("Scheduled post deleted", { userId, postId })

            return true
        } catch (error) {
            logger.error("Failed to delete scheduled post", {
                userId,
                postId,
                error: error instanceof Error ? error.message : String(error),
            })
            throw error
        }
    }

    /**
     * Map database record to ScheduledPost
     */
    private mapDatabaseToScheduledPost(
        dbPost: any,
        platforms: SocialPlatform[]
    ): ScheduledPost {
        return {
            id: dbPost.id,
            userId: dbPost.user_id,
            content: dbPost.content,
            scheduledTime: new Date(dbPost.scheduled_time).getTime(),
            status: dbPost.status,
            retryCount: dbPost.retry_count,
            lastRetryAt: dbPost.last_retry_at
                ? new Date(dbPost.last_retry_at).getTime()
                : undefined,
            errorMessage: dbPost.error_message || undefined,
            networks: platforms.map(platform => ({
                id: "",
                postId: dbPost.id,
                platform,
                status: "pending" as const,
                createdAt: new Date(dbPost.created_at).getTime(),
                updatedAt: new Date(dbPost.updated_at).getTime(),
            })),
            createdAt: new Date(dbPost.created_at).getTime(),
            updatedAt: new Date(dbPost.updated_at).getTime(),
        }
    }

    /**
     * Map database record to PublicationHistoryEntry
     */
    private mapDatabaseToPublicationHistory(
        dbEntry: any
    ): PublicationHistoryEntry {
        return {
            id: dbEntry.id,
            userId: dbEntry.user_id,
            postId: dbEntry.post_id || undefined,
            platform: dbEntry.platform,
            status: dbEntry.status,
            externalId: dbEntry.external_id || undefined,
            externalUrl: dbEntry.external_url || undefined,
            errorMessage: dbEntry.error_message || undefined,
            publishedAt: new Date(dbEntry.published_at).getTime(),
            createdAt: new Date(dbEntry.created_at).getTime(),
        }
    }
}

/**
 * Create a singleton Publication Queue instance
 */
let publicationQueueInstance: PublicationQueue | null = null

/**
 * Get or create the Publication Queue
 */
export function getPublicationQueue(): PublicationQueue {
    if (!publicationQueueInstance) {
        publicationQueueInstance = new PublicationQueue()
    }
    return publicationQueueInstance
}

/**
 * Reset the Publication Queue (useful for testing)
 */
export function resetPublicationQueue(): void {
    publicationQueueInstance = null
}
