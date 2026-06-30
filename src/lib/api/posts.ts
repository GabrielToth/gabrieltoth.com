import { Post } from "@/components/publish"

// Cache storage
const cache = new Map<string, { data: Post[]; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function fetchPosts(from?: string, to?: string): Promise<Post[]> {
    const cacheKey = `posts-${from || ""}-${to || ""}`
    const now = Date.now()

    const cached = cache.get(cacheKey)
    if (cached && now - cached.timestamp < CACHE_DURATION) {
        return cached.data
    }

    try {
        const params = new URLSearchParams()
        if (from) params.set("from", from)
        if (to) params.set("to", to)
        const qs = params.toString()
        const res = await fetch(`/api/posts${qs ? `?${qs}` : ""}`)
        if (!res.ok) throw new Error("Failed to fetch posts")
        const data = await res.json()
        const posts = (data.posts || []).map(mapScheduledPostToPost)
        cache.set(cacheKey, { data: posts, timestamp: now })
        return posts
    } catch (error) {
        console.error("Failed to fetch posts:", error)
        throw error
    }
}

export async function createPost(
    post: Omit<Post, "id" | "createdAt">
): Promise<Post> {
    try {
        const res = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: post.content,
                scheduledTime: post.scheduledAt.getTime(),
                platforms: post.channels,
            }),
        })
        if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || "Failed to create post")
        }
        const data = await res.json()
        invalidateCache()
        return mapScheduledPostToPost(data.post)
    } catch (error) {
        console.error("Failed to create post:", error)
        throw error
    }
}

export async function updatePost(
    id: string,
    updates: Partial<Post>
): Promise<Post> {
    try {
        const body: Record<string, unknown> = {}
        if (updates.content) body.content = updates.content
        if (updates.scheduledAt)
            body.scheduledTime = updates.scheduledAt.getTime()

        const res = await fetch(`/api/posts/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })
        if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || "Failed to update post")
        }
        const data = await res.json()
        invalidateCache()
        return mapScheduledPostToPost(data.post)
    } catch (error) {
        console.error("Failed to update post:", error)
        throw error
    }
}

export async function deletePost(id: string): Promise<void> {
    try {
        const res = await fetch(`/api/posts/${id}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Failed to delete post")
        invalidateCache()
    } catch (error) {
        console.error("Failed to delete post:", error)
        throw error
    }
}

export function invalidateCache(): void {
    cache.clear()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapScheduledPostToPost(p: any): Post {
    return {
        id: p.id,
        title: (p.content || "").slice(0, 80),
        content: p.content || "",
        scheduledAt: new Date(p.scheduledTime),
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : undefined,
        status:
            p.status === "published"
                ? "published"
                : p.status === "failed"
                  ? "failed"
                  : "scheduled",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        channels: (p.networks || []).map((n: any) =>
            typeof n === "string" ? n : n.platform || ""
        ),
        errorMessage: p.errorMessage,
        createdAt: new Date(p.createdAt),
    }
}
