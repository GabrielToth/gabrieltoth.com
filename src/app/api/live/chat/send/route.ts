import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getTokenStore } from "@/lib/token-store"
import { MessageAggregator } from "@/lib/realtime/message-aggregator"
import { getTwitchConfig } from "@/lib/twitch/config"

const logger = createLogger("ChatSendEndpoint")

interface CommandHandler {
    pattern: RegExp
    handler: (
        args: RegExpExecArray,
        api: HelixApi
    ) => Promise<{ ok: boolean; twitchStatus?: number; twitchError?: string }>
}

interface HelixApi {
    accessToken: string
    broadcasterId: string
    moderatorId: string
    clientId: string
}

async function lookupUserId(
    username: string,
    accessToken: string,
    clientId: string
): Promise<string | null> {
    const params = new URLSearchParams({ login: username.toLowerCase() })
    const response = await fetch(
        `https://api.twitch.tv/helix/users?${params.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Client-Id": clientId,
            },
        }
    )
    if (!response.ok) return null
    const data = await response.json()
    return data.data?.[0]?.id || null
}

async function execHelix(
    api: HelixApi,
    method: string,
    path: string,
    body?: Record<string, unknown>
): Promise<{ ok: boolean; twitchStatus?: number; twitchError?: string }> {
    const url = `https://api.twitch.tv/helix${path}`
    const headers: Record<string, string> = {
        Authorization: `Bearer ${api.accessToken}`,
        "Client-Id": api.clientId,
    }
    if (body) headers["Content-Type"] = "application/json"

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
        let twitchError: string | undefined
        try {
            const errBody = await response.json()
            twitchError =
                errBody.message || errBody.error || response.statusText
        } catch {
            twitchError = response.statusText
        }
        return { ok: false, twitchStatus: response.status, twitchError }
    }

    return { ok: true }
}

const COMMANDS: CommandHandler[] = [
    {
        pattern: /^\/timeout\s+(\S+)(?:\s+(\d+))?(?:\s+(.+))?$/i,
        handler: async (args, api) => {
            const targetUsername = args[1]
            const duration = args[2] ? parseInt(args[2]) : 600
            const targetId = await lookupUserId(
                targetUsername,
                api.accessToken,
                api.clientId
            )
            if (!targetId)
                return {
                    ok: false,
                    twitchStatus: 404,
                    twitchError: "User not found",
                }
            const data: Record<string, unknown> = {
                user_id: targetId,
                reason: args[3] || "",
            }
            if (duration) data.duration = duration
            return execHelix(
                api,
                "POST",
                `/moderation/bans?broadcaster_id=${api.broadcasterId}&moderator_id=${api.moderatorId}`,
                { data }
            )
        },
    },
    {
        pattern: /^\/ban\s+(\S+)(?:\s+(.+))?$/i,
        handler: async (args, api) => {
            const targetUsername = args[1]
            const targetId = await lookupUserId(
                targetUsername,
                api.accessToken,
                api.clientId
            )
            if (!targetId)
                return {
                    ok: false,
                    twitchStatus: 404,
                    twitchError: "User not found",
                }
            return execHelix(
                api,
                "POST",
                `/moderation/bans?broadcaster_id=${api.broadcasterId}&moderator_id=${api.moderatorId}`,
                { data: { user_id: targetId, reason: args[2] || "" } }
            )
        },
    },
    {
        pattern: /^\/unban\s+(\S+)$/i,
        handler: async (args, api) => {
            const targetUsername = args[1]
            const targetId = await lookupUserId(
                targetUsername,
                api.accessToken,
                api.clientId
            )
            if (!targetId)
                return {
                    ok: false,
                    twitchStatus: 404,
                    twitchError: "User not found",
                }
            return execHelix(
                api,
                "DELETE",
                `/moderation/bans?broadcaster_id=${api.broadcasterId}&moderator_id=${api.moderatorId}&user_id=${targetId}`
            )
        },
    },
    // /slow [seconds], /slow on|off, /slowon, /slowoff
    {
        pattern: /^\/slow(?: (?:(\d+)|on|off))?$/i,
        handler: async (args, api) => {
            const raw = args[1]
            if (!raw || raw === "on") {
                return execHelix(
                    api,
                    "PATCH",
                    `/chat/settings?broadcaster_id=${api.broadcasterId}&moderator_id=${api.moderatorId}`,
                    { slow_mode: true, slow_mode_wait_time: 30 }
                )
            }
            if (raw === "off") {
                return execHelix(
                    api,
                    "PATCH",
                    `/chat/settings?broadcaster_id=${api.broadcasterId}&moderator_id=${api.moderatorId}`,
                    { slow_mode: false }
                )
            }
            const seconds = Math.max(3, parseInt(raw))
            return execHelix(
                api,
                "PATCH",
                `/chat/settings?broadcaster_id=${api.broadcasterId}&moderator_id=${api.moderatorId}`,
                { slow_mode: true, slow_mode_wait_time: seconds }
            )
        },
    },
    {
        pattern: /^\/slowon$/i,
        handler: async (_args, api) => {
            return execHelix(
                api,
                "PATCH",
                `/chat/settings?broadcaster_id=${api.broadcasterId}&moderator_id=${api.moderatorId}`,
                { slow_mode: true, slow_mode_wait_time: 30 }
            )
        },
    },
    {
        pattern: /^\/slowoff$/i,
        handler: async (_args, api) => {
            return execHelix(
                api,
                "PATCH",
                `/chat/settings?broadcaster_id=${api.broadcasterId}&moderator_id=${api.moderatorId}`,
                { slow_mode: false }
            )
        },
    },
    // Subscribers mode — all aliases, enable/disable
    {
        pattern: /^\/subscribersoff$/i,
        handler: async (_args, api) => {
            return execHelix(
                api,
                "PATCH",
                `/chat/settings?broadcaster_id=${api.broadcasterId}&moderator_id=${api.moderatorId}`,
                { subscriber_mode: false }
            )
        },
    },
    {
        pattern: /^\/subon$/i,
        handler: async (_args, api) => {
            return execHelix(
                api,
                "PATCH",
                `/chat/settings?broadcaster_id=${api.broadcasterId}&moderator_id=${api.moderatorId}`,
                { subscriber_mode: true }
            )
        },
    },
    {
        pattern: /^\/suboff$/i,
        handler: async (_args, api) => {
            return execHelix(
                api,
                "PATCH",
                `/chat/settings?broadcaster_id=${api.broadcasterId}&moderator_id=${api.moderatorId}`,
                { subscriber_mode: false }
            )
        },
    },
    {
        pattern: /^\/sub(?:scriber)?\s+(on|off)$/i,
        handler: async (args, api) => {
            return execHelix(
                api,
                "PATCH",
                `/chat/settings?broadcaster_id=${api.broadcasterId}&moderator_id=${api.moderatorId}`,
                { subscriber_mode: args[1] === "on" }
            )
        },
    },
    {
        pattern: /^\/(?:subonly|subscribersonly|subscribers)$/i,
        handler: async (_args, api) => {
            return execHelix(
                api,
                "PATCH",
                `/chat/settings?broadcaster_id=${api.broadcasterId}&moderator_id=${api.moderatorId}`,
                { subscriber_mode: true }
            )
        },
    },
]

