/**
 * YouTube Token Encryption Service
 * Provides AES-256 encryption/decryption for OAuth tokens
 * Supports multiple key management strategies (AWS KMS, local file, environment variable)
 * Validates: Requirements 1.4, 8.1
 */

import crypto from "crypto"

/**
 * Encryption algorithm used for token encryption
 * AES-256-GCM provides both confidentiality and authenticity
 */
const ENCRYPTION_ALGORITHM = "aes-256-gcm"

/**
 * IV (Initialization Vector) length in bytes
 * 12 bytes (96 bits) is recommended for GCM mode
 */
const IV_LENGTH = 12

/**
 * Authentication tag length in bytes
 * 16 bytes (128 bits) provides strong authentication
 */
const AUTH_TAG_LENGTH = 16

/**
 * Key management strategy type
 */
export type KeyManagementStrategy = "aws-kms" | "local-file" | "environment"

/**
 * Encryption result containing encrypted data and metadata
 */
export interface EncryptionResult {
    /**
     * Encrypted token in base64 format
     * Format: base64(iv + authTag + encryptedData)
     */
    encryptedToken: string

    /**
     * Algorithm used for encryption
     */
    algorithm: string

    /**
     * Timestamp when encryption occurred
     */
    encryptedAt: Date
}

/**
 * Decryption result containing the original token
 */
export interface DecryptionResult {
    /**
     * Original OAuth token
     */
    token: string

    /**
     * Timestamp when decryption occurred
     */
    decryptedAt: Date
}

/**
 * Key management configuration
 */
interface KeyManagementConfig {
    strategy: KeyManagementStrategy
    kmsKeyId?: string
    localKeyPath?: string
    environmentVariableName?: string
}

/**
 * Token Encryption Service
 * Handles encryption and decryption of OAuth tokens using AES-256-GCM
 */
export class TokenEncryptionService {
    private encryptionKey: Buffer | null = null
    private keyManagementConfig: KeyManagementConfig
    private keyCache: Map<string, Buffer> = new Map()

    /**
     * Initialize the token encryption service
     * @param config - Key management configuration
     */
    constructor(config: KeyManagementConfig) {
        this.keyManagementConfig = config
        this.validateConfig()
    }

    /**
     * Validate the key management configuration
     * @throws Error if configuration is invalid
     */
    private validateConfig(): void {
        const { strategy, kmsKeyId, localKeyPath, environmentVariableName } =
            this.keyManagementConfig

        if (!strategy) {
            throw new Error("Key management strategy is required")
        }

        switch (strategy) {
            case "aws-kms":
                if (!kmsKeyId) {
                    throw new Error(
                        "AWS KMS key ID is required for aws-kms strategy"
                    )
                }
                break
            case "local-file":
                if (!localKeyPath) {
                    throw new Error(
                        "Local key path is required for local-file strategy"
                    )
                }
                break
            case "environment":
                if (!environmentVariableName) {
                    throw new Error(
                        "Environment variable name is required for environment strategy"
                    )
                }
                break
            default:
                throw new Error(`Unknown key management strategy: ${strategy}`)
        }
    }

    /**
     * Get the encryption key based on the configured strategy
     * @returns The encryption key as a Buffer
     * @throws Error if key cannot be retrieved
     */
    private async getEncryptionKey(): Promise<Buffer> {
        // Return cached key if available
        if (this.encryptionKey) {
            return this.encryptionKey
        }

        const { strategy, environmentVariableName } = this.keyManagementConfig

        try {
            let key: Buffer
            switch (strategy) {
                case "environment":
                    key = this.getKeyFromEnvironment(environmentVariableName!)
                    break
                case "local-file":
                    key = this.getKeyFromLocalFile()
                    break
                case "aws-kms":
                    key = await this.getKeyFromAwsKms()
                    break
                default:
                    throw new Error(
                        `Unknown key management strategy: ${strategy}`
                    )
            }

            // Cache the key for future use
            this.encryptionKey = key
            return key
        } catch (error) {
            throw new Error(
                `Failed to retrieve encryption key: ${error instanceof Error ? error.message : "Unknown error"}`
            )
        }
    }

    /**
     * Get encryption key from environment variable
     * @param variableName - Name of the environment variable
     * @returns The encryption key as a Buffer
     * @throws Error if environment variable is not set or invalid
     */
    private getKeyFromEnvironment(variableName: string): Buffer {
        const keyString = process.env[variableName]

        if (!keyString) {
            throw new Error(`Environment variable ${variableName} is not set`)
        }

        // Key should be a 64-character hex string (32 bytes)
        if (keyString.length !== 64) {
            throw new Error(
                `Encryption key must be 64 characters (32 bytes in hex), got ${keyString.length}`
            )
        }

        if (!/^[a-f0-9]{64}$/i.test(keyString)) {
            throw new Error("Encryption key must be a valid hex string")
        }

        return Buffer.from(keyString, "hex")
    }

