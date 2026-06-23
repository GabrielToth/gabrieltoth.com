import { deductAmount, grantCredits } from "@/lib/credits/service"
import {
    calculateVideoStorageCost,
    calculateRefundAmount,
} from "./video-storage-cost"
import { query } from "@/lib/db"
import { createLogger } from "@/lib/logger"

const logger = createLogger("VideoScheduleBilling")

export interface ChargeResult {
    success: boolean
    charged: number
    transactionId?: string
    error?: string
}

/**
 * Charge a user for video storage.
 * Uses the user_accounts balance path (decimal-capable).
 */
export async function chargeForVideoStorage(params: {
    userId: string
    fileSizeBytes: number
    storageDays: number
    isCloudStorage: boolean
    postId: string
}): Promise<ChargeResult> {
    const costs = calculateVideoStorageCost({
        fileSizeBytes: params.fileSizeBytes,
        storageDays: params.storageDays,
        isCloudStorage: params.isCloudStorage,
    })

    const result = await deductAmount(
        params.userId,
        costs.totalToCharge,
        `video_storage:${params.postId}`,
        {
            fileSizeBytes: params.fileSizeBytes,
            storageDays: params.storageDays,
            isCloudStorage: params.isCloudStorage,
            costBreakdown: costs,
        }
    )

    if (!result.success) {
        return {
            success: false,
            charged: 0,
            error: result.error || "Failed to charge for video storage",
        }
    }

    logger.info("Video storage charged", {
        userId: params.userId,
        postId: params.postId,
        amount: costs.totalToCharge,
        breakdown: costs,
    })

    return {
        success: true,
        charged: costs.totalToCharge,
        transactionId: result.transactionId,
    }
}

export interface RefundResult {
    success: boolean
    refundAmount: number
    error?: string
}

/**
 * Issue a partial refund for canceled video scheduling.
 * Keeps base fee + storage used; refunds the rest.
 */
export async function refundVideoStorage(params: {
    userId: string
    postId: string
    totalCharged: number
    baseFee: number
    storageCostPerDay: number
    storageDaysUsed: number
}): Promise<RefundResult> {
    const refundAmount = calculateRefundAmount(
        params.totalCharged,
        params.baseFee,
        params.storageCostPerDay,
        params.storageDaysUsed
    )

    if (refundAmount <= 0) {
        logger.info("No refund due", {
            userId: params.userId,
            postId: params.postId,
            totalCharged: params.totalCharged,
            refundAmount,
        })
        return { success: true, refundAmount: 0 }
    }

    const result = await grantCredits(
        params.userId,
        refundAmount,
        `video_storage_refund:${params.postId}`
    )

    if (!result.success) {
        return {
            success: false,
            refundAmount: 0,
            error: result.error || "Failed to process refund",
        }
    }

    logger.info("Video storage refunded", {
        userId: params.userId,
        postId: params.postId,
        amount: refundAmount,
    })

    return { success: true, refundAmount }
}

/**
 * Get total storage usage for a user (sum of active video file sizes).
 */
export async function getUserStorageUsageBytes(
    userId: string
): Promise<number> {
    const result = await query<{ file_size: number }>(
        `SELECT COALESCE(SUM(file_size), 0) AS file_size
         FROM scheduled_post_media
         WHERE user_id = $1
           AND storage_status IN ('stored', 'uploading_youtube')`,
        [userId]
    )

    const row = result.rows[0]
    return row ? Number(row.file_size) : 0
}
