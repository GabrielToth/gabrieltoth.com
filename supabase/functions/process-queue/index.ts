// Supabase Edge Function for processing publication queue
// Deploy with: supabase functions deploy process-queue
// Schedule with: pg_cron extension in Supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
}

serve(async req => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        // Verify authorization
        const authHeader = req.headers.get("Authorization")
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "Missing authorization header" }),
                {
                    status: 401,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: { Authorization: authHeader },
                },
            }
        )

        // Get due publications
        const { data: publications, error: fetchError } = await supabaseClient
            .from("scheduled_posts")
            .select("*, scheduled_post_networks(*)")
            .eq("status", "pending")
            .lte("scheduled_time", new Date().toISOString())
            .limit(10)

        if (fetchError) {
            throw fetchError
        }

        if (!publications || publications.length === 0) {
            return new Response(
                JSON.stringify({
                    processed: 0,
                    message: "No publications due",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            )
        }

        const results = []

        for (const publication of publications) {
            try {
                // Mark as processing
                await supabaseClient
                    .from("scheduled_posts")
                    .update({ status: "processing" })
                    .eq("id", publication.id)

                // Process publication (call your API endpoint)
                const response = await fetch(
                    `${Deno.env.get("APP_URL")}/api/queue/process-publication`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: authHeader,
                        },
                        body: JSON.stringify({ publicationId: publication.id }),
                    }
                )

                const result = await response.json()

                results.push({
                    publicationId: publication.id,
                    status: result.success ? "success" : "failed",
                })
            } catch (error) {
                console.error(
                    `Failed to process publication ${publication.id}:`,
                    error
                )
                results.push({
                    publicationId: publication.id,
                    status: "error",
                    error: error.message,
                })
            }
        }

        return new Response(
            JSON.stringify({
                processed: results.length,
                results,
                timestamp: new Date().toISOString(),
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: "Failed to process queue",
                details: error.message,
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        )
    }
})
