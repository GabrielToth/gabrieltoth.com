import { createClient } from "@supabase/supabase-js"

/** Returns false when Supabase is unreachable (local stack not running). */
export async function isSupabaseAvailable(): Promise<boolean> {
    try {
        const client = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
            process.env.SUPABASE_SERVICE_ROLE_KEY || "test"
        )
        const { error } = await client.from("users").select("id").limit(1)
        if (error?.message?.includes("fetch")) {
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
