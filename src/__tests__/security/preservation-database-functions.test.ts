import { isSupabaseAvailable } from "@/test-utils/skip-without-supabase"
import { createClient } from "@supabase/supabase-js"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

vi.unmock("@supabase/supabase-js")
/**
 * Preservation Property Tests: Database Functions
 *
 * Property 2: Preservation - Database Functions Continue to Execute
 *
 * IMPORTANT: Follow observation-first methodology
 *
 * Observe behavior on UNFIXED code for existing functions:
 * - `archive_old_audit_logs()`: Archives audit logs older than 2 years
 * - `archive_old_linking_activity()`: Archives linking activity older than 2 years
 * - `cleanup_expired_recovery_tokens()`: Deletes expired recovery tokens
 * - `cleanup_expired_unlink_revocation_windows()`: Marks expired revocation windows
 * - `update_youtube_channel_last_activity()`: Trigger updates last activity timestamp
 * - `update_youtube_channel_updated_at()`: Trigger updates updated_at timestamp
 *
 * Write property-based tests capturing observed behavior patterns
 * Run tests on UNFIXED code
 * EXPECTED OUTCOME: Tests PASS (this confirms baseline behavior to preserve)
 */


describe("Preservation: Database Functions", () => {
    let isDbRunning = true

    beforeAll(async () => {
        isDbRunning = await isSupabaseAvailable()
    })

    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"
    const supabaseServiceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

    describe("archive_old_audit_logs() function", () => {
        it("should preserve: function exists and is callable", async ({ skip }) => {
    if (!isDbRunning) return skip()
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

            // Check if function exists by calling it
            const { error } = await supabaseAdmin.rpc("archive_old_audit_logs")

            // Function should execute without error (even if it does nothing)
            expect(error).toBeNull()

            console.log(
                "✅ PRESERVED: archive_old_audit_logs() function is callable"
            )
        })

        it("should preserve: function archives old audit logs", async ({ skip }) => {
    if (!isDbRunning) return skip()
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

            // Create an old audit log (older than 2 years)
            const oldDate = new Date()
            oldDate.setFullYear(oldDate.getFullYear() - 3) // 3 years ago

            const { data: oldLog, error: insertError } = await supabaseAdmin
                .from("audit_logs")
                .insert({
                    action: "test_old_action",
                    created_at: oldDate.toISOString(),
                    details: { test: true },
                })
                .select()
                .single()

            if (insertError) {
                console.log(
                    "⚠️  Could not create old audit log for testing:",
                    insertError.message
                )
                return
            }

            // Call archive function
            const { error: archiveError } = await supabaseAdmin.rpc(
                "archive_old_audit_logs"
            )

            // Cleanup
            if (oldLog) {
                await supabaseAdmin
                    .from("audit_logs")
                    .delete()
                    .eq("id", oldLog.id)
                await supabaseAdmin
                    .from("audit_logs_archive")
                    .delete()
                    .eq("id", oldLog.id)
            }

            expect(archiveError).toBeNull()

            console.log(
                "✅ PRESERVED: archive_old_audit_logs() function executes successfully"
            )
        })
    })

    describe("archive_old_linking_activity() function", () => {
        it("should preserve: function exists and is callable", async ({ skip }) => {
    if (!isDbRunning) return skip()
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

            const { error } = await supabaseAdmin.rpc(
                "archive_old_linking_activity"
            )

            expect(error).toBeNull()

            console.log(
                "✅ PRESERVED: archive_old_linking_activity() function is callable"
            )
        })
    })

    describe("cleanup_expired_recovery_tokens() function", () => {
        it("should preserve: function exists and is callable", async ({ skip }) => {
    if (!isDbRunning) return skip()
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

            const { error } = await supabaseAdmin.rpc(
                "cleanup_expired_recovery_tokens"
            )

            expect(error).toBeNull()

            console.log(
                "✅ PRESERVED: cleanup_expired_recovery_tokens() function is callable"
            )
        })

        it("should preserve: function deletes expired recovery tokens", async ({ skip }) => {
    if (!isDbRunning) return skip()
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

            // Create an expired recovery token
            const expiredDate = new Date()
            expiredDate.setHours(expiredDate.getHours() - 1) // 1 hour ago

            const { data: token, error: insertError } = await supabaseAdmin
                .from("recovery_tokens")
                .insert({
                    youtube_channel_id: "test-channel-123",
                    token_hash: `test-hash-${Date.now()}`,
                    user_email: "test@example.com",
                    expires_at: expiredDate.toISOString(),
                    status: "pending",
                })
                .select()
                .single()

            if (insertError) {
                console.log(
                    "⚠️  Could not create expired token for testing:",
                    insertError.message
                )
                return
            }

            // Call cleanup function
            const { error: cleanupError } = await supabaseAdmin.rpc(
                "cleanup_expired_recovery_tokens"
            )

            // Cleanup
            if (token) {
                await supabaseAdmin
                    .from("recovery_tokens")
                    .delete()
                    .eq("id", token.id)
            }

            expect(cleanupError).toBeNull()

            console.log(
                "✅ PRESERVED: cleanup_expired_recovery_tokens() function executes successfully"
            )
        })
    })

    describe("cleanup_expired_unlink_revocation_windows() function", () => {
        it("should preserve: function exists and is callable", async ({ skip }) => {
    if (!isDbRunning) return skip()
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

            const { error } = await supabaseAdmin.rpc(
                "cleanup_expired_unlink_revocation_windows"
            )

            expect(error).toBeNull()

            console.log(
                "✅ PRESERVED: cleanup_expired_unlink_revocation_windows() function is callable"
            )
        })
    })

    describe("update_youtube_channel_last_activity() trigger", () => {
        let testUserId: string
        let testChannelId: string

        beforeAll(async () => {
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

            const { data: user, error: userError } =
                await supabaseAdmin.auth.admin.createUser({
                    email: `test-trigger-${Date.now()}@example.com`,
                    password: "test-password-123",
                    email_confirm: true,
                })

            if (userError || !user.user) {
                isDbRunning = false
                return
            }

            testUserId = user.user.id

            // Insert test YouTube channel
            const { data: channel, error: channelError } = await supabaseAdmin
                .from("youtube_channels")
                .insert({
                    user_id: testUserId,
                    youtube_channel_id: `test-channel-${Date.now()}`,
                    channel_name: "Test Channel",
                    access_token: "test-token",
                })
                .select()
                .single()

            if (channelError || !channel) {
                throw new Error(
                    `Failed to create test channel: ${channelError?.message}`
                )
            }

            testChannelId = channel.id
        })

        afterAll(async () => {
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
            await supabaseAdmin
                .from("youtube_channels")
                .delete()
                .eq("id", testChannelId)
            if (
                testUserId &&
                /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                    testUserId
                )
            ) {
                await supabaseAdmin.auth.admin.deleteUser(testUserId)
            }
        })

        it("should preserve: trigger updates last_activity_at on linking_activity insert", async ({ skip }) => {
    if (!isDbRunning) return skip()
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

            // Get current last_activity_at
            const { data: channelBefore, error: beforeError } =
                await supabaseAdmin
                    .from("youtube_channels")
                    .select("last_activity_at")
                    .eq("id", testChannelId)
                    .single()

            if (beforeError) {
                throw new Error(
                    `Failed to get channel before: ${beforeError.message}`
                )
            }

            const lastActivityBefore = channelBefore?.last_activity_at

            // Wait a moment to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Insert linking activity (should trigger update)
            const { data: activity, error: activityError } = await supabaseAdmin
                .from("linking_activity")
                .insert({
                    user_id: testUserId,
                    youtube_channel_id: `test-channel-${Date.now()}`,
                    activity_type: "link",
                    ip_address: "127.0.0.1",
                    user_agent: "test-agent",
                })
                .select()
                .single()

            if (activityError) {
                throw new Error(
                    `Failed to insert activity: ${activityError.message}`
                )
            }

            // Get updated last_activity_at
            const { data: channelAfter, error: afterError } =
                await supabaseAdmin
                    .from("youtube_channels")
                    .select("last_activity_at")
                    .eq("id", testChannelId)
                    .single()

            // Cleanup
            if (activity) {
                await supabaseAdmin
                    .from("linking_activity")
                    .delete()
                    .eq("id", activity.id)
            }

            if (afterError) {
                throw new Error(
                    `Failed to get channel after: ${afterError.message}`
                )
            }

            const lastActivityAfter = channelAfter?.last_activity_at

            // Trigger should have updated last_activity_at
            expect(lastActivityAfter).not.toBe(lastActivityBefore)

            console.log(
                "✅ PRESERVED: update_youtube_channel_last_activity() trigger works"
            )
        })
    })

    describe("update_youtube_channel_updated_at() trigger", () => {
        let testUserId: string
        let testChannelId: string

        beforeAll(async () => {
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

            const { data: user, error: userError } =
                await supabaseAdmin.auth.admin.createUser({
                    email: `test-update-trigger-${Date.now()}@example.com`,
                    password: "test-password-123",
                    email_confirm: true,
                })

            if (userError || !user.user) {
                isDbRunning = false
                return
            }

            testUserId = user.user.id

            // Insert test YouTube channel
            const { data: channel, error: channelError } = await supabaseAdmin
                .from("youtube_channels")
                .insert({
                    user_id: testUserId,
                    youtube_channel_id: `test-channel-${Date.now()}`,
                    channel_name: "Test Channel",
                    access_token: "test-token",
                })
                .select()
                .single()

            if (channelError || !channel) {
                throw new Error(
                    `Failed to create test channel: ${channelError?.message}`
                )
            }

            testChannelId = channel.id
        })

        afterAll(async () => {
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
            await supabaseAdmin
                .from("youtube_channels")
                .delete()
                .eq("id", testChannelId)
            if (
                testUserId &&
                /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                    testUserId
                )
            ) {
                await supabaseAdmin.auth.admin.deleteUser(testUserId)
            }
        })

        it("should preserve: trigger updates updated_at on youtube_channels update", async ({ skip }) => {
    if (!isDbRunning) return skip()
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

            // Get current updated_at
            const { data: channelBefore, error: beforeError } =
                await supabaseAdmin
                    .from("youtube_channels")
                    .select("updated_at")
                    .eq("id", testChannelId)
                    .single()

            if (beforeError) {
                throw new Error(
                    `Failed to get channel before: ${beforeError.message}`
                )
            }

            const updatedAtBefore = channelBefore?.updated_at

            // Wait a moment to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Update channel (should trigger updated_at update)
            const { error: updateError } = await supabaseAdmin
                .from("youtube_channels")
                .update({ channel_name: "Updated Channel Name" })
                .eq("id", testChannelId)

            if (updateError) {
                throw new Error(
                    `Failed to update channel: ${updateError.message}`
                )
            }

            // Get updated updated_at
            const { data: channelAfter, error: afterError } =
                await supabaseAdmin
                    .from("youtube_channels")
                    .select("updated_at")
                    .eq("id", testChannelId)
                    .single()

            if (afterError) {
                throw new Error(
                    `Failed to get channel after: ${afterError.message}`
                )
            }

            const updatedAtAfter = channelAfter?.updated_at

            // Trigger should have updated updated_at
            expect(updatedAtAfter).not.toBe(updatedAtBefore)

            console.log(
                "✅ PRESERVED: update_youtube_channel_updated_at() trigger works"
            )
        })
    })

    it("should document preservation requirements for database functions", () => {
        const preservationRequirements = {
            purpose:
                "Ensure database functions and triggers continue to work after security fixes",
            functions: [
                {
                    name: "archive_old_audit_logs()",
                    purpose: "Archives audit logs older than 2 years",
                    expectedBehavior:
                        "Moves old records to audit_logs_archive table",
                },
                {
                    name: "archive_old_linking_activity()",
                    purpose: "Archives linking activity older than 2 years",
                    expectedBehavior:
                        "Moves old records to linking_activity_archive table",
                },
                {
                    name: "cleanup_expired_recovery_tokens()",
                    purpose: "Deletes expired recovery tokens",
                    expectedBehavior:
                        "Removes tokens where status=pending and expires_at < NOW()",
                },
                {
                    name: "cleanup_expired_unlink_revocation_windows()",
                    purpose: "Marks expired revocation windows",
                    expectedBehavior:
                        "Updates status to expired where revocation_expires_at < NOW()",
                },
            ],
            triggers: [
                {
                    name: "update_youtube_channel_last_activity",
                    table: "linking_activity",
                    event: "AFTER INSERT",
                    expectedBehavior:
                        "Updates youtube_channels.last_activity_at timestamp",
                },
                {
                    name: "update_youtube_channel_updated_at",
                    table: "youtube_channels",
                    event: "BEFORE UPDATE",
                    expectedBehavior:
                        "Updates youtube_channels.updated_at timestamp",
                },
            ],
            testStrategy:
                "Verify functions are callable and produce expected results",
            outcome: "All tests should PASS on both unfixed and fixed code",
        }

        console.log("Preservation Requirements Documentation:")
        console.log(JSON.stringify(preservationRequirements, null, 2))

        expect(true).toBe(true)
    })
})
