import { db } from "@/lib/db"
import { NextRequest } from "next/server"

export interface SessionUser {
    id: string
    email: string
    name: string
}

export async function getSessionUser(
    request: NextRequest
): Promise<SessionUser | null> {
    const sessionToken = request.cookies.get("session")?.value
    if (!sessionToken) return null

    const session = await db.queryOne<{ user_id: string; expires_at: Date }>(
        "SELECT user_id, expires_at FROM sessions WHERE session_id = $1",
        [sessionToken]
    )

    if (!session) return null
    if (new Date(session.expires_at) < new Date()) return null

    const user = await db.queryOne<{
        id: string
        google_email: string
        google_name: string
    }>(
        "SELECT id, google_email, google_name FROM users WHERE id = $1",
        [session.user_id]
    )

    if (!user) return null

    return {
        id: user.id,
        email: user.google_email,
        name: user.google_name,
    }
}

export function isAdminUser(userId: string): boolean {
    const adminIds = process.env.CREDIT_ADMIN_IDS ?? ""
    return adminIds
        .split(",")
        .map(id => id.trim())
        .filter(Boolean)
        .includes(userId)
}
