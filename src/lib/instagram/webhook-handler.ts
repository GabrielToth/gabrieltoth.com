/**
 * Instagram Webhook Event Handler
 *
 * Receives parsed webhook events from the API route and routes them to
 * the appropriate handler based on field type. Handlers log events and
 * will be wired to the unified chat system in Phase 2.
 */

import { createLogger } from "@/lib/logger"
import type {
    InstagramWebhookEvent,
    InstagramWebhookMessaging,
} from "./webhook-types"

const logger = createLogger("InstagramWebhookHandler")

export function handleWebhookEvent(event: InstagramWebhookEvent): void {
    const { object, entry } = event

    if (object !== "instagram") {
        logger.warn("Unknown webhook object type", { object })
        return
    }

    for (const entryItem of entry) {
        if (entryItem.changes) {
            for (const change of entryItem.changes) {
                handleFieldChange(entryItem.id, change)
            }
        }

        if (entryItem.messaging) {
            for (const msg of entryItem.messaging) {
                handleMessaging(entryItem.id, msg)
            }
        }
    }
}

function handleFieldChange(
    igUserId: string,
    change: { field: string; value: Record<string, unknown> }
): void {
    const { field, value } = change

    switch (field) {
        case "comments":
            logger.info("Instagram comment received", {
                igUserId,
                commentId: value.id,
                text: (value.text as string)?.substring(0, 200),
            })
            break

        case "live_comments":
            logger.info("Instagram live comment received", {
                igUserId,
                liveMediaId: value.live_media_id,
                text: (value.text as string)?.substring(0, 200),
                username: (value.from as { username?: string })?.username,
            })
            break

        case "mentioned":
            logger.info("Instagram mention received", {
                igUserId,
                mediaId: value.media_id,
            })
            break

        case "story_insights":
            logger.info("Instagram story insights update", {
                igUserId,
                mediaId: value.media_id,
                impressions: value.impressions,
                reach: value.reach,
            })
            break

        default:
            logger.debug("Unhandled webhook field", { igUserId, field })
    }
}

function handleMessaging(
    igUserId: string,
    messaging: InstagramWebhookMessaging
): void {
    logger.info("Instagram Direct Message received", {
        igUserId,
        from: messaging.sender.id,
        text: messaging.message?.text?.substring(0, 200),
        hasAttachment: (messaging.message?.attachments?.length ?? 0) > 0,
    })
}
