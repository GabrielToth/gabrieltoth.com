import { createLogger } from "@/lib/logger"
import { getTokenStore } from "@/lib/token-store"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

const logger = createLogger("MetaUserDataDeletion")

export interface DeletionResult {
    confirmationCode: string
    statusUrl: string
    deletedCount: number
}

/**
 * Executes user data deletion following Meta Platform Data Deletion requirements.
 */
export async function processMetaUserDataDeletion(
    metaUserId: string
): Promise<DeletionResult> {
    const confirmationCode = crypto.randomBytes(16).toString("hex")
    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://www.gabrieltoth.com"
    const statusUrl = `${baseUrl}/privacy-policy?deletion_code=${confirmationCode}`

    logger.info("Processing Meta user data deletion request", {
        metaUserId,
        confirmationCode,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    let deletedCount = 0

    if (supabaseUrl && supabaseKey) {
        try {
            const supabase = createClient(supabaseUrl, supabaseKey)

            const { data: records, error: findError } = await supabase
                .from("social_networks")
                .select("id, user_id, platform")
                .or("platform.eq.facebook,platform.eq.instagram")
                .eq("platform_user_id", metaUserId)

            if (findError) {
                logger.warn(
                    "Could not query social_networks by platform_user_id",
                    {
                        error: findError.message,
                        metaUserId,
                    }
                )
            }

            const tokenStore = getTokenStore()

            if (records && records.length > 0) {
                for (const record of records) {
                    try {
                        await tokenStore.deleteToken(
                            record.user_id,
                            record.platform
                        )
                    } catch (tokErr) {
                        logger.warn("Failed to delete token from tokenStore", {
                            userId: record.user_id,
                            platform: record.platform,
                            error:
                                tokErr instanceof Error
                                    ? tokErr.message
                                    : String(tokErr),
                        })
                    }

                    const { error: delError } = await supabase
                        .from("social_networks")
                        .delete()
                        .eq("id", record.id)

                    if (!delError) {
                        deletedCount++
                    }
                }
            }
        } catch (dbError) {
            logger.error("Error executing Meta data deletion in database", {
                metaUserId,
                error:
                    dbError instanceof Error
                        ? dbError.message
                        : String(dbError),
            })
        }
    }

    logger.info("Meta user data deletion completed", {
        metaUserId,
        confirmationCode,
        deletedCount,
    })

    return {
        confirmationCode,
        statusUrl,
        deletedCount,
    }
}
