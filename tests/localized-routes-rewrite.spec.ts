import { expect, test } from "@playwright/test"

/**
 * Bug Condition Exploration Test - Localized Route Rewrite Failure
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 *
 * This test explores the bug condition where translated path segments
 * should be rewritten to their English equivalents before route resolution.
 *
 * EXPECTED OUTCOME ON UNFIXED CODE: Tests FAIL
 * - Requests to translated paths return 404 instead of being rewritten
 * - This failure confirms the bug exists
 *
 * EXPECTED OUTCOME ON FIXED CODE: Tests PASS
 * - Requests to translated paths are rewritten to English equivalents
 * - Pages load successfully with status 200
 */

test.describe("Bug Condition: Localized Route Rewrites", () => {
    test("Portuguese login rewrite: /pt-BR/entrar/ should rewrite to /pt-BR/login/", async ({
        page,
    }) => {
        // Request the translated Portuguese login path
        const response = await page.goto("/pt-BR/entrar/", {
            waitUntil: "networkidle",
        })

        // Verify the request was successful (not 404)
        expect(response?.status()).toBe(200)

        // Verify the page loaded (contains expected content)
        // The login page should have a form or login-related content
        const pageContent = await page.content()
        expect(pageContent).toBeTruthy()

        // Verify we're on a login page (check for common login elements)
        const hasLoginContent =
            (await page.locator('input[type="email"]').count()) > 0 ||
            (await page.locator('input[type="password"]').count()) > 0 ||
            (await page.locator('button:has-text("entrar")').count()) > 0 ||
            (await page.locator('button:has-text("login")').count()) > 0 ||
            pageContent.includes("login") ||
            pageContent.includes("entrar")

        expect(hasLoginContent).toBeTruthy()
    })

    test("Portuguese register rewrite: /pt-BR/registrar/ should rewrite to /pt-BR/register/", async ({
        page,
    }) => {
        // Request the translated Portuguese register path
        const response = await page.goto("/pt-BR/registrar/", {
            waitUntil: "networkidle",
        })

        // Verify the request was successful (not 404)
        expect(response?.status()).toBe(200)

        // Verify the page loaded
        const pageContent = await page.content()
        expect(pageContent).toBeTruthy()

        // Verify we're on a register page
        const hasRegisterContent =
            (await page.locator('input[type="email"]').count()) > 0 ||
            (await page.locator('input[type="password"]').count()) > 0 ||
            (await page.locator('button:has-text("registrar")').count()) > 0 ||
            (await page.locator('button:has-text("register")').count()) > 0 ||
            pageContent.includes("register") ||
            pageContent.includes("registrar")

        expect(hasRegisterContent).toBeTruthy()
    })

    test("Portuguese PC optimization rewrite: /pt-BR/otimizacao-de-pc/ should rewrite to /pt-BR/pc-optimization/", async ({
        page,
    }) => {
        // Request the translated Portuguese PC optimization path
        const response = await page.goto("/pt-BR/otimizacao-de-pc/", {
            waitUntil: "networkidle",
        })

        // Verify the request was successful (not 404)
        expect(response?.status()).toBe(200)

        // Verify the page loaded
        const pageContent = await page.content()
        expect(pageContent).toBeTruthy()

        // Verify we're on a PC optimization page
        const hasOptimizationContent =
            pageContent.includes("pc-optimization") ||
            pageContent.includes("otimizacao") ||
            pageContent.includes("optimization")

        expect(hasOptimizationContent).toBeTruthy()
    })

    test("Portuguese channel management rewrite: /pt-BR/gerenciamento-de-canais/ should rewrite to /pt-BR/channel-management/", async ({
        page,
    }) => {
        // Request the translated Portuguese channel management path
        const response = await page.goto("/pt-BR/gerenciamento-de-canais/", {
            waitUntil: "networkidle",
        })

        // Verify the request was successful (not 404)
        expect(response?.status()).toBe(200)

        // Verify the page loaded
        const pageContent = await page.content()
        expect(pageContent).toBeTruthy()

        // Verify we're on a channel management page
        const hasChannelContent =
            pageContent.includes("channel-management") ||
            pageContent.includes("gerenciamento") ||
            pageContent.includes("ViraTrend")

        expect(hasChannelContent).toBeTruthy()
    })

    test("Spanish login rewrite: /es/iniciar-sesion/ should rewrite to /es/login/", async ({
        page,
    }) => {
        // Request the translated Spanish login path
        const response = await page.goto("/es/iniciar-sesion/", {
            waitUntil: "networkidle",
        })

        // Verify the request was successful (not 404)
        expect(response?.status()).toBe(200)

        // Verify the page loaded
        const pageContent = await page.content()
        expect(pageContent).toBeTruthy()

        // Verify we're on a login page
        const hasLoginContent =
            (await page.locator('input[type="email"]').count()) > 0 ||
            (await page.locator('input[type="password"]').count()) > 0 ||
            pageContent.includes("login") ||
            pageContent.includes("sesion")

        expect(hasLoginContent).toBeTruthy()
    })

    test("German register rewrite: /de/registrieren/ should rewrite to /de/register/", async ({
        page,
    }) => {
        // Request the translated German register path
        const response = await page.goto("/de/registrieren/", {
            waitUntil: "networkidle",
        })

        // Verify the request was successful (not 404)
        expect(response?.status()).toBe(200)

        // Verify the page loaded
        const pageContent = await page.content()
        expect(pageContent).toBeTruthy()

        // Verify we're on a register page
        const hasRegisterContent =
            (await page.locator('input[type="email"]').count()) > 0 ||
            (await page.locator('input[type="password"]').count()) > 0 ||
            pageContent.includes("register") ||
            pageContent.includes("registrieren")

        expect(hasRegisterContent).toBeTruthy()
    })
})
