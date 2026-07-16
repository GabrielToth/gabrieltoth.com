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
    handler: (args: RegExpExecArray, api: HelixApi) => Promise<boolean>
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

async function execHelixBan(
    api: HelixApi,
    targetUserId: string,
    duration?: number
): Promise<boolean> {
    const data: Record<string, unknown> = { user_id: targetUserId, reason: "" }
    if (duration) data.duration = duration
    const body = { data }

    const params = new URLSearchParams({
        broadcaster_id: api.broadcasterId,
        moderator_id: api.moderatorId,
    })

    const response = await fetch(
        `https://api.twitch.tv/helix/moderation/bans?${params.toString()}`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${api.accessToken}`,
                "Client-Id": api.clientId,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }
    )
    return response.ok
}

async function execHelixUnban(
    api: HelixApi,
    targetUserId: string
): Promise<boolean> {
    const params = new URLSearchParams({
        broadcaster_id: api.broadcasterId,
        moderator_id: api.moderatorId,
        user_id: targetUserId,
    })

    const response = await fetch(
        `https://api.twitch.tv/helix/moderation/bans?${params.toString()}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${api.accessToken}`,
                "Client-Id": api.clientId,
            },
        }
    )
    return response.ok
}

async function execHelixChatSettings(
    api: HelixApi,
    settings: Record<string, unknown>
): Promise<boolean> {
    const params = new URLSearchParams({
        broadcaster_id: api.broadcasterId,
        moderator_id: api.moderatorId,
    })

    const response = await fetch(
        `https://api.twitch.tv/helix/chat/settings?${params.toString()}`,
        {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${api.accessToken}`,
                "Client-Id": api.clientId,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: settings as Record<string, unknown> }),
        }
    )
    return response.ok
}

const COMMANDS: CommandHandler[] = [
    {
        pattern: /^\/timeout\s+(\S+)(?:\s+(\d+))?(?:\s+(.+))?$/i,
        handler: async (args, api) => {
            const targetUsername = args[1]
            const duration = args[2] ? parseInt(args[2]) : 600
            const targetId = await lookupUserId(targetUsername, api.accessToken, api.clientId)
            if (!targetId) return false
            return execHelixBan(api, targetId, duration)
        },
    },
    {
        pattern: /^\/ban\s+(\S+)(?:\s+(.+))?$/i,
        handler: async (args, api) => {
            const targetUsername = args[1]
            const targetId = await lookupUserId(targetUsername, api.accessToken, api.clientId)
            if (!targetId) return false
            return execHelixBan(api, targetId)
        },
    },
    {
        pattern: /^\/unban\s+(\S+)$/i,
        handler: async (args, api) => {
            const targetUsername = args[1]
            const targetId = await lookupUserId(targetUsername, api.accessToken, api.clientId)
            if (!targetId) return false
            return execHelixUnban(api, targetId)
        },
    },
    {
        pattern: /^\/slow(?:\s+(\d+))?$/i,
        handler: async (args, api) => {
            const seconds = args[1] ? parseInt(args[1]) : 30
            return execHelixChatSettings(api, {
                slow_mode: true,
                slow_mode_wait_time: seconds,
            })
        },
    },
    {
        pattern: /^\/subscribers$/i,
        handler: async (_args, api) => {
            return execHelixChatSettings(api, {
                subscriber_mode: true,
            })
        },
    },
]

async function tryHelixCommand(
    message: string,
    api: HelixApi
): Promise<"ok" | "failed" | null> {
    for (const cmd of COMMANDS) {
        const match = cmd.pattern.exec(message)
        if (match) {
            const success = await cmd.handler(match, api)
            return success ? "ok" : "failed"
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

        if (platform !== "twitch") {
            return NextResponse.json(
                { success: false, error: "UNSUPPORTED_PLATFORM" },
                { status: 400 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

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
        if (helixResult === "ok") {
            return NextResponse.json({ success: true })
        }
        if (helixResult === "failed") {
            return NextResponse.json(
                { success: false, error: "MOD_COMMAND_FAILED" },
                { status: 500 }
            )
        }

        // Fallback to IRC for regular messages and /me
        await MessageAggregator.sendMessage(
            userId,
            "twitch",
            network.platform_username,
            message,
            stored.accessToken
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Chat send failed", err)
        return NextResponse.json(
            { success: false, error: "SEND_FAILED", message: err.message },
            { status: 500 }
        )
    }
}