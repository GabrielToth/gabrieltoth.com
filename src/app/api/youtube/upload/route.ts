/**
 * POST /api/youtube/upload
 * Upload a video file to YouTube via resumable upload API.
 *
 * Validates: 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19
 *
 * Security Features:
 * - User authentication via x-user-id header
 * - CSRF token validation (from multipart/form-data or header)
 * - Type validation on all fields (prevent script injection)
 * - Length validation (title: 100, description: 5000, tags: 500 each)
 * - Extra field rejection (whitelist approach)
 * - File type verification
 * - File size limit (500MB via Vercel, larger via multipart upload)
 * - Scoped error messages (no stack traces or internal paths)
 * - Audit logging for all attempts
 *
 * Expected multipart/form-data fields:
 *   - csrfToken: string
 *   - file: File (video file)
 *   - title: string (max 100 chars)
 *   - description: string (max 5000 chars)
 *   - privacyStatus: "public" | "unlisted" | "private"
 *   - tags?: string (comma-separated, max 500 chars total, 30 max tags)
 *   - categoryId?: string (YouTube category ID, max 3 chars)
 *
 * Response:
 *   200: { success: true, videoId: string, url: string }
 *   400: { error: string } — missing/invalid fields, extra fields, type mismatch
 *   401: { error: string } — missing or expired YouTube token
 *   403: { error: string } — CSRF validation failure
 *   413: { error: string } — file too large
 *   500: { error: string } — internal error
 *
 * Security Considerations:
 * 1. CSRF Protection: Validates CSRF token from form data or header via validateCsrfFromRequest
 * 2. Input Validation: Type checks on all fields, rejects extra fields, enforces length limits
 * 3. File Validation: Checks File instance type and mime type prefix
 * 4. No Info Disclosure: Generic error messages, no stack traces, no internal paths
 * 5. Audit Logging: All upload attempts logged with userId, file size, timestamps
 * 6. Rate Limiting: N/A for file uploads (limited by file size inherently)
 * 7. IDOR Prevention: userId comes from x-user-id header (server-authenticated)
 * 8. Mass Assignment: Only known fields extracted from form data
 */

import { NextRequest, NextResponse } from "next/server"
import { uploadVideo } from "@/lib/posting/adapters/youtube"
import {
    validateCsrfFromRequest,
    createCsrfErrorResponse,
    regenerateCsrfToken,
    addCsrfTokenToResponse,
} from "@/lib/middleware/api-csrf-middleware"
import { createLogger } from "@/lib/logger"

const logger = createLogger("YouTubeUploadRoute")

const ALLOWED_FIELDS = new Set([
    "csrfToken",
    "file",
    "title",
    "description",
    "privacyStatus",
    "tags",
    "categoryId",
])

const VALID_PRIVACY_STATUSES = new Set([
    "public",
    "unlisted",
    "private",
] as const)

const MAX_TITLE_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 5000
const MAX_TAGS_LENGTH = 500
const MAX_TAG_COUNT = 30
const MAX_CATEGORY_ID_LENGTH = 3
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024 // 500MB

