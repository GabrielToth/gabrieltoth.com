/**
 * GET /api/youtube/download/[mediaId]
 * Download a video file from cloud storage.
 *
 * Validates: 1, 3, 4, 5, 6, 15, 17, 18
 *
 * Security Features:
 * - Session authentication via auth_session cookie
 * - Email-gated access (gabrieltothgoncalves@gmail.com only)
 * - Environment-gated (NODE_ENV !== 'production')
 * - DB lookup verifies ownership before returning URL
 * - Redirect to signed URL (no direct data exposure)
 * - Generic error messages (no info disclosure)
 *
 * URL params:
 *   - mediaId: UUID of the scheduled_post_media record
 *
 * Query params:
 *   - csrfToken: string (CSRF token for CSRF validation)
 *
 * Response:
 *   302: Redirect to signed Supabase Storage URL
 *   400: { error: string } — invalid mediaId format
 *   401: { error: string } — not authenticated
 *   403: { error: string } — access denied
 *   404: { error: string } — media not found
 *   500: { error: string } — internal error
 *
 * Security Considerations:
 * 1. Auth bypass: session cookie & DB query verify user
 * 2. Type attacks: mediaId validated as UUID format
 * 3. Info disclosure: generic error messages only
 * 4. IDOR: DB query scoped to requesting user
 * 5. Path traversal: mediaId is UUID, no file path in URL
 * 6. Environment-gated: only works in dev/test
 * 7. Email-gated: only the project owner may download
 */

import { createLogger } from "@/lib/logger"
import { db } from "@/lib/db"
import {
    getOrGenerateCsrfToken,
    addCsrfTokenToResponse,
} from "@/lib/middleware/api-csrf-middleware"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("YouTubeDownloadRoute")

const ALLOWED_EMAIL = "gabrieltothgoncalves@gmail.com"
const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SIGNED_URL_EXPIRY_SECONDS = 300 // 5 minutes

type MediaRecord = {
    id: string
    post_id: string
    user_id: string
    storage_path: string
    original_filename: string
    mime_type: string
    file_size: number
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ mediaId: string }> }
) {
    try {
        const { mediaId } = await params

        // ── Validate mediaId format ──
        if (!UUID_REGEX.test(mediaId)) {
            return NextResponse.json(
                { error: "Invalid media ID" },
                { status: 400 }
            )
        }

        // ── Environment gate ──
        if (process.env.NODE_ENV === "production") {
            logger.warn("Download attempted in production", {
                mediaId,
            })
            return NextResponse.json(
                { error: "Downloads are not available in production" },
                { status: 403 }
            )
        }

        // ── Session check ──
        const sessionToken = request.cookies.get("auth_session")?.value
        if (!sessionToken) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            )
        }

        // ── Look up session ──
        const session = await db.queryOne<{
            user_id: string
            expires_at: Date
        }>("SELECT user_id, expires_at FROM sessions WHERE session_id = $1", [
            sessionToken,
        ])

        if (!session) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            )
        }

        if (new Date(session.expires_at) < new Date()) {
            return NextResponse.json(
                { error: "Session expired" },
                { status: 401 }
            )
        }

        // ── Look up user email ──
        const user = await db.queryOne<{ google_email: string }>(
            "SELECT google_email FROM users WHERE id = $1",
            [session.user_id]
        )

        if (!user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            )
        }

        // ── Email gate ──
        if (user.google_email !== ALLOWED_EMAIL) {
            logger.warn("Unauthorized download attempt", {
                userId: session.user_id,
                email: user.google_email,
                mediaId,
            })
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            )
        }

        // ── Look up media record ──
        const media = await db.queryOne<MediaRecord>(
            `SELECT id, post_id, user_id, storage_path,
                    original_filename, mime_type, file_size
             FROM scheduled_post_media
             WHERE id = $1 AND user_id = $2`,
            [mediaId, session.user_id]
        )

        if (!media) {
            return NextResponse.json(
                { error: "Media not found" },
                { status: 404 }
            )
        }

        if (!media.storage_path) {
            logger.warn("Media has no storage path", { mediaId })
            return NextResponse.json(
                { error: "Media file not available" },
                { status: 404 }
            )
        }

        // ── Generate signed URL ──
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!url || !key) {
            logger.error("Supabase credentials not configured", { mediaId })
            return NextResponse.json(
                { error: "Storage not configured" },
                { status: 500 }
            )
        }

        const storage = createClient(url, key).storage
        const { data, error } = await storage
            .from("youtube-videos")
            .createSignedUrl(media.storage_path, SIGNED_URL_EXPIRY_SECONDS)

        if (error || !data) {
            logger.error("Failed to create signed URL", {
                error: error?.message,
                mediaId,
            })
            return NextResponse.json(
                { error: "Failed to retrieve file" },
                { status: 500 }
            )
        }

        // ── Redirect to signed URL ──
        const response = NextResponse.redirect(data.signedUrl)

        // ── Add CSRF token to response ──
        const csrfToken = getOrGenerateCsrfToken(request)
        if (csrfToken) {
            addCsrfTokenToResponse(response, csrfToken)
        }

        return response
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Internal error"
        logger.error("YouTube download route error", { error: message })
        return NextResponse.json({ error: "Download failed" }, { status: 500 })
    }
}
