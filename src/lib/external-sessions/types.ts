export type ExternalPlatform =
    "tiktok" | "instagram" | "facebook" | "youtube" | "kwai" | "twitch" | "x"

export type SessionStatus =
    "active" | "expired" | "invalid" | "pending_verification"

export interface SessionCookie {
    name: string
    value: string
    domain: string
    path: string
    expires?: number
    httpOnly?: boolean
    secure?: boolean
    sameSite?: "Strict" | "Lax" | "None"
}

export interface ExternalAccountSession {
    /** Unique ID of the session record */
    id: string
    /** User ID of the manager (e.g. Gabriel) */
    managerUserId: string
    /** Managed entity/client label (e.g. "Waveigl") */
    managedClientName: string
    /** Target social platform */
    platform: ExternalPlatform
    /** Username or handle on the target platform */
    platformUsername: string
    /** Current session status */
    status: SessionStatus
    /** Array of exported session cookies */
    cookies: SessionCookie[]
    /** Optional custom headers / auth tokens (e.g. Bearer token, session-id) */
    authTokens?: Record<string, string>
    /** User-agent string to match session fingerprint */
    userAgent?: string
    /** When the session was last verified/used */
    lastUsedAt?: string
    /** Expiration timestamp */
    expiresAt?: string
    /** Created at timestamp */
    createdAt: string
    /** Updated at timestamp */
    updatedAt: string
}

export interface EncryptedSessionVaultRecord {
    id: string
    managerUserId: string
    managedClientName: string
    platform: ExternalPlatform
    platformUsername: string
    status: SessionStatus
    /** Base64 encrypted JSON string of cookies & authTokens */
    encryptedPayload: string
    userAgent?: string
    lastUsedAt?: string
    expiresAt?: string
    createdAt: string
    updatedAt: string
}
