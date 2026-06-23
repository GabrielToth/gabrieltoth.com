import { TikTokVideo } from "./oauth-service"

export interface TikTokUserStats {
    followerCount: number
    followingCount: number
    likesCount: number
    videoCount: number
}

export interface TikTokVideoEngagement {
    id: string
    title?: string
    likeCount: number
    commentCount: number
    shareCount: number
    viewCount: number
    createTime?: string
}

export function extractUserStats(user: {
    followerCount?: number
    followingCount?: number
    likesCount?: number
    videoCount?: number
}): TikTokUserStats {
    return {
        followerCount: user.followerCount || 0,
        followingCount: user.followingCount || 0,
        likesCount: user.likesCount || 0,
        videoCount: user.videoCount || 0,
    }
}

export function extractVideoEngagement(
    videos: TikTokVideo[]
): TikTokVideoEngagement[] {
    return videos.map(v => ({
        id: v.id,
        title: v.title,
        likeCount: v.likeCount || 0,
        commentCount: v.commentCount || 0,
        shareCount: v.shareCount || 0,
        viewCount: v.viewCount || 0,
        createTime: v.createTime,
    }))
}