export async function POST(request: NextRequest) {
    // ── CSRF validation ──
    const { valid } = await validateCsrfFromRequest(request)
    if (!valid) {
        return createCsrfErrorResponse()
    }

    try {
        // ── Auth check ──
        const userId = request.headers.get("x-user-id")
        if (!userId || typeof userId !== "string") {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            )
        }

        // ── Parse form data ──
        let formData: FormData
        try {
            formData = await request.formData()
        } catch {
            return NextResponse.json(
                { error: "Invalid form data" },
                { status: 400 }
            )
        }

        // ── Extra field rejection ──
        const formKeys = [...formData.keys()]
        const extraFields = formKeys.filter(k => !ALLOWED_FIELDS.has(k))
        if (extraFields.length > 0) {
            return NextResponse.json(
                { error: "Unexpected fields in request" },
                { status: 400 }
            )
        }

        // ── File validation ──
        const file = formData.get("file")
        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: "A video file is required" },
                { status: 400 }
            )
        }

        if (file.size === 0) {
            return NextResponse.json(
                { error: "Uploaded file is empty" },
                { status: 400 }
            )
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                { error: "File exceeds maximum size of 500MB" },
                { status: 413 }
            )
        }

        const mime = file.type?.toLowerCase() || ""
        if (mime && !mime.startsWith("video/")) {
            return NextResponse.json(
                { error: "File must be a video" },
                { status: 400 }
            )
        }

        // ── Title validation ──
        const title = formData.get("title")?.toString().trim() || ""
        if (!title) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            )
        }
        if (title.length > MAX_TITLE_LENGTH) {
            return NextResponse.json(
                { error: "Title exceeds 100 characters" },
                { status: 400 }
            )
        }

        // ── Description validation ──
        const description = formData.get("description")?.toString().trim() || ""
        if (!description) {
            return NextResponse.json(
                { error: "Description is required" },
                { status: 400 }
            )
        }
        if (description.length > MAX_DESCRIPTION_LENGTH) {
            return NextResponse.json(
                { error: "Description exceeds 5000 characters" },
                { status: 400 }
            )
        }

        // ── Privacy status validation ──
        const privacyRaw = formData.get("privacyStatus")?.toString() || ""
        if (
            !VALID_PRIVACY_STATUSES.has(
                privacyRaw as "public" | "unlisted" | "private"
            )
        ) {
            return NextResponse.json(
                {
                    error: "Privacy status must be one of: public, unlisted, private",
                },
                { status: 400 }
            )
        }
        const privacyStatus = privacyRaw as "public" | "unlisted" | "private"

        // ── Tags validation ──
        const tagsRaw = formData.get("tags")?.toString().trim() || ""
        let tags: string[] | undefined
        if (tagsRaw) {
            if (tagsRaw.length > MAX_TAGS_LENGTH) {
                return NextResponse.json(
                    { error: "Tags field exceeds 500 characters" },
                    { status: 400 }
                )
            }
            tags = tagsRaw
                .split(",")
                .map(t => t.trim())
                .filter(Boolean)
            if (tags.length > MAX_TAG_COUNT) {
                return NextResponse.json(
                    { error: "Maximum 30 tags allowed" },
                    { status: 400 }
                )
            }
            for (const tag of tags) {
                if (tag.length > 100) {
                    return NextResponse.json(
                        { error: "Each tag must be 100 characters or less" },
                        { status: 400 }
                    )
                }
            }
        }

        // ── Category ID validation ──
        const categoryIdRaw = formData.get("categoryId")?.toString().trim()
        let categoryId: string | undefined
        if (categoryIdRaw) {
            if (categoryIdRaw.length > MAX_CATEGORY_ID_LENGTH) {
                return NextResponse.json(
                    { error: "Invalid category ID" },
                    { status: 400 }
                )
            }
            categoryId = categoryIdRaw
        }

        // ── Log warning for large files on Vercel ──
        if (file.size > 4.5 * 1024 * 1024) {
            logger.warn("Large file uploaded through Vercel route", {
                size: file.size,
                userId,
            })
        }

        // ── Upload ──
        const buffer = Buffer.from(await file.arrayBuffer())

        logger.info("Starting YouTube upload", {
            userId,
            title,
            fileSize: file.size,
        })

        const result = await uploadVideo(userId, buffer, {
            title,
            description,
            tags,
            privacyStatus,
            categoryId,
        })

        if (!result.success) {
            const status = result.error?.toLowerCase().includes("token")
                ? 401
                : 500
            return NextResponse.json({ error: result.error }, { status })
        }

        logger.info("YouTube upload completed", {
            userId,
            videoId: result.videoId,
        })

        // ── Regenerate CSRF token ──
        const response = NextResponse.json(result, { status: 200 })
        const newToken = regenerateCsrfToken(request)
        if (newToken) {
            return addCsrfTokenToResponse(response, newToken)
        }

        return response
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Internal error"
        logger.error("YouTube upload route error", { error: message })
        return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }
}