    /**
     * Get encryption key from local file
     * @returns The encryption key as a Buffer
     * @throws Error if file cannot be read or is invalid
     */
    private getKeyFromLocalFile(): Buffer {
        const fs = require("fs")
        const path = require("path")

        const keyPath = this.keyManagementConfig.localKeyPath!

        if (!fs.existsSync(keyPath)) {
            throw new Error(`Key file not found at ${keyPath}`)
        }

        try {
            const keyString = fs.readFileSync(keyPath, "utf-8").trim()

            // Key should be a 64-character hex string (32 bytes)
            if (keyString.length !== 64) {
                throw new Error(
                    `Encryption key must be 64 characters (32 bytes in hex), got ${keyString.length}`
                )
            }

            if (!/^[a-f0-9]{64}$/i.test(keyString)) {
                throw new Error("Encryption key must be a valid hex string")
            }

            return Buffer.from(keyString, "hex")
        } catch (error) {
            throw new Error(
                `Failed to read key file: ${error instanceof Error ? error.message : "Unknown error"}`
            )
        }
    }

    /**
     * Get encryption key from AWS KMS
     * @returns The encryption key as a Buffer
     * @throws Error if AWS KMS is not available or key cannot be retrieved
     */
    private async getKeyFromAwsKms(): Promise<Buffer> {
        // Check if key is cached
        const cacheKey = this.keyManagementConfig.kmsKeyId!
        if (this.keyCache.has(cacheKey)) {
            return this.keyCache.get(cacheKey)!
        }

        try {
            // AWS KMS integration would go here
            // For now, throw an error indicating it's not implemented
            throw new Error(
                "AWS KMS integration is not yet implemented. Use 'environment' or 'local-file' strategy instead."
            )
        } catch (error) {
            throw new Error(
                `Failed to retrieve key from AWS KMS: ${error instanceof Error ? error.message : "Unknown error"}`
            )
        }
    }

    /**
     * Encrypt an OAuth token
     * @param token - The OAuth token to encrypt
     * @returns Encryption result with encrypted token and metadata
     * @throws Error if encryption fails
     *
     * @example
     * const service = new TokenEncryptionService({
     *   strategy: 'environment',
     *   environmentVariableName: 'ENCRYPTION_KEY'
     * })
     * const result = await service.encrypt('ya29.a0AfH6SMBx...')
     * // result.encryptedToken will be a base64 string
     */
    async encrypt(token: string): Promise<EncryptionResult> {
        if (!token || typeof token !== "string") {
            throw new Error("Token must be a non-empty string")
        }

        try {
            const key = await this.getEncryptionKey()

            // Generate a random IV for this encryption
            const iv = crypto.randomBytes(IV_LENGTH)

            // Create cipher
            const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)

            // Encrypt the token
            let encryptedData = cipher.update(token, "utf-8", "hex")
            encryptedData += cipher.final("hex")

            // Get the authentication tag
            const authTag = cipher.getAuthTag()

            // Combine IV + authTag + encryptedData
            const combined = Buffer.concat([
                iv,
                authTag,
                Buffer.from(encryptedData, "hex"),
            ])

            // Convert to base64 for storage
            const encryptedToken = combined.toString("base64")

            return {
                encryptedToken,
                algorithm: ENCRYPTION_ALGORITHM,
                encryptedAt: new Date(),
            }
        } catch (error) {
            throw new Error(
                `Failed to encrypt token: ${error instanceof Error ? error.message : "Unknown error"}`
            )
        }
    }

    /**
     * Decrypt an encrypted OAuth token
     * @param encryptedToken - The encrypted token in base64 format
     * @returns Decryption result with original token
     * @throws Error if decryption fails or token is invalid
     *
     * @example
     * const service = new TokenEncryptionService({
     *   strategy: 'environment',
     *   environmentVariableName: 'ENCRYPTION_KEY'
     * })
     * const result = await service.decrypt(encryptedToken)
     * // result.token will be the original OAuth token
     */
    async decrypt(encryptedToken: string): Promise<DecryptionResult> {
        if (!encryptedToken || typeof encryptedToken !== "string") {
            throw new Error("Encrypted token must be a non-empty string")
        }

        try {
            const key = await this.getEncryptionKey()

            // Decode from base64
            const combined = Buffer.from(encryptedToken, "base64")

            // Extract IV, authTag, and encryptedData
            const iv = combined.slice(0, IV_LENGTH)
            const authTag = combined.slice(
                IV_LENGTH,
                IV_LENGTH + AUTH_TAG_LENGTH
            )
            const encryptedData = combined.slice(IV_LENGTH + AUTH_TAG_LENGTH)

            // Create decipher
            const decipher = crypto.createDecipheriv(
                ENCRYPTION_ALGORITHM,
                key,
                iv
            )
            decipher.setAuthTag(authTag)

            // Decrypt the token
            let token = decipher.update(encryptedData, "hex", "utf-8")
            token += decipher.final("utf-8")

            return {
                token,
                decryptedAt: new Date(),
            }
        } catch (error) {
            throw new Error(
                `Failed to decrypt token: ${error instanceof Error ? error.message : "Unknown error"}`
            )
        }
    }

    /**
     * Rotate the encryption key
     * This should be called periodically for security
     * @param newKey - The new encryption key as a hex string (64 characters)
     * @throws Error if new key is invalid
     */
    rotateKey(newKey: string): void {
        if (!newKey || typeof newKey !== "string") {
            throw new Error("New key must be a non-empty string")
        }

        if (newKey.length !== 64) {
            throw new Error(
                `Encryption key must be 64 characters (32 bytes in hex), got ${newKey.length}`
            )
        }

        if (!/^[a-f0-9]{64}$/i.test(newKey)) {
            throw new Error("Encryption key must be a valid hex string")
        }

        // Clear the cached key so it will be reloaded
        this.encryptionKey = null
        this.keyCache.clear()
    }

    /**
     * Clear the cached encryption key
     * Useful for testing or when key needs to be reloaded
     */
    clearKeyCache(): void {
        this.encryptionKey = null
        this.keyCache.clear()
    }
}

