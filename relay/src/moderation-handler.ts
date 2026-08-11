import { WebSocket } from "ws"

const PLATFORM_MAX_TIMEOUTS: Record<string, number> = {
    twitch: 1209600,    // 14 days in seconds (Twitch max)
    kick: 86400,        // 24 hours in seconds (Kick max)
    youtube: 86400,     // 24 hours (YouTube chat timeout max via API)
}

const TIMEOUT_REAPPLY_BEFORE = 60 // seconds before expiry to re-apply
const RECHECK_INTERVAL = 30_000   // check every 30s

interface ScheduledTimeout {
    targetUserId: string
    targetUsername: string
    platform: string
    duration: number        // original requested duration in seconds
    appliedDuration: number // actual applied duration (platform max or requested)
    appliedAt: number       // timestamp when last applied
    expiresAt: number       // when the current timeout expires
    repeatCount: number
    reapplyTimer: ReturnType<typeof setInterval> | null
}

const activeTimeouts = new Map<string, ScheduledTimeout>()

function timeoutKey(platform: string, targetUserId: string): string {
    return `${platform}:${targetUserId}`
}

function getEffectiveDuration(duration: number, platform: string): number {
    const max = PLATFORM_MAX_TIMEOUTS[platform] || 86400
    return Math.min(duration, max)
}

export async function executeModeration(
    ws: WebSocket,
    userId: string,
    action: string,
    targetUserId: string,
    targetUsername: string,
    platform: string,
    duration?: number,
    reason?: string,
    twitchRelay?: any,
    kickRelay?: any
): Promise<void> {
    const key = timeoutKey(platform, targetUserId)

    if (action === "timeout") {
        const requestedDuration = duration || 600
        const effective = getEffectiveDuration(requestedDuration, platform)

        if (platform === "twitch" && twitchRelay) {
            await executeTwitchTimeout(twitchRelay, targetUsername, effective, reason)
        } else if (platform === "kick" && kickRelay) {
            await executeKickTimeout(kickRelay, targetUsername, effective, reason)
        } else {
            sendError(ws, platform, `No relay available for ${platform}`)
            return
        }

        // If requested > platform max, schedule re-apply
        if (requestedDuration > effective) {
            const existing = activeTimeouts.get(key)
            if (existing?.reapplyTimer) {
                clearInterval(existing.reapplyTimer)
            }

            const st: ScheduledTimeout = {
                targetUserId,
                targetUsername,
                platform,
                duration: requestedDuration,
                appliedDuration: effective,
                appliedAt: Date.now(),
                expiresAt: Date.now() + effective * 1000,
                repeatCount: 1,
                reapplyTimer: null,
            }

            st.reapplyTimer = setInterval(() => {
                const remaining = st.expiresAt - Date.now()
                if (remaining <= TIMEOUT_REAPPLY_BEFORE * 1000) {
                    const nextEffective = getEffectiveDuration(
                        st.duration - st.repeatCount * st.appliedDuration,
                        platform
                    )
                    if (nextEffective <= 0) {
                        clearInterval(st.reapplyTimer!)
                        activeTimeouts.delete(key)
                        return
                    }

                    if (platform === "twitch" && twitchRelay) {
                        executeTwitchTimeout(twitchRelay, targetUsername, nextEffective, reason)
                            .then(() => {
                                st.appliedAt = Date.now()
                                st.expiresAt = Date.now() + nextEffective * 1000
                                st.repeatCount++
                            })
                            .catch(() => {})
                    } else if (platform === "kick" && kickRelay) {
                        executeKickTimeout(kickRelay, targetUsername, nextEffective, reason)
                            .then(() => {
                                st.appliedAt = Date.now()
                                st.expiresAt = Date.now() + nextEffective * 1000
                                st.repeatCount++
                            })
                            .catch(() => {})
                    }
                }
            }, RECHECK_INTERVAL)

            activeTimeouts.set(key, st)
        }

        sendResult(ws, "timeout", true, { platform, targetUsername, duration: effective, willReapply: requestedDuration > effective })
        return
    }

    if (action === "ban") {
        if (platform === "twitch" && twitchRelay) {
            await executeTwitchBan(twitchRelay, targetUsername, reason)
        } else if (platform === "kick" && kickRelay) {
            await executeKickBan(kickRelay, targetUsername, reason)
        } else {
            sendError(ws, platform, `No relay available for ${platform}`)
            return
        }

        // Cancel any active timeout re-apply for this user
        const existing = activeTimeouts.get(key)
        if (existing?.reapplyTimer) {
            clearInterval(existing.reapplyTimer)
            activeTimeouts.delete(key)
        }

        sendResult(ws, "ban", true, { platform, targetUsername })
        return
    }

    if (action === "unban") {
        if (platform === "twitch" && twitchRelay) {
            await executeTwitchUnban(twitchRelay, targetUsername)
        } else if (platform === "kick" && kickRelay) {
            await executeKickUnban(kickRelay, targetUsername)
        } else {
            sendError(ws, platform, `No relay available for ${platform}`)
            return
        }

        const existing = activeTimeouts.get(key)
        if (existing?.reapplyTimer) {
            clearInterval(existing.reapplyTimer)
            activeTimeouts.delete(key)
        }

        sendResult(ws, "unban", true, { platform, targetUsername })
        return
    }

    sendError(ws, platform, `Unknown moderation action: ${action}`)
}

