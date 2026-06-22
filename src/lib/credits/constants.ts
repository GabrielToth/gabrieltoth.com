export const CREDIT_COSTS = {
    chat_message_received: 1.0,
    chat_timeout: 10.0,
    chat_ban: 25.0,
    chat_unban: 5.0,
    youtube_video_download_per_minute: 100.0,
    youtube_metadata: 0.0,
    youtube_post_schedule: 50.0,
    youtube_ai_rewrite_per_1k_tokens: 500.0,
    analytics_daily_access: 1000.0,
    stream_per_minute_base: 1000.0,
    stream_destination_extra: 100.0,
    infra_bandwidth_per_gb: 5000.0,
    infra_storage_per_gb_month: 1000.0,
    infra_cache_per_1k_ops: 50.0,
    infra_api_per_1k_req: 100.0,

    // Video storage & publishing (50% margin included)
    youtube_video_storage_per_gb_per_day: 6.67,
    youtube_video_bandwidth_per_gb: 10.0,
    youtube_video_base_fee: 2.0,
} as const

export type CreditAction = keyof typeof CREDIT_COSTS
