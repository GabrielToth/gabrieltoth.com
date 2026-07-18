import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"

const logger = createLogger("TokenHealth")

const TERMINAL_ERROR_MESSAGES = [
    "invalid authentication credentials",
    "login required",
    "invalid credentials",
    "invalid_grant",
    "token has been revoked",
    "token has been expired",
    "unauthorized_client",
]

export function isTerminalTokenError(errorMessage: string): boolean {
    const lower = errorMessage.toLowerCase()
    return TERMINAL_ERROR_MESSAGES.some(msg => lower.includes(msg))
}

export async function markAccountDisconnected(
    userId: string,
    platform: string
): Promise<void> {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: existing } = await supabase
            .from("social_networks")
            .select("id, metadata")
            .eq("user_id", userId)
            .eq("platform", platform)

        const rows = existing || []

        for (const row of rows) {
            const metadata = (row.metadata as Record<string, unknown>) || {}
            await supabase
                .from("social_networks")
                .update({
                    status: "disconnected",
                    metadata: {
                        ...metadata,
                        previousStatus: "connected",
                        disconnectedAt: new Date().toISOString(),
                        disconnectReason: "token_error",
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq("id", row.id)
        }

        logger.info("Account marked as disconnected due to token error", {
            userId,
            platform,
            rowCount: rows.length,
        })
    } catch (error) {
        logger.error("Failed to mark account as disconnected", {
            userId,
            platform,
            error: String(error),
        })
    }
}
