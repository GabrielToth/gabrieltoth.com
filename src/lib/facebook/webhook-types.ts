export type FacebookWebhookField =
    | "feed"
    | "comments"
    | "live_videos"
    | "conversations"
    | "mention"
    | "page_mention"
    | "messages"

export interface FacebookWebhookEntry {
    id: string
    time: number
    changes: FacebookWebhookChange[]
    messaging?: FacebookWebhookMessaging[]
}

export interface FacebookWebhookChange {
    field: FacebookWebhookField
    value: Record<string, unknown>
}

export interface FacebookWebhookEvent {
    object: "page"
    entry: FacebookWebhookEntry[]
}

export interface FacebookFeedValue {
    postId: string
    message?: string
    story?: string
    link?: string
    createdTime: string
    verb?: "add" | "edited" | "removed"
    isPublished?: boolean
    from?: {
        name: string
        id: string
    }
}

export interface FacebookCommentsValue {
    commentId: string
    postId: string
    message: string
    from?: {
        name: string
        id: string
    }
    createdTime: string
    parentId?: string
    verb?: "add" | "edited" | "remove"
}

export interface FacebookLiveVideoValue {
    videoId: string
    status: string
    title?: string
    description?: string
    streamUrl?: string
}

export interface FacebookConversationsValue {
    messageId: string
    senderId: string
    recipientId: string
    message: string
    attachments?: Array<{
        type: string
        payload: Record<string, unknown>
    }>
}

export interface FacebookMentionValue {
    postId: string
    pageId: string
    mentionedUserId: string
    message?: string
}

export interface FacebookPageMentionValue {
    postId: string
    pageId: string
    mentionedPageId: string
    message?: string
}

export interface FacebookWebhookMessaging {
    sender: { id: string }
    recipient: { id: string }
    timestamp: number
    message?: {
        mid: string
        text?: string
        attachments?: Array<{
            type: string
            payload: Record<string, unknown>
        }>
    }
    read?: {
        mid: string
        watermark: number
        seq: number
    }
    delivery?: {
        mids: string[]
        watermark: number
        seq: number
    }
}