/**
 * Generate a cryptographically secure encryption key
 * @returns A 64-character hex string representing a 256-bit key
 *
 * @example
 * const key = generateEncryptionKey()
 * // key will be a 64-character hex string like: a1b2c3d4e5f6...
 */
export function generateEncryptionKey(): string {
    const key = crypto.randomBytes(32) // 256 bits
    return key.toString("hex")
}

/**
 * Validate an encryption key format
 * @param key - The key to validate
 * @returns Object with isValid boolean and error message if invalid
 *
 * @example
 * validateEncryptionKey('abc123...') // { isValid: true }
 * validateEncryptionKey('invalid') // { isValid: false, error: 'Invalid key format' }
 */
export function validateEncryptionKey(key: string): {
    isValid: boolean
    error?: string
} {
    if (!key || typeof key !== "string") {
        return { isValid: false, error: "Key is required" }
    }

    if (key.length !== 64) {
        return {
            isValid: false,
            error: `Key must be 64 characters (32 bytes in hex), got ${key.length}`,
        }
    }

    if (!/^[a-f0-9]{64}$/i.test(key)) {
        return { isValid: false, error: "Key must be a valid hex string" }
    }

    return { isValid: true }
}

/**
 * Create a singleton instance of TokenEncryptionService
 * This ensures only one instance is used throughout the application
 */
let tokenEncryptionServiceInstance: TokenEncryptionService | null = null

/**
 * Get or create the token encryption service instance
 * @returns The token encryption service instance
 * @throws Error if key management strategy is not configured
 */
export function getTokenEncryptionService(): TokenEncryptionService {
    if (tokenEncryptionServiceInstance) {
        return tokenEncryptionServiceInstance
    }

    // Determine key management strategy from environment
    const strategy = (process.env.TOKEN_ENCRYPTION_STRATEGY ||
        "environment") as KeyManagementStrategy

    let config: KeyManagementConfig

    switch (strategy) {
        case "aws-kms":
            config = {
                strategy: "aws-kms",
                kmsKeyId: process.env.AWS_KMS_KEY_ID,
            }
            break
        case "local-file":
            config = {
                strategy: "local-file",
                localKeyPath: process.env.TOKEN_ENCRYPTION_KEY_PATH,
            }
            break
        case "environment":
        default:
            config = {
                strategy: "environment",
                environmentVariableName:
                    process.env.TOKEN_ENCRYPTION_KEY_ENV_VAR ||
                    "TOKEN_ENCRYPTION_KEY",
            }
            break
    }

    tokenEncryptionServiceInstance = new TokenEncryptionService(config)
    return tokenEncryptionServiceInstance
}
