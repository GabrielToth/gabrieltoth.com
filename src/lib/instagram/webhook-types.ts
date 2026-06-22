/**
 * Instagram Graph API Webhook Event Types
 *
 * Covers all webhook fields subscribed via Meta Developer App:
 * comments, live_comments, mentioned, story_insights, messaging, messaging_optins, messaging_referrals, messaging_seen
 */

export interface InstagramWebhookCommentValue {
    id: string
    media_id: string
    text: string
    username?: string
    timestamp?: number
}

export interface InstagramWebhookLiveCommentFrom {
    id: string
    username: string
}

export interface InstagramWebhookLiveCommentValue {
    id: string
    media_id: string
    live_media_id: string
    text: string
    from: InstagramWebhookLiveCommentFrom
    timestamp: number
}

export interface InstagramWebhookMentionValue {
    media_id: string
    comment_id?: string
    media_url?: string
}

export interface InstagramWebhookStoryInsightsValue {
    media_id: string
    impressions?: number
    reach?: number
    taps_forward?: number
    taps_back?: number
    replies?: number
}

export type InstagramWebhookField =
    | "comments"
    | "live_comments"
    | "mentioned"
    | "story_insights"
    | "messaging"
    | "messaging_optins"
    | "messaging_referrals"
    | "messaging_seen"

export interface InstagramWebhookChange {
    field: InstagramWebhookField
    value: Record<string, unknown>
}

export interface InstagramWebhookMessagingAttachment {
    type: string
    payload: Record<string, unknown>
}

export interface InstagramWebhookMessagingMessage {
    mid: string
    text?: string
    attachments?: InstagramWebhookMessagingAttachment[]
}

export interface InstagramWebhookMessaging {
    sender: { id: string }
    recipient: { id: string }
    timestamp: number
    message?: InstagramWebhookMessagingMessage
    postback?: { title: string; payload: string }
    optin?: { ref: string }
}

export interface InstagramWebhookEntry {
    id: string
    time: number
    changes?: InstagramWebhookChange[]
    messaging?: InstagramWebhookMessaging[]
}

export interface InstagramWebhookEvent {
    object: string
    entry: InstagramWebhookEntry[]
}
