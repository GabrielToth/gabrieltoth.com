import {
    fromEncryptedRecord,
    toEncryptedRecord,
} from "@/lib/external-sessions/vault"
import {
    EncryptedSessionVaultRecord,
    ExternalAccountSession,
} from "@/lib/external-sessions/types"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth/get-server-session"

const logger = createLogger("ExternalSessionsAPI")

/**
 * GET /api/external-sessions
 * Returns list of managed external account sessions (with decrypted metadata, cookies hidden by default)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data, error } = await supabase
            .from("external_account_sessions")
            .select(
                "id, manager_user_id, managed_client_name, platform, platform_username, status, user_agent, last_used_at, expires_at, created_at, updated_at"
            )
            .eq("manager_user_id", session.user.id)

        if (error) {
            logger.error("Failed to fetch external account sessions", error)
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, data: data || [] })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("ExternalSessions GET error", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}

/**
 * POST /api/external-sessions
 * Stores or updates an encrypted session payload for a managed client (e.g. Waveigl)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            managedClientName,
            platform,
            platformUsername,
            cookies,
            authTokens,
            userAgent,
            expiresAt,
        } = body

        if (
            !managedClientName ||
            !platform ||
            !platformUsername ||
            !Array.isArray(cookies)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: "MISSING_REQUIRED_FIELDS",
                    details:
                        "managedClientName, platform, platformUsername, and cookies array are required.",
                },
                { status: 400 }
            )
        }

        const newSession: ExternalAccountSession = {
            id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            managerUserId: session.user.id,
            managedClientName,
            platform,
            platformUsername,
            status: "active",
            cookies,
            authTokens,
            userAgent,
            expiresAt,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        const encryptedRecord = toEncryptedRecord(newSession)

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { error } = await supabase
            .from("external_account_sessions")
            .upsert({
                id: encryptedRecord.id,
                manager_user_id: encryptedRecord.managerUserId,
                managed_client_name: encryptedRecord.managedClientName,
                platform: encryptedRecord.platform,
                platform_username: encryptedRecord.platformUsername,
                status: encryptedRecord.status,
                encrypted_payload: encryptedRecord.encryptedPayload,
                user_agent: encryptedRecord.userAgent,
                expires_at: encryptedRecord.expiresAt,
                created_at: encryptedRecord.createdAt,
                updated_at: encryptedRecord.updatedAt,
            })

        if (error) {
            logger.error("Failed to store encrypted session", error)
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                id: newSession.id,
                managedClientName: newSession.managedClientName,
                platform: newSession.platform,
                platformUsername: newSession.platformUsername,
                status: newSession.status,
            },
        })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("ExternalSessions POST error", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/external-sessions?id=...
 * Revokes and deletes a managed external session payload
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json(
                { success: false, error: "MISSING_ID" },
                { status: 400 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { error } = await supabase
            .from("external_account_sessions")
            .delete()
            .eq("id", id)
            .eq("manager_user_id", session.user.id)

        if (error) {
            logger.error("Failed to delete external account session", error)
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("ExternalSessions DELETE error", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}
