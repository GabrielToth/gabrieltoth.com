/** Content type: Post (text+images) or Video (video+thumbnail) */
export type ContentType = "post" | "video"

/** Platforms that support each content type */
export const CONTENT_TYPE_PLATFORMS: Record<ContentType, string[]> = {
    post: [
        "youtube",
        "facebook",
        "instagram",
        "twitter",
        "linkedin",
        "tiktok",
        "kick",
        "twitch",
        "trovo",
        "kwai",
    ],
    video: [
        "youtube",
        "facebook",
        "instagram",
        "tiktok",
        "kick",
        "twitch",
        "trovo",
        "kwai",
    ],
}

/** Platform definition */
export interface PlatformInfo {
    id: string
    labelKey: string
    descKey: string
    icon: React.ReactNode
    channelCount?: number
    /** Which metadata sections this platform supports */
    features: PlatformFeature[]
}

export type PlatformFeature =
    | "text"
    | "images"
    | "video"
    | "title"
    | "tags"
    | "audience_kids"
    | "ai_generated"
    | "paid_promotion"
    | "monetization"
    | "content_restrictions"
    | "ad_suitability"
    | "cards_end_screens"
    | "privacy_schedule"
    | "channel_selection"

/** All data collected across wizard steps */
export interface PublishWizardState {
    /** Content type: Post (text+images) or Video (video+thumbnail) */
    contentType: ContentType

    /** Selected platforms with their channel selections */
    platformSelections: PlatformSelection[]

    /** Storage mode (only local available) */
    storageMode: "local"

    /** Universal content */
    content: {
        text: string
        images: File[]
        videoFile: File | null
        thumbnailFile: File | null
        /** Auto-filled title extracted from video filename (minus extension). Used to pre-fill YouTube title. */
        autoFillTitle: string
    }

    /** Platform-specific metadata, keyed by platform id */
    platformMetadata: Record<
        string,
        YouTubeMetadata | FacebookMetadata | TikTokMetadata
    >

    /** Processing state */
    processing: ProcessingState
}

export interface PlatformSelection {
    platformId: string
    channelIds: string[]
}

/** YouTube Ad Suitability — mirrors the exact categories and levels from YouTube Studio */
export interface AdSuitability {
    inappropriateLanguage: 0 | 1 | 2
    adultContent: 0 | 1 | 2
    violence: 0 | 1 | 2
    shockingContent: 0 | 1 | 2
    harmfulActs: 0 | 1 | 2
    recreationalDrugs: 0 | 1 | 2
    dishonestBehavior: 0 | 1
    hatefulContent: 0 | 1 | 2
    firearms: 0 | 1 | 2
    sensitiveEvents: 0 | 1
    controversialIssues: 0 | 1 | 2
}

export interface FacebookMetadata {
    description: string
    tags: string[]
}

export interface TikTokMetadata {
    description: string
    tags: string[]
}

export interface YouTubeMetadata {
    title: string
    description: string
    tags: string[]
    madeForKids: boolean
    aiGenerated: boolean
    paidPromotion: boolean
    monetization: boolean
    adSuitability: AdSuitability
    linkedVideoStart: string
    linkedVideoEnd: string
    privacyStatus: "public" | "unlisted" | "private"
    membersOnly: boolean
    publishAt: string | null // ISO 8601 string for scheduled publish
    scheduledDate: Date | null
    scheduledTime: string
}

export const DEFAULT_AD_SUITABILITY: AdSuitability = {
    inappropriateLanguage: 0,
    adultContent: 0,
    violence: 0,
    shockingContent: 0,
    harmfulActs: 0,
    recreationalDrugs: 0,
    dishonestBehavior: 0,
    hatefulContent: 0,
    firearms: 0,
    sensitiveEvents: 0,
    controversialIssues: 0,
}

/** Ad Suitability category definition for rendering the form */
export interface AdSuitabilityCategoryDef {
    key: keyof AdSuitability
    levels: 2 | 3
}

/** Ordered list of all Ad Suitability categories in the same order as YouTube Studio */
export const AD_SUITABILITY_CATEGORIES: AdSuitabilityCategoryDef[] = [
    { key: "inappropriateLanguage", levels: 3 },
    { key: "adultContent", levels: 3 },
    { key: "violence", levels: 3 },
    { key: "shockingContent", levels: 3 },
    { key: "harmfulActs", levels: 3 },
    { key: "recreationalDrugs", levels: 3 },
    { key: "dishonestBehavior", levels: 2 },
    { key: "hatefulContent", levels: 3 },
    { key: "firearms", levels: 3 },
    { key: "sensitiveEvents", levels: 2 },
    { key: "controversialIssues", levels: 3 },
]

export interface PlatformResult {
    platformId: string
    success: boolean
    videoId?: string
    url?: string
    error?: string
}

export type ProcessingState =
    | { status: "idle" }
    | { status: "queued" }
    | {
          status: "uploading"
          platformId: string
          progress: number
          speed: string
      }
    | { status: "metadata"; platformId: string }
    | { status: "publishing"; platformId: string }
    | { status: "complete"; results: PlatformResult[] }
    | { status: "partial"; results: PlatformResult[] }
    | { status: "error"; message: string; platformId?: string }

