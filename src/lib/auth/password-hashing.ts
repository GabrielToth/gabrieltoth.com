/**
 * Password Hashing and Cryptography Functions
 * All passwords use Argon2id (see password-security/argon2id-hasher.ts)
 */

import { generateRandomHex } from "@/lib/crypto-utils"
import {
    hashPasswordArgon2id,
    verifyPasswordArgon2id,
} from "@/lib/auth/password-security/argon2id-hasher"

const TOKEN_LENGTH = 32

/**
 * Hashes a password using Argon2id
 */
export async function hashPassword(password: string): Promise<string> {
    if (!password || typeof password !== "string") {
        throw new Error("Password must be a non-empty string")
    }

    const result = await hashPasswordArgon2id(password)
    return result.hash
}

/**
 * Compares a plain text password with an Argon2id hash
 */
export async function comparePassword(
    password: string,
    hash: string
): Promise<boolean> {
    if (!password || typeof password !== "string") {
        return false
    }

    if (!hash || typeof hash !== "string") {
        return false
    }

    try {
        return await verifyPasswordArgon2id(password, hash)
    } catch {
        return false
    }
}

export function generateToken(): string {
    try {
        return generateRandomHex(TOKEN_LENGTH)
    } catch (error) {
        throw new Error(
            `Failed to generate token: ${error instanceof Error ? error.message : "Unknown error"}`
        )
    }
}

export function generateCsrfToken(): string {
    return generateToken()
}

export function generateVerificationToken(): string {
    return generateToken()
}

export function generatePasswordResetToken(): string {
    return generateToken()
}

export function validateToken(token: string): {
    isValid: boolean
    error?: string
} {
    if (!token || typeof token !== "string") {
        return { isValid: false, error: "Token is required" }
    }

    if (token.length !== 64) {
        return { isValid: false, error: "Invalid token format" }
    }

    if (!/^[a-f0-9]{64}$/i.test(token)) {
        return { isValid: false, error: "Invalid token format" }
    }

    return { isValid: true }
}

export function isTokenExpired(expiresAt: Date): boolean {
    if (!expiresAt || !(expiresAt instanceof Date)) {
        return true
    }

    return new Date() > expiresAt
}

export function getTokenExpirationDate(expirationMinutes: number = 60): Date {
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes)
    return expiresAt
}

export function generateEmailVerificationTokenWithExpiration(
    expirationMinutes: number = 1440
): { token: string; expiresAt: Date } {
    return {
        token: generateVerificationToken(),
        expiresAt: getTokenExpirationDate(expirationMinutes),
    }
}

export function generatePasswordResetTokenWithExpiration(
    expirationMinutes: number = 60
): { token: string; expiresAt: Date } {
    return {
        token: generatePasswordResetToken(),
        expiresAt: getTokenExpirationDate(expirationMinutes),
    }
}
