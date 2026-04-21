/**
 * Posts API Service
 * Handles fetching, creating, updating, and deleting posts
 * Includes caching and error handling
 */

import { Post } from "@/components/publish"

// Cache storage
const cache = new Map<string, { data: Post[]; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch posts from API
 * Implements caching to reduce API calls
 */
export async function fetchPosts(): Promise<Post[]> {
    const cacheKey = "posts"
    const now = Date.now()

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && now - cached.timestamp < CACHE_DURATION) {
        return cached.data
    }

    try {
        // In production, replace with actual API call
        // const response = await fetch('/api/posts')
        // const data = await response.json()

        // Mock data for development
        const data: Post[] = [
            {
                id: "1",
                title: "First Post",
                content: "This is the first post",
                scheduledAt: new Date(Date.now() + 86400000),
                status: "scheduled",
                channels: ["facebook", "instagram"],
                createdAt: new Date(),
            },
            {
                id: "2",
                title: "Published Post",
                content: "This post has been published",
                scheduledAt: new Date(Date.now() - 86400000),
                publishedAt: new Date(Date.now() - 86400000),
                status: "published",
                channels: ["twitter"],
                createdAt: new Date(Date.now() - 172800000),
            },
            {
                id: "3",
                title: "Failed Post",
                content: "This post failed to publish",
                scheduledAt: new Date(Date.now() - 43200000),
                status: "failed",
                channels: ["tiktok"],
                errorMessage: "Failed to connect to TikTok API",
                createdAt: new Date(Date.now() - 86400000),
            },
        ]

        // Cache the result
        cache.set(cacheKey, { data, timestamp: now })

        return data
    } catch (error) {
        console.error("Failed to fetch posts:", error)
        throw new Error("Failed to fetch posts")
    }
}

/**
 * Create a new post
 */
export async function createPost(
    post: Omit<Post, "id" | "createdAt">
): Promise<Post> {
    try {
        // In production, replace with actual API call
        // const response = await fetch('/api/posts', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(post)
        // })
        // const data = await response.json()

        const newPost: Post = {
            ...post,
            id: Date.now().toString(),
            createdAt: new Date(),
        }

        // Invalidate cache
        cache.delete("posts")

        return newPost
    } catch (error) {
        console.error("Failed to create post:", error)
        throw new Error("Failed to create post")
    }
}

/**
 * Update an existing post
 */
export async function updatePost(
    id: string,
    updates: Partial<Post>
): Promise<Post> {
    try {
        // In production, replace with actual API call
        // const response = await fetch(`/api/posts/${id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(updates)
        // })
        // const data = await response.json()

        const posts = await fetchPosts()
        const post = posts.find(p => p.id === id)

        if (!post) {
            throw new Error("Post not found")
        }

        const updatedPost = { ...post, ...updates }

        // Invalidate cache
        cache.delete("posts")

        return updatedPost
    } catch (error) {
        console.error("Failed to update post:", error)
        throw new Error("Failed to update post")
    }
}

/**
 * Delete a post
 */
export async function deletePost(id: string): Promise<void> {
    try {
        // In production, replace with actual API call
        // const response = await fetch(`/api/posts/${id}`, {
        //   method: 'DELETE'
        // })

        // Invalidate cache
        cache.delete("posts")
    } catch (error) {
        console.error("Failed to delete post:", error)
        throw new Error("Failed to delete post")
    }
}

/**
 * Clear cache
 */
export function clearPostsCache(): void {
    cache.delete("posts")
}
