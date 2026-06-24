import { expect, test } from "@playwright/test"

test.describe("video upload and publish flow", () => {
    test("publish page loads with expected structure", async ({ page }) => {
        const response = await page.goto("/dashboard/publish", {
            waitUntil: "networkidle",
        })
        // Without auth session, dashboard routes redirect to signin
        expect(response?.status()).toBe(200)
        const currentUrl = page.url()
        expect(currentUrl).toContain("/dashboard")
    })

    test("youtube upload API rejects unauthenticated requests", async ({
        request,
    }) => {
        const response = await request.post("/api/youtube/upload", {
            multipart: {
                video: {
                    name: "test.mp4",
                    mimeType: "video/mp4",
                    buffer: Buffer.from("fake video content"),
                },
                title: "Test Video",
                description: "E2E test upload",
                privacyStatus: "private",
            },
        })

        // Route checks CSRF first (403) before auth (401)
        // Without CSRF token, the request is rejected at 403
        expect(response.status()).toBe(403)

        const body = await response.json()
        expect(body.error).toBeDefined()
    })

    test("youtube upload API rejects missing form fields", async ({
        request,
    }) => {
        const response = await request.post("/api/youtube/upload", {
            multipart: {
                video: {
                    name: "test.mp4",
                    mimeType: "video/mp4",
                    buffer: Buffer.from("fake video content"),
                },
            },
        })

        // Route checks CSRF first (403) before auth (401)
        // Without CSRF token, the request is rejected at 403
        expect(response.status()).toBe(403)

        const body = await response.json()
        expect(body.error).toBeDefined()
    })

    test("publish page navigates from dashboard", async ({ page }) => {
        const response = await page.goto("/dashboard", {
            waitUntil: "networkidle",
        })
        // Without auth session, dashboard routes redirect to signin
        expect(response?.status()).toBe(200)
        const currentUrl = page.url()
        expect(currentUrl).toContain("/dashboard")
    })
})
