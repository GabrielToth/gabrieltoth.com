export type TikTokWebhookEventType =
    | "authorization.removed"
    | "video.upload.failed"
    | "video.publish.completed"
    | "portability.download.ready"

export interface TikTokWebhookEvent {
    create_time: number
    event: TikTokWebhookEventType
    content: string
}

export interface TikTokAuthorizationRemovedContent {
    user_open_id: string
    user_union_id?: string
    app_id: string
    removed_at: string
}

export interface TikTokVideoUploadFailedContent {
    user_open_id: string
    user_union_id?: string
    publish_id: string
    upload_url: string
    fail_reason: string
    fail_code: string
}

export interface TikTokVideoPublishCompletedContent {
    user_open_id: string
    user_union_id?: string
    publish_id: string
    share_url: string
    video_id: string
    title: string
    privacy_level: string
    create_time: number
}

export interface TikTokPortabilityDownloadReadyContent {
    user_open_id: string
    user_union_id?: string
    download_url: string
    expiration_time: number
}
