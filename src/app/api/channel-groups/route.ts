import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("ChannelGroupsAPI")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data, error } = await supabase
            .from("channel_groups")
            .select("*, members:channel_group_members(*)")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })

        if (error) throw error
        return NextResponse.json({ success: true, data })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("ChannelGroups GET error", err)
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
        if (!body.name) {
            return NextResponse.json(
                { success: false, error: "MISSING_NAME" },
                { status: 400 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data, error } = await supabase
            .from("channel_groups")
            .insert({
                user_id: session.user.id,
                name: body.name,
                description: body.description || "",
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ success: true, data })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("ChannelGroups POST error", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}