export interface YouTubeChannel {
    id: string
    name: string // rename: channel title
    title?: string // YouTube API returns "title"
    thumbnailUrl: string
    subscriberCount: number
    videoCount: number
}

export const DEFAULT_YOUTUBE_METADATA: YouTubeMetadata = {
    title: "",
    description: "",
    tags: [],
    madeForKids: false,
    aiGenerated: false,
    paidPromotion: false,
    monetization: true,
    adSuitability: { ...DEFAULT_AD_SUITABILITY },
    linkedVideoStart: "",
    linkedVideoEnd: "",
    privacyStatus: "unlisted",
    membersOnly: false,
    publishAt: null,
    scheduledDate: null,
    scheduledTime: "",
}

export const DEFAULT_FACEBOOK_METADATA: FacebookMetadata = {
    description: "",
    tags: [],
}

export const DEFAULT_TIKTOK_METADATA: TikTokMetadata = {
    description: "",
    tags: [],
}

export const INITIAL_STATE: PublishWizardState = {
    contentType: "post",
    platformSelections: [],
    storageMode: "local",
    content: {
        text: "",
        images: [],
        videoFile: null,
        thumbnailFile: null,
        autoFillTitle: "",
    },
    platformMetadata: {},
    processing: { status: "idle" },
}

/**
 * Maximum video file size per platform (in bytes).
 * When multiple platforms are selected, the effective limit
 * is the lowest value among all selected platforms.
 */
export const PLATFORM_VIDEO_LIMITS: Record<string, number> = {
    youtube: 256 * 1024 * 1024 * 1024, // 256 GB (effectively unlimited)
    facebook: 10 * 1024 * 1024 * 1024, // 10 GB
    instagram: 650 * 1024 * 1024, // 650 MB (Feed)
    twitter: 512 * 1024 * 1024, // 512 MB
    linkedin: 5 * 1024 * 1024 * 1024, // 5 GB
    tiktok: 512 * 1024 * 1024, // 512 MB
    kick: 16 * 1024 * 1024 * 1024, // 16 GB
    twitch: 10 * 1024 * 1024 * 1024, // 10 GB
    trovo: 500 * 1024 * 1024, // 500 MB
    kwai: 200 * 1024 * 1024, // 200 MB
}

/**
 * Returns the lowest video file limit among the given platform IDs.
 * If no platforms are given, returns 0.
 */
export function getCompatibleVideoLimit(platformIds: string[]): number {
    if (platformIds.length === 0) return 0
    return Math.min(
        ...platformIds.map(id =>
            id in PLATFORM_VIDEO_LIMITS ? PLATFORM_VIDEO_LIMITS[id] : Infinity
        )
    )
}

/**
 * Given a list of platform IDs and a file size, returns the platforms
 * whose video limit is below that file size.
 */
export function getPlatformsExceedingLimit(
    platformIds: string[],
    fileSize: number
): { id: string; limit: number }[] {
    return platformIds
        .filter(id => id in PLATFORM_VIDEO_LIMITS)
        .filter(id => PLATFORM_VIDEO_LIMITS[id] < fileSize)
        .map(id => ({ id, limit: PLATFORM_VIDEO_LIMITS[id] }))
}

/** Get features that are exclusive to a specific platform (not universal) */
export const PLATFORM_EXCLUSIVE_FEATURES: Record<
    string,
    { feature: PlatformFeature; labelKey: string; platformId: string }[]
> = {
    youtube: [
        { feature: "title", labelKey: "step4.title", platformId: "youtube" },
        {
            feature: "tags",
            labelKey: "step4.tags",
            platformId: "youtube",
        },
        {
            feature: "audience_kids",
            labelKey: "step4.madeForKids",
            platformId: "youtube",
        },
        {
            feature: "ai_generated",
            labelKey: "step4.aiGenerated",
            platformId: "youtube",
        },
        {
            feature: "paid_promotion",
            labelKey: "step4.paidPromotion",
            platformId: "youtube",
        },
        {
            feature: "monetization",
            labelKey: "step4.monetizationTitle",
            platformId: "youtube",
        },
        {
            feature: "ad_suitability",
            labelKey: "step4.adSuitability",
            platformId: "youtube",
        },
        {
            feature: "cards_end_screens",
            labelKey: "step4.cards",
            platformId: "youtube",
        },
        {
            feature: "privacy_schedule",
            labelKey: "step4.privacy",
            platformId: "youtube",
        },
    ],
    facebook: [
        // Future: page selection, link preview, etc.
    ],
    instagram: [
        // Future: carousel, reel, story, etc.
    ],
    twitter: [
        // Future: poll, thread, etc.
    ],
    linkedin: [
        // Future: article, company page, etc.
    ],
    tiktok: [{ feature: "tags", labelKey: "step4.tags", platformId: "tiktok" }],
}
