import { createClient } from "@supabase/supabase-js"
import { NextRequest } from "next/server"

import { createLogger } from "@/lib/logger"

const logger = createLogger("getCurrentUserId")

export async function getCurrentUserId(
    request: NextRequest
): Promise<string | null> {
    try {
        const sessionToken =
            request.cookies.get("auth_session")?.value ||
            request.cookies.get("session")?.value

        if (!sessionToken) {
            return null
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: session } = await supabase
            .from("sessions")
            .select("user_id, expires_at")
            .eq("token_hash", sessionToken)
            .single()

        if (!session) {
            return null
        }

        if (new Date(session.expires_at) < new Date()) {
            return null
        }

        return session.user_id
    } catch (error) {
        logger.error("Failed to get current user ID", {
            error: error instanceof Error ? error.message : String(error),
        })
        return null
    }
}
