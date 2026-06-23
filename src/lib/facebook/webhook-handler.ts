import { createLogger } from "@/lib/logger"
import type {
    FacebookWebhookEvent,
    FacebookFeedValue,
    FacebookCommentsValue,
    FacebookLiveVideoValue,
    FacebookConversationsValue,
    FacebookMentionValue,
    FacebookPageMentionValue,
    FacebookWebhookMessaging,
} from "./webhook-types"

const logger = createLogger("FacebookWebhookHandler")

export interface WebhookHandlerResult {
    handled: number
    errors: number
    details: string[]
}

export async function handleWebhookEvent(
    event: FacebookWebhookEvent
): Promise<WebhookHandlerResult> {
    const result: WebhookHandlerResult = {
        handled: 0,
        errors: 0,
        details: [],
    }

    for (const entry of event.entry) {
        if (entry.changes) {
            for (const change of entry.changes) {
                try {
                    switch (change.field) {
                        case "feed": {
                            const val =
                                change.value as unknown as FacebookFeedValue
                            handleFeedChange(val, entry.id)
                            result.handled++
                            result.details.push(`feed:${val.postId}`)
                            break
                        }

                        case "comments": {
                            const val =
                                change.value as unknown as FacebookCommentsValue
                            handleCommentsChange(val, entry.id)
                            result.handled++
                            result.details.push(`comments:${val.commentId}`)
                            break
                        }

                        case "live_videos": {
                            const val =
                                change.value as unknown as FacebookLiveVideoValue
                            handleLiveVideoChange(val, entry.id)
                            result.handled++
                            result.details.push(`live_videos:${val.videoId}`)
                            break
                        }

                        case "conversations": {
                            const val =
                                change.value as unknown as FacebookConversationsValue
                            handleConversationsChange(val, entry.id)
                            result.handled++
                            result.details.push(
                                `conversations:${val.messageId}`
                            )
                            break
                        }

                        case "mention": {
                            const val =
                                change.value as unknown as FacebookMentionValue
                            handleMentionChange(val, entry.id)
                            result.handled++
                            result.details.push(`mention:${val.postId}`)
                            break
                        }

                        case "page_mention": {
                            const val =
                                change.value as unknown as FacebookPageMentionValue
                            handlePageMentionChange(val, entry.id)
                            result.handled++
                            result.details.push(`page_mention:${val.postId}`)
                            break
                        }

                        default:
                            logger.info("Unhandled Facebook webhook field", {
                                field: change.field,
                            })
                            result.details.push(`unhandled:${change.field}`)
                            break
                    }
                } catch (error) {
                    logger.error("Error processing Facebook webhook change", {
                        field: change.field,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    })
                    result.errors++
                    result.details.push(
                        `error:${change.field}:${error instanceof Error ? error.message : "Unknown"}`
                    )
                }
            }
        }

        if (entry.messaging) {
            for (const msg of entry.messaging) {
                try {
                    handleMessagingEvent(msg, entry.id)
                    result.handled++
                    result.details.push(
                        `messaging:${msg.message?.mid || msg.read?.mid || "unknown"}`
                    )
                } catch (error) {
                    logger.error("Error processing Facebook messaging event", {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    })
                    result.errors++
                }
            }
        }
    }

    logger.info("Facebook webhook event processed", {
        handled: result.handled,
        errors: result.errors,
    })

    return result
}

function handleFeedChange(value: FacebookFeedValue, pageId: string): void {
    logger.debug("Facebook feed change", {
        pageId,
        postId: value.postId,
        verb: value.verb,
        isPublished: value.isPublished,
    })
}

function handleCommentsChange(
    value: FacebookCommentsValue,
    pageId: string
): void {
    logger.debug("Facebook comments change", {
        pageId,
        commentId: value.commentId,
        postId: value.postId,
        verb: value.verb,
    })
}

function handleLiveVideoChange(
    value: FacebookLiveVideoValue,
    pageId: string
): void {
    logger.debug("Facebook live_video change", {
        pageId,
        videoId: value.videoId,
        status: value.status,
    })
}

function handleConversationsChange(
    value: FacebookConversationsValue,
    pageId: string
): void {
    logger.debug("Facebook conversations change", {
        pageId,
        senderId: value.senderId,
        messageId: value.messageId,
    })
}

function handleMentionChange(
    value: FacebookMentionValue,
    pageId: string
): void {
    logger.debug("Facebook mention change", {
        pageId,
        postId: value.postId,
        mentionedUserId: value.mentionedUserId,
    })
}

function handlePageMentionChange(
    value: FacebookPageMentionValue,
    pageId: string
): void {
    logger.debug("Facebook page_mention change", {
        pageId,
        postId: value.postId,
        mentionedPageId: value.mentionedPageId,
    })
}

function handleMessagingEvent(
    msg: FacebookWebhookMessaging,
    pageId: string
): void {
    logger.debug("Facebook messaging event", {
        pageId,
        senderId: msg.sender.id,
        hasMessage: !!msg.message,
        hasRead: !!msg.read,
        hasDelivery: !!msg.delivery,
    })
}
