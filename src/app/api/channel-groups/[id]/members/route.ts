import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("ChannelGroupMembersAPI")

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await context.params
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: group } = await supabase
            .from("channel_groups")
            .select("id")
            .eq("id", id)
            .eq("user_id", session.user.id)
            .single()

        if (!group) {
            return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 })
        }

        const { data, error } = await supabase
            .from("channel_group_members")
            .select("*")
            .eq("group_id", id)

        if (error) throw error
        return NextResponse.json({ success: true, data })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Members GET error", err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await context.params
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 })
        }

        const body = await request.json()
        if (!body.platform || !body.platform_username) {
            return NextResponse.json({ success: false, error: "MISSING_FIELDS" }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: group } = await supabase
            .from("channel_groups")
            .select("id")
            .eq("id", id)
            .eq("user_id", session.user.id)
            .single()

        if (!group) {
            return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 })
        }

        const { data, error } = await supabase
            .from("channel_group_members")
            .insert({
                group_id: id,
                social_network_id: body.social_network_id || null,
                platform: body.platform,
                platform_username: body.platform_username,
                platform_user_id: body.platform_user_id || "",
                settings: body.settings || {},
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ success: true, data })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Members POST error", err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await context.params
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const memberId = searchParams.get("memberId")
        if (!memberId) {
            return NextResponse.json({ success: false, error: "MISSING_MEMBER_ID" }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: group } = await supabase
            .from("channel_groups")
            .select("id")
            .eq("id", id)
            .eq("user_id", session.user.id)
            .single()

        if (!group) {
            return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 })
        }

        const { error } = await supabase
            .from("channel_group_members")
            .delete()
            .eq("id", memberId)
            .eq("group_id", id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Members DELETE error", err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
