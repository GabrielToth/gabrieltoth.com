import { CREDIT_COSTS } from "@/lib/credits/constants"

const GB = 1024 * 1024 * 1024

export interface VideoBillingInput {
    fileSizeBytes: number
    storageDays: number
    isCloudStorage: boolean
}

export interface VideoBillingBreakdown {
    baseFee: number
    storageCostPerDay: number
    storageCostTotal: number
    uploadBandwidthCost: number
    downloadBandwidthCost: number
    totalToCharge: number
}

/**
 * Calculate video storage and bandwidth costs.
 * Costs use decimal credits (1 credit = $0.01 USD).
 *
 * Base fee (non-refundable) + storage per GB/day + bandwidth (up + down).
 */
export function calculateVideoStorageCost(
    input: VideoBillingInput
): VideoBillingBreakdown {
    const fileSizeGB = input.fileSizeBytes / GB

    const baseFee = CREDIT_COSTS.youtube_video_base_fee
    const storageCostPerDay = +(
        CREDIT_COSTS.youtube_video_storage_per_gb_per_day * fileSizeGB
    ).toFixed(2)
    const storageCostTotal = +(storageCostPerDay * input.storageDays).toFixed(2)
    const uploadBandwidthCost = +(
        CREDIT_COSTS.youtube_video_bandwidth_per_gb * fileSizeGB
    ).toFixed(2)
    const downloadBandwidthCost = +(
        CREDIT_COSTS.youtube_video_bandwidth_per_gb * fileSizeGB
    ).toFixed(2)

    const totalToCharge = +(
        baseFee +
        storageCostTotal +
        (input.isCloudStorage ? uploadBandwidthCost + downloadBandwidthCost : 0)
    ).toFixed(2)

    return {
        baseFee,
        storageCostPerDay,
        storageCostTotal,
        uploadBandwidthCost,
        downloadBandwidthCost,
        totalToCharge,
    }
}

/**
 * Calculate refund amount on cancellation.
 *
 * Refund = charged - (base_fee + storage_used_so_far + download_bandwidth)
 * Download bandwidth is NOT charged on cancel (video not yet downloaded).
 * Minimum refund is 0 (no negative refunds).
 */
export function calculateRefundAmount(
    totalCharged: number,
    baseFee: number,
    storageCostPerDay: number,
    storageDaysUsed: number
): number {
    const storageUsed = +(storageCostPerDay * storageDaysUsed).toFixed(2)
    const nonRefundable = +(baseFee + storageUsed).toFixed(2)
    const refund = +(totalCharged - nonRefundable).toFixed(2)

    // Minimum refund is 0 — never charge extra
    if (refund > totalCharged) return totalCharged
    return Math.max(0, refund)
}
