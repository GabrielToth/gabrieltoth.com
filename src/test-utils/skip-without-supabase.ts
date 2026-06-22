import { createClient } from "@supabase/supabase-js"

/** Returns false when Supabase is unreachable or admin API is unavailable. */
export async function isSupabaseAvailable(): Promise<boolean> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        return false
    }

    try {
        const client = createClient(url, key)
        const { error } = await client.from("users").select("id").limit(1)
        if (error?.message?.includes("fetch")) {
            return false
        }

        return true
    } catch {
        return false
    }
}

/** Returns false when audit_logs table lacks expected columns (schema drift). */
export async function isAuditLogsSchemaReady(): Promise<boolean> {
    if (!(await isSupabaseAvailable())) {
        return false
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

    try {
        const client = createClient(url, key)
        const { error } = await client
            .from("audit_logs")
            .select("email")
            .limit(1)
        if (error?.code === "PGRST204") {
            return false
        }
        return true
    } catch {
        return false
    }
}

export async function skipSuiteWithoutSupabase(ctx: {
    skip: (note?: string) => void
}): Promise<boolean> {
    if (!(await isSupabaseAvailable())) {
        ctx.skip("Supabase not available")
        return false
    }
    return true
}
