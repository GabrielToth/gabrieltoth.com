/**
 * Password Validator — Argon2id only
 */

import { verifyPasswordArgon2id } from "./argon2id-hasher"
import { detectHashAlgorithm } from "./hash-algorithm-detection"
import { assertPasswordInputValid } from "./password-input-validation"

export interface PasswordValidationResult {
    valid: boolean
    algorithmType: "argon2id" | "unknown"
    hashValid: boolean
    error?: string
    timeTakenMs: number
}

export async function validatePassword(
    password: unknown,
    hash: unknown
): Promise<PasswordValidationResult> {
    const startTime = Date.now()

    try {
        assertPasswordInputValid(password)
        const validatedPassword = password as string

        if (
            hash === null ||
            hash === undefined ||
            typeof hash !== "string" ||
            hash.length === 0
        ) {
            return {
                valid: false,
                algorithmType: "unknown",
                hashValid: false,
                error: "Authentication failed",
                timeTakenMs: Date.now() - startTime,
            }
        }

        const detection = detectHashAlgorithm(hash)

        if (detection.algorithm !== "argon2id" || !detection.isValid) {
            return {
                valid: false,
                algorithmType: "unknown",
                hashValid: false,
                error: "Authentication failed",
                timeTakenMs: Date.now() - startTime,
            }
        }

        const isValid = await verifyPasswordArgon2id(validatedPassword, hash)

        return {
            valid: isValid,
            algorithmType: "argon2id",
            hashValid: detection.isValid,
            error: isValid ? undefined : "Authentication failed",
            timeTakenMs: Date.now() - startTime,
        }
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("PEPPER_SECRET")) {
                throw error
            }
            if (
                error.message.includes("Invalid password") ||
                error.message.includes("Password")
            ) {
                throw error
            }
        }

        return {
            valid: false,
            algorithmType: "unknown",
            hashValid: false,
            error: "Authentication failed",
            timeTakenMs: Date.now() - startTime,
        }
    }
}

export function isPasswordValid(result: PasswordValidationResult): boolean {
    return result.valid
}

export function getValidationDescription(
    result: PasswordValidationResult
): string {
    if (!result.valid) {
        return `Password validation failed (${result.algorithmType})`
    }
    return `Password validation succeeded (${result.algorithmType})`
}
