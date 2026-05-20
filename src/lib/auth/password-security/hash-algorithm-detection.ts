/**
 * Hash algorithm detection — Argon2id only.
 */

export interface HashAlgorithmDetectionResult {
    algorithm: "argon2id" | "unknown"
    version?: number
    isValid: boolean
    reason: string
}

export function detectHashAlgorithm(
    hash: unknown
): HashAlgorithmDetectionResult {
    if (hash === null || hash === undefined) {
        return {
            algorithm: "unknown",
            isValid: false,
            reason: "Hash is null or undefined",
        }
    }

    if (typeof hash !== "string") {
        return {
            algorithm: "unknown",
            isValid: false,
            reason: `Hash must be a string, got: ${typeof hash}`,
        }
    }

    if (hash.length === 0) {
        return {
            algorithm: "unknown",
            isValid: false,
            reason: "Hash is an empty string",
        }
    }

    const lowerHash = hash.toLowerCase()

    if (lowerHash.startsWith("$argon2id$v=19$")) {
        const parts = hash.split("$")

        if (parts.length >= 6) {
            const paramsValid =
                parts[3] &&
                parts[3].includes("m=") &&
                parts[3].includes("t=") &&
                parts[3].includes("p=")
            const saltHashValid = parts[4] && parts[5]

            if (paramsValid && saltHashValid) {
                return {
                    algorithm: "argon2id",
                    version: 19,
                    isValid: true,
                    reason: "Valid Argon2id hash format detected",
                }
            }

            return {
                algorithm: "argon2id",
                version: 19,
                isValid: false,
                reason: "Argon2id format detected but hash structure is malformed",
            }
        }

        return {
            algorithm: "argon2id",
            version: 19,
            isValid: false,
            reason: "Argon2id format detected but hash is incomplete",
        }
    }

    if (/\s/.test(hash)) {
        return {
            algorithm: "unknown",
            isValid: false,
            reason: "Hash contains whitespace or control characters",
        }
    }

    return {
        algorithm: "unknown",
        isValid: false,
        reason: "Hash does not match Argon2id format (expected $argon2id$v=19$...)",
    }
}

export function isArgon2idHashFormat(hash: unknown): boolean {
    const result = detectHashAlgorithm(hash)
    return result.algorithm === "argon2id" && result.isValid
}

export function getAlgorithmDescription(hash: unknown): string {
    const result = detectHashAlgorithm(hash)

    switch (result.algorithm) {
        case "argon2id":
            return `Argon2id (version ${result.version})`
        case "unknown":
        default:
            return "Unknown algorithm"
    }
}
