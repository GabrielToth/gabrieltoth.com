import crypto from "crypto"
import {
    EncryptedSessionVaultRecord,
    ExternalAccountSession,
    SessionCookie,
} from "./types"

const ENCRYPTION_ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

/**
 * Gets the master encryption key from environment or fallback key derivation
 */
function getEncryptionKey(): Buffer {
    const secret =
        process.env.SESSION_VAULT_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        process.env.ENCRYPTION_SECRET ||
        "fallback-dev-session-vault-secret-key-32b"

    return crypto.createHash("sha256").update(secret).digest()
}

/**
 * Encrypts sensitive session payload (cookies + authTokens)
 */
export function encryptSessionPayload(payload: {
    cookies: SessionCookie[]
    authTokens?: Record<string, string>
}): string {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    })

    const jsonPayload = JSON.stringify(payload)
    const encrypted = Buffer.concat([
        cipher.update(jsonPayload, "utf8"),
        cipher.final(),
    ])
    const authTag = cipher.getAuthTag()

    // Format: base64(iv + authTag + encryptedData)
    const combined = Buffer.concat([iv, authTag, encrypted])
    return combined.toString("base64")
}

/**
 * Decrypts encrypted session payload
 */
export function decryptSessionPayload(encryptedBase64: string): {
    cookies: SessionCookie[]
    authTokens?: Record<string, string>
} {
    const key = getEncryptionKey()
    const combined = Buffer.from(encryptedBase64, "base64")

    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
        throw new Error("Invalid encrypted session payload length")
    }

    const iv = combined.subarray(0, IV_LENGTH)
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const encryptedData = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    })
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
    ])

    return JSON.parse(decrypted.toString("utf8"))
}

/**
 * Converts a full session into an encrypted record for persistent storage
 */
export function toEncryptedRecord(
    session: ExternalAccountSession
): EncryptedSessionVaultRecord {
    const encryptedPayload = encryptSessionPayload({
        cookies: session.cookies,
        authTokens: session.authTokens,
    })

    return {
        id: session.id,
        managerUserId: session.managerUserId,
        managedClientName: session.managedClientName,
        platform: session.platform,
        platformUsername: session.platformUsername,
        status: session.status,
        encryptedPayload,
        userAgent: session.userAgent,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
    }
}

/**
 * Decrypts an encrypted vault record back into a full session object
 */
export function fromEncryptedRecord(
    record: EncryptedSessionVaultRecord
): ExternalAccountSession {
    const { cookies, authTokens } = decryptSessionPayload(
        record.encryptedPayload
    )

    return {
        id: record.id,
        managerUserId: record.managerUserId,
        managedClientName: record.managedClientName,
        platform: record.platform,
        platformUsername: record.platformUsername,
        status: record.status,
        cookies,
        authTokens,
        userAgent: record.userAgent,
        lastUsedAt: record.lastUsedAt,
        expiresAt: record.expiresAt,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    }
}
