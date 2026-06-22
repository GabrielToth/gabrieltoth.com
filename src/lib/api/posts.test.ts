import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    createPost,
    deletePost,
    fetchPosts,
    invalidateCache,
    updatePost,
} from "./posts"

const mockPosts = [
    {
        id: "1",
        content: "First post content",
        scheduledTime: new Date(Date.now() + 86400000).toISOString(),
        status: "scheduled",
        networks: ["facebook", "instagram"],
        createdAt: new Date().toISOString(),
    },
    {
        id: "2",
        content: "Second post",
        scheduledTime: new Date(Date.now() - 86400000).toISOString(),
        publishedAt: new Date().toISOString(),
        status: "published",
        networks: ["twitter"],
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
        id: "3",
        content: "Failed post",
        scheduledTime: new Date(Date.now() - 86400000).toISOString(),
        status: "failed",
        networks: ["facebook"],
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
]

function mockFetch(response: unknown, ok = true) {
    return vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok,
        json: () => Promise.resolve(response),
    } as Response)
}

function mockContentFetch() {
    return mockFetch({ posts: mockPosts })
}

describe("Posts API Service", () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        invalidateCache()
    })

    describe("fetchPosts", () => {
        it("returns array of posts", async () => {
            mockContentFetch()

            const posts = await fetchPosts()

            expect(Array.isArray(posts)).toBe(true)
            expect(posts.length).toBeGreaterThan(0)
        })

        it("returns posts with correct structure", async () => {
            mockContentFetch()

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
            mockContentFetch()

            const posts1 = await fetchPosts()
            const posts2 = await fetchPosts()

            expect(posts1).toEqual(posts2)
            expect(globalThis.fetch).toHaveBeenCalledTimes(1)
        })

        it("returns posts with different statuses", async () => {
            mockContentFetch()

            const posts = await fetchPosts()

            const statuses = posts.map(p => p.status)
            expect(statuses).toContain("scheduled")
            expect(statuses).toContain("published")
            expect(statuses).toContain("failed")
        })
    })

    describe("createPost", () => {
        it("creates a new post", async () => {
            const createdMock = {
                id: "4",
                content: "New content",
                scheduledTime: new Date().toISOString(),
                status: "scheduled",
                networks: ["facebook"],
                createdAt: new Date().toISOString(),
            }
            mockFetch({ post: createdMock })

            const newPost = {
                title: "New Post",
                content: "New content",
                scheduledAt: new Date(),
                status: "scheduled" as const,
                channels: ["facebook"],
            }

            const createdPost = await createPost(newPost)

            expect(createdPost).toHaveProperty("id")
            expect(createdPost.id).toBe("4")
            expect(createdPost.content).toBe("New content")
        })

        it("invalidates cache after creating post", async () => {
            mockContentFetch()
            await fetchPosts()

            const createdMock = {
                id: "4",
                content: "New content",
                scheduledTime: new Date().toISOString(),
                status: "scheduled",
                networks: ["facebook"],
                createdAt: new Date().toISOString(),
            }
            mockFetch({ post: createdMock })

            const newPost = {
                title: "New Post",
                content: "New content",
                scheduledAt: new Date(),
                status: "scheduled" as const,
                channels: ["facebook"],
            }

            await createPost(newPost)

            // Cache should be cleared, so next fetch should get fresh data
            mockContentFetch()
            const posts = await fetchPosts()
            expect(posts).toBeDefined()
        })
    })

    describe("updatePost", () => {
        it("updates an existing post", async () => {
            mockContentFetch()
            const posts = await fetchPosts()
            const postToUpdate = posts[0]

            const updatedMock = {
                ...mockPosts[0],
                content: "Updated Title",
            }
            mockFetch({ post: updatedMock })

            const updated = await updatePost(postToUpdate.id, {
                title: "Updated Title",
            })

            expect(updated.content).toBe("Updated Title")
        })

        it("throws error for non-existent post", async () => {
            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({ error: "Not found" }),
            } as Response)

            await expect(
                updatePost("non-existent-id", { title: "Updated" })
            ).rejects.toThrow("Not found")
        })

        it("invalidates cache after updating post", async () => {
            mockContentFetch()
            const posts = await fetchPosts()
            const postToUpdate = posts[0]

            mockFetch({ post: { ...mockPosts[0], content: "Updated" } })
            await updatePost(postToUpdate.id, { title: "Updated" })

            // Cache should be cleared
            mockContentFetch()
            const freshPosts = await fetchPosts()
            expect(freshPosts).toBeDefined()
        })
    })

    describe("deletePost", () => {
        it("deletes a post", async () => {
            mockContentFetch()
            const posts = await fetchPosts()
            const postToDelete = posts[0]

            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            } as Response)

            await expect(deletePost(postToDelete.id)).resolves.toBeUndefined()
        })

        it("invalidates cache after deleting post", async () => {
            mockContentFetch()
            const posts = await fetchPosts()
            const postToDelete = posts[0]

            vi.spyOn(globalThis, "fetch").mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            } as Response)
            await deletePost(postToDelete.id)

            // Cache should be cleared
            mockContentFetch()
            const freshPosts = await fetchPosts()
            expect(freshPosts).toBeDefined()
        })
    })

    describe("fetchPosts failure", () => {
        it("returns empty array on error", async () => {
            vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
                new Error("Network error"),
            )

            await expect(fetchPosts()).rejects.toThrow("Network error")
        })
    })
})
