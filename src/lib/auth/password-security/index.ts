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

export type {
    Argon2Params,
    ConfigurationLoadResult,
    HashResult,
    RateLimitingConfig,
    SecurityConfig,
    ValidationError,
} from "./types"