// --- Twitch moderation via IRC ---

async function executeTwitchTimeout(
    twitchRelay: any,
    username: string,
    duration: number,
    reason?: string
): Promise<void> {
    const msg = reason
        ? `/timeout ${username} ${duration} ${reason}`
        : `/timeout ${username} ${duration}`
    return twitchRelay.sendChat(msg)
}

async function executeTwitchBan(
    twitchRelay: any,
    username: string,
    reason?: string
): Promise<void> {
    const msg = reason ? `/ban ${username} ${reason}` : `/ban ${username}`
    return twitchRelay.sendChat(msg)
}

async function executeTwitchUnban(
    twitchRelay: any,
    username: string
): Promise<void> {
    return twitchRelay.sendChat(`/unban ${username}`)
}

// --- Kick moderation via API ---

async function executeKickTimeout(
    kickRelay: any,
    username: string,
    duration: number,
    reason?: string
): Promise<void> {
    return kickRelay.sendChat(`/timeout ${username} ${duration}${reason ? ` ${reason}` : ""}`)
}

async function executeKickBan(
    kickRelay: any,
    username: string,
    reason?: string
): Promise<void> {
    return kickRelay.sendChat(`/ban ${username}${reason ? ` ${reason}` : ""}`)
}

async function executeKickUnban(
    kickRelay: any,
    username: string
): Promise<void> {
    return kickRelay.sendChat(`/unban ${username}`)
}

// --- Helpers ---

function sendResult(
    ws: WebSocket,
    action: string,
    success: boolean,
    data?: Record<string, unknown>
): void {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(
            JSON.stringify({
                type: "moderation_result",
                action,
                success,
                data,
            })
        )
    }
}

function sendError(
    ws: WebSocket,
    platform: string,
    error: string
): void {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(
            JSON.stringify({
                type: "error",
                platform,
                error,
            })
        )
    }
}

export function cleanupTimeoutsForUser(targetUserId: string, platform: string): void {
    const key = timeoutKey(platform, targetUserId)
    const existing = activeTimeouts.get(key)
    if (existing?.reapplyTimer) {
        clearInterval(existing.reapplyTimer)
    }
    activeTimeouts.delete(key)
}

export function cleanupAllTimeouts(): void {
    for (const [, st] of activeTimeouts) {
        if (st.reapplyTimer) {
            clearInterval(st.reapplyTimer)
        }
    }
    activeTimeouts.clear()
}
