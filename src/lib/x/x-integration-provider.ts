/**
 * X.com (Twitter) Integration — Session Cookie Provider
 *
 * Provides the Unofficial X Adapter with session cookies retrieved from
 * the AES-256 encrypted CookieVault (Supabase storage).
 *
 * This is the ORCHESTRATION LAYER: decide official vs unofficial, hydrate
 * the adapter, bill credits, and log telemetry.
 */

import { createLogger } from "@/lib/logger"
import { CookieVault, type StoredSessionCookie } from "@/lib/cookies/cookie-vault"
import {
    xCheckSession,
    type XSessionCookies,
} from "./unofficial-x-adapter"
import { createClient } from "@supabase/supabase-js"

const logger = createLogger("XIntegrationProvider")

export interface XIntegrationConfig {
    userId: string
    optInUnofficial: boolean // user explicitly chose unofficial
    forceUnofficial?: boolean // dev/testing override
}

/**
 * Extract relevant X session cookies from a decrypted vault payload.
 */
export function extractXSessionCookies(
    decrypted: StoredSessionCookie[]
): XSessionCookies {
    const lookup = (name: string) =>
        decrypted.find(c => c.name === name)?.value || ""

    return {
        authToken: lookup("auth_token"),
        ct0: lookup("ct0"),
        guestToken: lookup("gt"),
        twid: lookup("twid"),
        d_prefs: lookup("d_prefs"),
    }
}

/**
 * Resolve whether to use the official X adapter or the unofficial one.
 * If unofficial is chosen, validate cookies first.
 */
export async function resolveXIntegrationMode(config: XIntegrationConfig): Promise<{
    mode: "official" | "unofficial" | "none"
    cookies?: XSessionCookies
    error?: string
}> {
    if (config.forceUnofficial) {
        return { mode: "unofficial" }
    }

    if (!config.optInUnofficial) {
        return { mode: "official" }
    }

    // Opted in: try to hydrate unofficial session from vault
    const vault = new CookieVault()
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
    )

    const { data: sessionRow, error } = await supabase
        .from("client_sessions")
        .select("payload")
        .eq("user_id", config.userId)
        .eq("platform", "twitter")
        .single()

    if (error || !sessionRow?.payload?.encryptedCookies) {
        logger.warn("No X session cookies in vault", {
            userId: config.userId,
            error: error?.message,
        })
        return { mode: "none", error: "SESSION_NOT_IN_VAULT" }
    }

    try {
        const decrypted = vault.decryptCookies(
            sessionRow.payload.encryptedCookies,
            sessionRow.payload.iv
        )
        const cookies = extractXSessionCookies(decrypted)

        if (!cookies.authToken || !cookies.ct0) {
            return { mode: "none", error: "INCOMPLETE_COOKIES" }
        }

        // Validate session is alive
        const check = await xCheckSession(cookies)
        if (!check.valid) {
            logger.warn("X session cookies expired", {
                userId: config.userId,
                error: check.error,
            })
            return { mode: "none", error: "SESSION_EXPIRED" }
        }

        logger.info("X unofficial session validated", {
            userId: config.userId,
            username: check.username,
        })
        return { mode: "unofficial", cookies }
    } catch (err) {
        logger.error("Failed to decrypt X session cookies", {
            userId: config.userId,
            error: err instanceof Error ? err.message : String(err),
        })
        return { mode: "none", error: "DECRYPT_FAILED" }
    }
}
