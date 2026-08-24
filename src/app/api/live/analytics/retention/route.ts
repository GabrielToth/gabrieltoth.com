import { NextResponse } from "next/server"
import {
    calculateViewerRetention,
    ViewerDataPoint,
    ChatDataPoint,
} from "@/lib/live/viewer-analytics"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const {
            viewerHistory = [],
            chatHistory = [],
        }: { viewerHistory: ViewerDataPoint[]; chatHistory: ChatDataPoint[] } =
            body

        const retention = calculateViewerRetention(viewerHistory, chatHistory)

        return NextResponse.json({ success: true, retention })
    } catch (_err) {
        return NextResponse.json(
            { error: "Invalid viewer analytics history provided" },
            { status: 400 }
        )
    }
}
