/**
 * Tests for Email Service (verification + password reset via Resend)
 *
 * Covers:
 * - Correct usage of the resend sender with localized subjects
 * - HTML body generation / link inclusion
 * - Escaping of HTML entities in links (XSS safety)
 * - Locale fallback ("pt-BR" / "fr" / "es" / "de" / "en")
 * - Returning false when resend fails
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
    sendVerificationEmail,
    sendPasswordResetEmail,
} from "@/lib/auth/email-service"

// Mock Resend sendEmail
const mockSendEmail = vi.fn()
vi.mock("@/lib/resend", () => ({
    sendEmail: (opts: unknown) => mockSendEmail(opts),
}))

// Mock logger to silence noise in tests
vi.mock("@/lib/logger", () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    },
}))

describe("email-service.ts", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    // ----------------------------------------------------------------
    describe("sendVerificationEmail", () => {
        it("sends localized subject (default en)", async () => {
            mockSendEmail.mockResolvedValueOnce({ success: true, id: "a1" })

            const ok = await sendVerificationEmail(
                "user@example.com",
                "https://example.com/verify?token=tok123",
                "en"
            )

            expect(ok).toBe(true)
            expect(mockSendEmail).toHaveBeenCalledTimes(1)
            const call = mockSendEmail.mock.calls[0][0]
            expect(call.to).toBe("user@example.com")
            expect(call.subject).toContain("Verify your email address")
            expect(call.html).toContain(
                "https://example.com/verify?token=tok123"
            )
        })

        it("includes the verification link in the HTML body", async () => {
            mockSendEmail.mockResolvedValueOnce({ success: true, id: "b2" })

            await sendVerificationEmail(
                "user@example.com",
                "https://example.com/verify?token=tok123"
            )

            const call = mockSendEmail.mock.calls[0][0]
            expect(call.html).toContain(
                "https://example.com/verify?token=tok123"
            )
        })

        it("escapes HTML entities in links (XSS safety)", async () => {
            mockSendEmail.mockResolvedValueOnce({ success: true })
            const maliciousLink =
                "https://example.com/verify?token=<script>alert(1)</script>"

            await sendVerificationEmail("user@example.com", maliciousLink, "en")

            const call = mockSendEmail.mock.calls[0][0]
            // The escaped entities should be present in the href, not <script>
            expect(call.html).not.toContain("<script>alert(1)<")
            expect(call.html).toContain("&lt;script&gt;")
        })

        it("returns false when resend fails", async () => {
            mockSendEmail.mockResolvedValueOnce({
                success: false,
                error: "Resend API error",
            })

            const ok = await sendVerificationEmail(
                "user@example.com",
                "https://example.com/verify?token=tok123",
                "en"
            )

            expect(ok).toBe(false)
        })

        it("respects pt-BR locale", async () => {
            mockSendEmail.mockResolvedValueOnce({ success: true })

            await sendVerificationEmail(
                "user@example.com",
                "https://example.com/",
                "pt-BR"
            )

            const call = mockSendEmail.mock.calls[0][0]
            expect(call.subject).toContain("Confirme seu endereço de e-mail")
        })

        it("falls back to english subject for unknown locale", async () => {
            mockSendEmail.mockResolvedValueOnce({ success: true })

            await sendVerificationEmail(
                "user@example.com",
                "https://example.com/",
                "xx"
            )

            const call = mockSendEmail.mock.calls[0][0]
            expect(call.subject).toContain("Verify your email address")
        })
    })

    // ----------------------------------------------------------------
    describe("sendPasswordResetEmail", () => {
        it("sends reset subject", async () => {
            mockSendEmail.mockResolvedValueOnce({ success: true })

            const ok = await sendPasswordResetEmail(
                "user@example.com",
                "https://example.com/reset?token=abc123"
            )

            expect(ok).toBe(true)
            const call = mockSendEmail.mock.calls[0][0]
            expect(call.subject).toContain("Reset your password")
            expect(call.html).toContain(
                "https://example.com/reset?token=abc123"
            )
        })

        it("uses pt-BR reset subject when locale specified", async () => {
            mockSendEmail.mockResolvedValueOnce({ success: true })

            await sendPasswordResetEmail(
                "user@example.com",
                "https://example.com/",
                "pt-BR"
            )

            const call = mockSendEmail.mock.calls[0][0]
            expect(call.subject).toContain("Redefina sua senha")
        })

        it("returns false when resend fails", async () => {
            mockSendEmail.mockResolvedValueOnce({
                success: false,
                error: "SMTP pool exhausted",
            })

            const ok = await sendPasswordResetEmail(
                "user@example.com",
                "https://example.com/"
            )
            expect(ok).toBe(false)
        })
    })
})
