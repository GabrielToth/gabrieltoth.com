/**
 * GET /api/chat-commands - List custom chat commands
 * POST /api/chat-commands - Create/Execute custom chat commands
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import {
    CustomChatCommand,
    matchAndExecuteCustomCommand,
} from "@/lib/chat/custom-commands"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("ChatCommandsAPI")

const mockCommandsStore: CustomChatCommand[] = [
    {
        id: "1",
        trigger: "!discord",
        responseTemplate: "Join our Discord: https://discord.gg/gabrieltoth",
        enabled: true,
    },
    {
        id: "2",
        trigger: "!specs",
        responseTemplate: "PC Specs: Ryzen 9 7900X, RTX 4080, 64GB RAM",
        enabled: true,
    },
]

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        return NextResponse.json({ success: true, data: mockCommandsStore })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to list chat commands", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
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

        const body = await request.json()
        const {
            action,
            trigger,
            responseTemplate,
            messageText,
            username,
            platform,
        } = body

        if (action === "execute") {
            const result = matchAndExecuteCustomCommand(
                messageText,
                mockCommandsStore,
                { username: username || "User", platform: platform || "Twitch" }
            )
            return NextResponse.json({ success: true, data: result })
        }

        if (!trigger || !responseTemplate) {
            return NextResponse.json(
                { success: false, error: "INVALID_COMMAND_DATA" },
                { status: 400 }
            )
        }

        const newCmd: CustomChatCommand = {
            id: String(Date.now()),
            trigger: trigger.startsWith("!") ? trigger : `!${trigger}`,
            responseTemplate,
            enabled: true,
        }

        mockCommandsStore.push(newCmd)

        return NextResponse.json({ success: true, data: newCmd })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Failed to process chat command", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}
