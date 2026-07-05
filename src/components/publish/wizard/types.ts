/** All data collected across wizard steps for YouTube publishing */
export interface YouTubePublishData {
    /** Selected platform (always "youtube") */
    platform: "youtube"

    /** Selected YouTube channel IDs */
    channelIds: string[]

    /** Storage mode (only local available) */
    storageMode: "local"

    /** The video file to upload */
    videoFile: File | null

    /** Video metadata */
    metadata: YouTubeMetadata

    /** Processing state */
    processing: ProcessingState
}

export interface YouTubeMetadata {
    title: string
    description: string
    tags: string[]
    madeForKids: boolean
    aiGenerated: boolean
    paidPromotion: boolean
    monetization: boolean
    contentRestrictions: "none" | "restricted" | "educational"
    linkedVideoStart: string
    linkedVideoEnd: string
    privacyStatus: "public" | "unlisted" | "private"
    scheduledDate: Date | null
    scheduledTime: string
}

export type ProcessingState =
    | { status: "idle" }
    | { status: "queued" }
    | { status: "uploading"; progress: number; speed: string }
    | { status: "metadata" }
    | { status: "publishing" }
    | { status: "complete"; videoId: string; url: string }
    | { status: "error"; message: string }

export interface YouTubeChannel {
    id: string
    name: string
    thumbnailUrl: string
    subscriberCount: number
    videoCount: number
}

export const DEFAULT_METADATA: YouTubeMetadata = {
    title: "",
    description: "",
    tags: [],
    madeForKids: false,
    aiGenerated: false,
    paidPromotion: false,
    monetization: true,
    contentRestrictions: "none",
    linkedVideoStart: "",
    linkedVideoEnd: "",
    privacyStatus: "unlisted",
    scheduledDate: null,
    scheduledTime: "",
}
