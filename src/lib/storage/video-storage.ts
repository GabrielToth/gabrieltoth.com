/**
 * Video Storage Service
 * Wraps Supabase Storage for YouTube video uploads.
 * Uses service_role key for admin-level bucket access.
 */

import { createClient } from "@supabase/supabase-js"
import { createLogger } from "@/lib/logger"

const logger = createLogger("VideoStorage")

const BUCKET_NAME = "youtube-videos"

function getStorageClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error("Supabase credentials not configured")
    }

    return createClient(url, key).storage
}

/**
 * Upload a video file to Supabase Storage.
 * Path format: {userId}/{postId}/{filename}
 */
export async function uploadVideo(
    userId: string,
    postId: string,
    file: File
): Promise<{ path: string; fileSize: number }> {
    const storage = getStorageClient()
    const path = `${userId}/${postId}/${file.name}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { data, error } = await storage
        .from(BUCKET_NAME)
        .upload(path, buffer, {
            contentType: file.type || "video/mp4",
            upsert: false,
        })

    if (error) {
        logger.error("Failed to upload video to storage", {
            error: error.message,
            userId,
            path,
        })
        throw new Error(`Storage upload failed: ${error.message}`)
    }

    logger.info("Video uploaded to storage", {
        userId,
        path,
        fileSize: file.size,
    })

    return { path: data!.path, fileSize: file.size }
}

/**
 * Get a download URL valid for a limited time.
 */
export async function getVideoUrl(
    path: string,
    expiresInSeconds = 3600
): Promise<string> {
    const storage = getStorageClient()

    const { data, error } = await storage
        .from(BUCKET_NAME)
        .createSignedUrl(path, expiresInSeconds)

    if (error || !data) {
        logger.error("Failed to create signed URL", {
            error: error?.message,
            path,
        })
        throw new Error(`Failed to generate video URL: ${error?.message}`)
    }

    return data.signedUrl
}

/**
 * Download video content as a Buffer (for streaming to YouTube).
 */
export async function downloadVideo(path: string): Promise<Buffer> {
    const storage = getStorageClient()

    const { data, error } = await storage
        .from(BUCKET_NAME)
        .download(path)

    if (error || !data) {
        logger.error("Failed to download video from storage", {
            error: error?.message,
            path,
        })
        throw new Error(`Failed to download video: ${error?.message}`)
    }

    return Buffer.from(await data.arrayBuffer())
}

/**
 * Delete a video from storage.
 */
export async function deleteVideo(path: string): Promise<void> {
    const storage = getStorageClient()

    const { error } = await storage
        .from(BUCKET_NAME)
        .remove([path])

    if (error) {
        logger.error("Failed to delete video from storage", {
            error: error.message,
            path,
        })
        throw new Error(`Failed to delete video: ${error.message}`)
    }

    logger.info("Video deleted from storage", { path })
}

/**
 * Check if a video exists in storage.
 */
export async function videoExists(path: string): Promise<boolean> {
    const storage = getStorageClient()

    const { data, error } = await storage
        .from(BUCKET_NAME)
        .list(path.split("/").slice(0, -1).join("/"), {
            search: path.split("/").pop(),
        })

    if (error) return false
    return (data?.length ?? 0) > 0
}
