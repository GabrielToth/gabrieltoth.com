import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("ClonerConfigsAPI")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data, error } = await supabase
            .from("cloner_configs")
            .select("*, target_group:channel_groups!cloner_configs_target_group_id_fkey(*)")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })

        if (error) throw error
        return NextResponse.json({ success: true, data })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("ClonerConfigs GET error", err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 })
        }

        const body = await request.json()
        if (!body.source_channel_url) {
            return NextResponse.json({ success: false, error: "MISSING_URL" }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data, error } = await supabase
            .from("cloner_configs")
            .insert({
                user_id: session.user.id,
                source_channel_url: body.source_channel_url,
                target_group_id: body.target_group_id || null,
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ success: true, data })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("ClonerConfigs POST error", err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        if (!id) {
            return NextResponse.json({ success: false, error: "MISSING_ID" }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { error } = await supabase
            .from("cloner_configs")
            .delete()
            .eq("id", id)
            .eq("user_id", session.user.id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("ClonerConfigs DELETE error", err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
