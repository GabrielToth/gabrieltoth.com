/**
 * Password Security Module Index
 * Exports all password security components
 */

export {
    ARGON2_CONSTRAINTS,
    ConfigurationManager,
    RATE_LIMITING_DEFAULTS,
    getSecurityConfig,
} from "./config"

export {
    generateSalt,
    generateSaltHex,
    getSaltConfig,
    validateSalt,
    verifySaltEntropy,
} from "./salt-generator"

export {
    ARGON2_CONFIG,
    getArgon2Config,
    hashPasswordArgon2id,
    isArgon2idHash,
    verifyPasswordArgon2id,
} from "./argon2id-hasher"

export {
    detectHashAlgorithm,
    getAlgorithmDescription,
    isArgon2idHashFormat,
    isBcryptHashFormat,
} from "./hash-algorithm-detection"

export {
    describeBcryptHash,
    extractBcryptInfo,
    isBcryptHashValid,
    validatePasswordBcrypt,
} from "./bcrypt-validator"

export { RateLimiter, getRateLimiter } from "./rate-limiter"

export type {
    Argon2Params,
    ConfigurationLoadResult,
    HashResult,
    RateLimitingConfig,
    SecurityConfig,
    ValidationError,
} from "./types"

export type { HashAlgorithmDetectionResult } from "./hash-algorithm-detection"

export type { BcryptValidationResult } from "./bcrypt-validator"

export type { RateLimitCheckResult } from "./rate-limiter"