async function tryHelixCommand(
    message: string,
    api: HelixApi
): Promise<{
    ok: boolean
    twitchStatus?: number
    twitchError?: string
} | null> {
    for (const cmd of COMMANDS) {
        const match = cmd.pattern.exec(message)
        if (match) {
            return cmd.handler(match, api)
        }
    }
    return null
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const userId = session.user.id
        const body = await request.json()
        const { platform, message } = body

        if (!platform || !message) {
            return NextResponse.json(
                { success: false, error: "MISSING_FIELDS" },
                { status: 400 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        if (platform === "kick") {
            const tokenStore = getTokenStore()
            const stored = await tokenStore.getToken(userId, "kick")
            if (!stored?.accessToken) {
                return NextResponse.json(
                    { success: false, error: "NO_TOKEN" },
                    { status: 400 }
                )
            }

            const { data: kickNetwork } = await supabase
                .from("social_networks")
                .select("metadata")
                .eq("user_id", userId)
                .eq("platform", "kick")
                .eq("status", "connected")
                .single()

            const broadcasterUserId = kickNetwork?.metadata?.channelId

            const body: Record<string, unknown> = { content: message }
            if (broadcasterUserId) {
                body.broadcaster_user_id = broadcasterUserId
            }

            const response = await fetch(
                "https://api.kick.com/public/v1/chat",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${stored.accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(body),
                }
            )

            if (!response.ok) {
                const errorBody = await response.text()
                logger.error("Kick send message failed", {
                    status: response.status,
                    body: errorBody,
                })
                return NextResponse.json(
                    { success: false, error: "KICK_SEND_FAILED" },
                    { status: 500 }
                )
            }

            return NextResponse.json({ success: true })
        }

        if (platform !== "twitch") {
            return NextResponse.json(
                { success: false, error: "UNSUPPORTED_PLATFORM" },
                { status: 400 }
            )
        }

        const { data: network } = await supabase
            .from("social_networks")
            .select("platform_username, platform_user_id")
            .eq("user_id", userId)
            .eq("platform", "twitch")
            .eq("status", "connected")
            .single()

        if (!network?.platform_username) {
            return NextResponse.json(
                { success: false, error: "TWITCH_NOT_CONNECTED" },
                { status: 400 }
            )
        }

        const tokenStore = getTokenStore()
        const stored = await tokenStore.getToken(userId, "twitch")
        if (!stored?.accessToken) {
            return NextResponse.json(
                { success: false, error: "NO_TOKEN" },
                { status: 400 }
            )
        }

        // Try Helix API for moderation commands
        const config = getTwitchConfig()
        const api: HelixApi = {
            accessToken: stored.accessToken,
            broadcasterId: network.platform_user_id,
            moderatorId: network.platform_user_id,
            clientId: config.oauth.clientId,
        }

        const helixResult = await tryHelixCommand(message, api)
        if (helixResult) {
            if (helixResult.ok) {
                return NextResponse.json({ success: true })
            }
            if (helixResult.twitchStatus === 403) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "MISSING_SCOPE",
                        message:
                            "Twitch token missing required scope. Reconnect your Twitch account in Settings.",
                    },
                    { status: 403 }
                )
            }
            return NextResponse.json(
                {
                    success: false,
                    error: "MOD_COMMAND_FAILED",
                    message: helixResult.twitchError || "Twitch API error",
                },
                { status: 500 }
            )
        }

        // Fallback to IRC for regular messages and /me
        const sentViaActive = await MessageAggregator.sendMessage(
            userId,
            "twitch",
            network.platform_username,
            message,
            stored.accessToken
        )

        return NextResponse.json({ success: true, sentViaActive })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Chat send failed", err)
        return NextResponse.json(
            { success: false, error: "SEND_FAILED", message: err.message },
            { status: 500 }
        )
    }
}
