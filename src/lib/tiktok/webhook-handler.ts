import { createLogger } from "@/lib/logger"
import type {
    TikTokWebhookEvent,
    TikTokAuthorizationRemovedContent,
    TikTokVideoUploadFailedContent,
    TikTokVideoPublishCompletedContent,
    TikTokPortabilityDownloadReadyContent,
} from "./webhook-types"

const logger = createLogger("TikTokWebhookHandler")

export interface WebhookHandlerResult {
    handled: number
    errors: number
    details: string[]
}

export async function handleTikTokWebhookEvent(
    event: TikTokWebhookEvent,
): Promise<WebhookHandlerResult> {
    const result: WebhookHandlerResult = {
        handled: 0,
        errors: 0,
        details: [],
    }

    try {
        switch (event.event) {
            case "authorization.removed": {
                const content = JSON.parse(
                    event.content,
                ) as TikTokAuthorizationRemovedContent
                handleAuthorizationRemoved(content)
                result.handled++
                result.details.push(`authorization.removed:${content.user_open_id}`)
                break
            }

            case "video.upload.failed": {
                const content = JSON.parse(
                    event.content,
                ) as TikTokVideoUploadFailedContent
                handleVideoUploadFailed(content)
                result.handled++
                result.details.push(`video.upload.failed:${content.publish_id}`)
                break
            }

            case "video.publish.completed": {
                const content = JSON.parse(
                    event.content,
                ) as TikTokVideoPublishCompletedContent
                handleVideoPublishCompleted(content)
                result.handled++
                result.details.push(`video.publish.completed:${content.publish_id}`)
                break
            }

            case "portability.download.ready": {
                const content = JSON.parse(
                    event.content,
                ) as TikTokPortabilityDownloadReadyContent
                handlePortabilityDownloadReady(content)
                result.handled++
                result.details.push(`portability.download.ready:${content.user_open_id}`)
                break
            }

            default:
                logger.info("Unhandled TikTok webhook event type", {
                    event: event.event,
                })
                result.details.push(`unhandled:${event.event}`)
                break
        }
    } catch (error) {
        logger.error("Error processing TikTok webhook event", {
            event: event.event,
            error: error instanceof Error ? error.message : String(error),
        })
        result.errors++
        result.details.push(
            `error:${event.event}:${error instanceof Error ? error.message : "Unknown"}`,
        )
    }

    logger.info("TikTok webhook event processed", {
        handled: result.handled,
        errors: result.errors,
    })

    return result
}

function handleAuthorizationRemoved(
    content: TikTokAuthorizationRemovedContent,
): void {
    logger.info("TikTok authorization removed by user", {
        openId: content.user_open_id,
        appId: content.app_id,
    })
}

function handleVideoUploadFailed(
    content: TikTokVideoUploadFailedContent,
): void {
    logger.warn("TikTok video upload failed", {
        openId: content.user_open_id,
        publishId: content.publish_id,
        failReason: content.fail_reason,
        failCode: content.fail_code,
    })
}

function handleVideoPublishCompleted(
    content: TikTokVideoPublishCompletedContent,
): void {
    logger.info("TikTok video publish completed", {
        openId: content.user_open_id,
        publishId: content.publish_id,
        videoId: content.video_id,
        title: content.title,
    })
}

function handlePortabilityDownloadReady(
    content: TikTokPortabilityDownloadReadyContent,
): void {
    logger.info("TikTok portability download ready", {
        openId: content.user_open_id,
        expirationTime: content.expiration_time,
    })
}
