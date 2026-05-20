/**
 * Hash format validation — Argon2id only.
 */

import { logger } from "@/lib/logger"
import {
    detectHashAlgorithm,
    isArgon2idHashFormat,
} from "./hash-algorithm-detection"

export interface HashFormatValidationResult {
    isValid: boolean
    algorithm: "argon2id" | "unknown"
    userMessage: string
    isMalformed: boolean
}

export function validateHashFormat(
    hash: unknown,
    email?: string
): HashFormatValidationResult {
    const detection = detectHashAlgorithm(hash)
    const isValid = isArgon2idHashFormat(hash)
    const isMalformed = detection.algorithm !== "unknown" && !detection.isValid

    if (!isValid) {
        logMalformedHashAttempt(hash, detection, email)
    }

    return {
        isValid,
        algorithm: detection.algorithm,
        userMessage: "Authentication failed",
        isMalformed,
    }
}

function logMalformedHashAttempt(
    hash: unknown,
    detection: ReturnType<typeof detectHashAlgorithm>,
    email?: string
): void {
    try {
        const hashPrefix =
            typeof hash === "string"
                ? hash.substring(0, 10) + (hash.length > 10 ? "..." : "")
                : "[non-string]"

        logger.warn("Malformed password hash detected", {
            context: "HashFormatValidator",
            data: {
                algorithm: detection.algorithm,
                reason: detection.reason,
                hashPrefix,
                isMalformed:
                    detection.algorithm !== "unknown" && !detection.isValid,
                ...(email && { email }),
            },
        })
    } catch (error) {
        logger.error("Failed to log malformed hash attempt", {
            context: "HashFormatValidator",
            error: error as Error,
        })
    }
}

export function isValidHashFormat(hash: unknown): boolean {
    return isArgon2idHashFormat(hash)
}

export function getGenericHashValidationError(): string {
    return "Authentication failed"
}
