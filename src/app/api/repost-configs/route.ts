import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("RepostConfigsAPI")

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
            .from("repost_configs")
            .select(
                "*, source_channel:channels!repost_configs_source_channel_id_fkey(*), target_group:channel_groups!repost_configs_target_group_id_fkey(*)"
            )
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })

        if (error) throw error
        return NextResponse.json({ success: true, data })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("RepostConfigs GET error", err)
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
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data, error } = await supabase
            .from("repost_configs")
            .insert({
                user_id: session.user.id,
                source_platform: body.source_platform || "youtube",
                source_channel_id: body.source_channel_id || null,
                source_channel_url: body.source_channel_url || "",
                target_group_id: body.target_group_id || null,
                check_interval_minutes: body.check_interval_minutes || 360,
                enabled: body.enabled !== false,
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ success: true, data })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("RepostConfigs POST error", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const body = await request.json()
        if (!body.id) {
            return NextResponse.json(
                { success: false, error: "MISSING_ID" },
                { status: 400 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const update: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        }
        if (body.enabled !== undefined) update.enabled = body.enabled
        if (body.check_interval_minutes)
            update.check_interval_minutes = body.check_interval_minutes
        if (body.target_group_id !== undefined)
            update.target_group_id = body.target_group_id

        const { error } = await supabase
            .from("repost_configs")
            .update(update)
            .eq("id", body.id)
            .eq("user_id", session.user.id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("RepostConfigs PATCH error", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        if (!id) {
            return NextResponse.json(
                { success: false, error: "MISSING_ID" },
                { status: 400 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { error } = await supabase
            .from("repost_configs")
            .delete()
            .eq("id", id)
            .eq("user_id", session.user.id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("RepostConfigs DELETE error", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}
