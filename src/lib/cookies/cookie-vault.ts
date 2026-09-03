/**
 * Cloud Cookie Vault
 * AES-256 encrypted session & cookie storage for alternative social-media connections
 * (Twitter/X, Facebook, Instagram, Kwai via 1proxy/omniroute mesh).
 *
 * ⚠️ Credit Cost Notice:
 * - Free  (First 90 minutes of active sync lifetime)
 * - 5 credits / hour afterwards (passed directly to user as cost-relay)
 */

import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
    scryptSync,
} from "crypto"

export interface StoredSessionCookie {
    name: string
    value: string
    domain: string
    path?: string
    secure?: boolean
    httpOnly?: boolean
    expiresAt?: number
}

export interface StoredSession {
    id: string
    userId: string
    platform: "twitter" | "facebook" | "instagram" | "kwai" | "other"
    encryptedCookies: string // Base64 of AES-256 payload
    createdAt: number
    lastSyncAt: number
    expiresAt?: number
    costInCredits?: number
    lastSyncCost?: number
}

const ENCRYPTION_ALGORITHM = "aes-256-cbc"
const ENCRYPTION_KEY =
    process.env.COOKIE_ENCRYPTION_KEY ||
    "default-fallback-key-do-not-use-in-prod"

export class CookieVault {
    private encryptionKey: Buffer

    constructor() {
        this.encryptionKey = scryptSync(ENCRYPTION_KEY, "salt", 32)
    }

    /**
     * Encrypt a set of session cookies using AES-256
     */
    public encryptCookies(cookies: StoredSessionCookie[]): {
        encrypted: string
        iv: string
    } {
        const json = JSON.stringify(cookies)
        const iv = randomBytes(16)
        const cipher = createCipheriv(
            ENCRYPTION_ALGORITHM,
            this.encryptionKey,
            iv
        )
        const encrypted = Buffer.concat([
            cipher.update(json, "utf8"),
            cipher.final(),
        ])
        return {
            encrypted: encrypted.toString("base64"),
            iv: iv.toString("base64"),
        }
    }

    /**
     * Decrypt session cookies
     */
    public decryptCookies(
        encrypted: string,
        ivBase64: string
    ): StoredSessionCookie[] {
        const decipher = createDecipheriv(
            ENCRYPTION_ALGORITHM,
            this.encryptionKey,
            Buffer.from(ivBase64, "base64")
        )
        let decrypted = decipher.update(encrypted, "base64", "utf8")
        decrypted += decipher.final("utf8")
        return JSON.parse(decrypted)
    }

    /**
     * Calculate storage cost in credits per interval
     */
    public static getSyncCostCredits(durationMinutes: number): number {
        // First 90 min = free; afterwards ~5 credits / hr
        const freeThresholdMinutes = 90
        if (durationMinutes <= freeThresholdMinutes) return 0
        const remainingMinutes = durationMinutes - freeThresholdMinutes
        return Math.max(1, Math.ceil(((remainingMinutes / 60) * 5) / 0.1) * 0.1)
    }
}
