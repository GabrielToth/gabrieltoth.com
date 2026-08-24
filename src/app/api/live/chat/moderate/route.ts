import { NextResponse } from "next/server"
import { ChatModerator, ModerationRule } from "@/lib/chat/moderation"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const {
            message = "",
            rules = [],
        }: { message: string; rules: ModerationRule[] } = body

        const moderator = new ChatModerator(rules)
        const result = moderator.evaluateMessage(message)

        return NextResponse.json({ success: true, result })
    } catch (_err) {
        return NextResponse.json(
            { error: "Failed to evaluate message" },
            { status: 400 }
        )
    }
}
