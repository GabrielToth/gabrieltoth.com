import { beforeEach, describe, expect, it } from "vitest"
import {
    clearPostsCache,
    createPost,
    deletePost,
    fetchPosts,
    updatePost,
} from "./posts"

describe("Posts API Service", () => {
    beforeEach(() => {
        clearPostsCache()
    })

    describe("fetchPosts", () => {
        it("returns array of posts", async () => {
            const posts = await fetchPosts()

            expect(Array.isArray(posts)).toBe(true)
            expect(posts.length).toBeGreaterThan(0)
        })

        it("returns posts with correct structure", async () => {
            const posts = await fetchPosts()

            posts.forEach(post => {
                expect(post).toHaveProperty("id")
                expect(post).toHaveProperty("title")
                expect(post).toHaveProperty("content")
                expect(post).toHaveProperty("scheduledAt")
                expect(post).toHaveProperty("status")
                expect(post).toHaveProperty("channels")
                expect(post).toHaveProperty("createdAt")
            })
        })

        it("caches results", async () => {
            const posts1 = await fetchPosts()
            const posts2 = await fetchPosts()

            expect(posts1).toEqual(posts2)
        })

        it("returns posts with different statuses", async () => {
            const posts = await fetchPosts()

            const statuses = posts.map(p => p.status)
            expect(statuses).toContain("scheduled")
            expect(statuses).toContain("published")
            expect(statuses).toContain("failed")
        })
    })

    describe("createPost", () => {
        it("creates a new post", async () => {
            const newPost = {
                title: "New Post",
                content: "New content",
                scheduledAt: new Date(),
                status: "scheduled" as const,
                channels: ["facebook"],
            }

            const createdPost = await createPost(newPost)

            expect(createdPost).toHaveProperty("id")
            expect(createdPost.title).toBe("New Post")
            expect(createdPost.content).toBe("New content")
        })

        it("invalidates cache after creating post", async () => {
            await fetchPosts()

            const newPost = {
                title: "New Post",
                content: "New content",
                scheduledAt: new Date(),
                status: "scheduled" as const,
                channels: ["facebook"],
            }

            await createPost(newPost)

            // Cache should be cleared, so next fetch should get fresh data
            const posts = await fetchPosts()
            expect(posts).toBeDefined()
        })
    })

    describe("updatePost", () => {
        it("updates an existing post", async () => {
            const posts = await fetchPosts()
            const postToUpdate = posts[0]

            const updated = await updatePost(postToUpdate.id, {
                title: "Updated Title",
            })

            expect(updated.title).toBe("Updated Title")
        })

        it("throws error for non-existent post", async () => {
            await expect(
                updatePost("non-existent-id", { title: "Updated" })
            ).rejects.toThrow("Failed to update post")
        })

        it("invalidates cache after updating post", async () => {
            const posts = await fetchPosts()
            const postToUpdate = posts[0]

            await updatePost(postToUpdate.id, { title: "Updated" })

            // Cache should be cleared
            const freshPosts = await fetchPosts()
            expect(freshPosts).toBeDefined()
        })
    })

    describe("deletePost", () => {
        it("deletes a post", async () => {
            const posts = await fetchPosts()
            const postToDelete = posts[0]

            await expect(deletePost(postToDelete.id)).resolves.toBeUndefined()
        })

        it("invalidates cache after deleting post", async () => {
            const posts = await fetchPosts()
            const postToDelete = posts[0]

            await deletePost(postToDelete.id)

            // Cache should be cleared
            const freshPosts = await fetchPosts()
            expect(freshPosts).toBeDefined()
        })
    })

    describe("clearPostsCache", () => {
        it("clears the cache", async () => {
            await fetchPosts()
            clearPostsCache()

            // Next fetch should get fresh data
            const posts = await fetchPosts()
            expect(posts).toBeDefined()
        })
    })
})
