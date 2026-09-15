/**
 * /api/chat-commands Endpoint
 * GET: List all custom commands for current user (including defaults)
 * POST: Create/Update a custom command
 * DELETE: Delete a custom command
 */

import { getServerSession } from "@/lib/auth/get-server-session"
import { createLogger } from "@/lib/logger"
import { getAdminClient } from "@/lib/supabase/server"
import {
    CustomChatCommand,
    DEFAULT_COMMANDS,
} from "@/lib/chat/types"
import { NextRequest, NextResponse } from "next/server"

const logger = createLogger("ChatCommandsAPI")

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "UNAUTHORIZED" },
                { status: 401 }
            )
        }

        const userId = session.user.id
        const supabase = getAdminClient()

        // Fetch custom user commands
        const { data: dbCommands, error } = await supabase
            .from("custom_commands")
            .select("*")
            .eq("user_id", userId)

        if (error) {
            logger.error("Failed to fetch custom commands", {
                userId,
                error: error.message,
            })
            // Return defaults if table is empty or error
            return NextResponse.json({
                success: true,
                commands: DEFAULT_COMMANDS,
                data: DEFAULT_COMMANDS,
            })
        }

        // Map DB records to interface format
        const customCommands: CustomChatCommand[] = (dbCommands || []).map(row => ({
            id: row.id,
            trigger: row.trigger,
            type: row.type || "response",
            responseTemplate: row.response_template,
            description: row.description,
            platforms: row.platforms || ["twitch", "kick", "youtube"],
            allowedRoles: row.allowed_roles || ["viewer"],
            cooldownSeconds: row.cooldown_seconds || 10,
            enabled: row.enabled ?? true,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }))

        // Merge defaults with custom commands (custom commands take precedence if trigger matches)
        const customTriggers = new Set(customCommands.map(c => c.trigger.toLowerCase()))
        const mergedCommands = [
            ...customCommands,
            ...DEFAULT_COMMANDS.filter(d => !customTriggers.has(d.trigger.toLowerCase()))
        ]

        return NextResponse.json({
            success: true,
            commands: mergedCommands,
            data: mergedCommands,
        })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Error in GET /api/chat-commands", err)
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

        const userId = session.user.id
        const body = await request.json()

        // Handle execute action for testing / bot execution
        if (body.action === "execute" && body.messageText) {
            const raw = String(body.messageText).trim().split(/\s+/)[0].toLowerCase();
            const supabaseExec = getAdminClient();
            let customForExec: Record<string, unknown>[] = [];
            try {
                const { data } = await supabaseExec.from("custom_commands").select("*").eq("user_id", userId);
                customForExec = (data || []) as Record<string, unknown>[];
            } catch {}
            const customMapped = customForExec.map((row: Record<string, unknown>) => ({
                trigger: String(row.trigger || ""),
                responseTemplate: String(row.response_template || row.responseTemplate || ""),
                enabled: row.enabled ?? true,
            }));
            const all = [...customMapped, ...DEFAULT_COMMANDS];
            const found = all.find((cmd: Record<string, unknown> | CustomChatCommand) => {
                const trg = typeof cmd.trigger === "string" ? cmd.trigger : ""
                return trg.toLowerCase() === raw
            });
            if (found) {
                const f = found as Record<string, unknown>
                let response = String(f.responseTemplate || f.response_template || "");
                // simple interpolation
                response = response.replace(/{user}/gi, body.username || "user").replace(/{platform}/gi, body.platform || "");
                // if no template, fallback for discord
                if (!response && raw === "!discord") response = "Join our Discord: https://discord.gg/gabrieltoth";
                return NextResponse.json({ success: true, data: { matched: true, response, trigger: String(f.trigger || "") }, matched: true, response });
            }
            return NextResponse.json({ success: true, data: { matched: false }, matched: false });
        }

        const {
            id,
            trigger,
            type = "response",
            responseTemplate,
            description,
            platforms = ["twitch", "kick", "youtube"],
            allowedRoles = ["viewer"],
            cooldownSeconds = 10,
            enabled = true,
        } = body

        if (!trigger || !trigger.trim().startsWith("!")) {
            return NextResponse.json(
                { success: false, error: "INVALID_TRIGGER" },
                { status: 400 }
            )
        }

        const supabase = getAdminClient()
        const cleanTrigger = trigger.trim().toLowerCase()

        if (id && !id.startsWith("default:")) {
            // Update existing custom command
            const { data, error } = await supabase
                .from("custom_commands")
                .update({
                    trigger: cleanTrigger,
                    type,
                    response_template: responseTemplate,
                    description,
                    platforms,
                    allowed_roles: allowedRoles,
                    cooldown_seconds: cooldownSeconds,
                    enabled,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", id)
                .eq("user_id", userId)
                .select()
                .single()

            if (error) {
                logger.error("Failed to update custom command", { error: error.message })
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 400 }
                )
            }

            return NextResponse.json({ success: true, command: data, data })
        } else {
            // Insert new custom command
            const { data, error } = await supabase
                .from("custom_commands")
                .insert({
                    user_id: userId,
                    trigger: cleanTrigger,
                    type,
                    response_template: responseTemplate,
                    description,
                    platforms,
                    allowed_roles: allowedRoles,
                    cooldown_seconds: cooldownSeconds,
                    enabled,
                })
                .select()
                .single()

            if (error) {
                logger.error("Failed to create custom command", { error: error.message })
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 400 }
                )
            }

            return NextResponse.json({ success: true, command: data, data })
        }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Error in POST /api/chat-commands", err)
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

        const userId = session.user.id
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id || id.startsWith("default:")) {
            return NextResponse.json(
                { success: false, error: "CANNOT_DELETE_DEFAULT" },
                { status: 400 }
            )
        }

        const supabase = getAdminClient()
        const { error } = await supabase
            .from("custom_commands")
            .delete()
            .eq("id", id)
            .eq("user_id", userId)

        if (error) {
            logger.error("Failed to delete custom command", { error: error.message })
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Error in DELETE /api/chat-commands", err)
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        )
    }
}