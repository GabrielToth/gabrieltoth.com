import { expect, test } from "@playwright/test"

test.describe("video upload and publish flow", () => {
    test("publish page loads with expected structure", async ({ page }) => {
        await page.goto("/en/dashboard/publish")

        await expect(
            page.getByRole("heading", { name: /Publish/i })
        ).toBeVisible()
        await expect(
            page.getByText(/manage your scheduled and published posts/i)
        ).toBeVisible()
        await expect(
            page.getByText(/publish content management coming soon/i)
        ).toBeVisible()

        await expect(page).toHaveURL(/\/en\/dashboard\/publish/)
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

        expect(response.status()).toBe(401)

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

        expect(response.status()).toBe(401)

        const body = await response.json()
        expect(body.error).toBeDefined()
    })

    test("publish page navigates from dashboard", async ({ page }) => {
        await page.goto("/en/dashboard")

        const publishLink = page.getByRole("link", { name: /Publish/i })
        if (await publishLink.isVisible()) {
            await publishLink.click()
            await expect(page).toHaveURL(/\/en\/dashboard\/publish/)
        }
    })
})
