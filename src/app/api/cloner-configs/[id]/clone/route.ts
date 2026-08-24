import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("ClonerConfigsCloneAPI")

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const { id } = await params

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        )

        const { data: config, error: fetchError } = await supabase
            .from("cloner_configs")
            .select("*")
            .eq("id", id)
            .eq("user_id", session.user.id)
            .single()

        if (fetchError || !config) {
            return NextResponse.json(
                { success: false, error: "NOT_FOUND" },
                { status: 404 }
            )
        }

        const { data: job, error: jobError } = await supabase
            .from("clone_jobs")
            .insert({
                user_id: session.user.id,
                source_channel_url: config.source_channel_url,
                target_group_id: config.target_group_id,
                status: "pending",
                source_type: "youtube",
            })
            .select()
            .single()

        if (jobError) throw jobError

        await supabase
            .from("cloner_configs")
            .update({
                last_cloned_at: new Date().toISOString(),
                status: "running",
            })
            .eq("id", id)

        logger.info("Clone job created", { jobId: job.id, configId: id })
        return NextResponse.json({ success: true, data: job })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("ClonerConfigs clone POST error", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}
