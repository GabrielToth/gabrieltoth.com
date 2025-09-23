import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

export interface RateLimitResult {
    success: boolean
    limit: number
    remaining: number
    reset: number
}

let ratelimit: Ratelimit | null = null

function getRatelimiter(): Ratelimit | null {
    try {
        if (ratelimit) return ratelimit
        const url = process.env.UPSTASH_REDIS_REST_URL
        const token = process.env.UPSTASH_REDIS_REST_TOKEN
        if (!url || !token) return null

        const redis = new Redis({ url, token })
        ratelimit = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(5, "15 m"),
            analytics: true,
            prefix: "rate-limit",
        })
        return ratelimit
    } catch {
        return null
    }
}

export async function rateLimitByKey(key: string): Promise<RateLimitResult> {
    const rl = getRatelimiter()
    if (!rl) {
        // No rate limiter configured; allow by default
        return {
            success: true,
            limit: 9999,
            remaining: 9998,
            reset: Date.now() + 1000,
        }
    }
    const res = await rl.limit(key)
    return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
    }
}

export function buildClientKey(params: {
    ip: string
    path: string
    userAgent?: string | null
    sessionId?: string | null
}): string {
    const ua = params.userAgent || "unknown"
    const sid = params.sessionId || "anon"
    return `${params.ip}:${params.path}:${ua}:${sid}`
}
