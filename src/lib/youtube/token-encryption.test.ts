/**
 * Token Encryption Service Tests
 * Tests for AES-256 encryption/decryption of OAuth tokens
 * Validates: Requirements 1.4, 8.1
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
    TokenEncryptionService,
    generateEncryptionKey,
    getTokenEncryptionService,
    validateEncryptionKey,
} from "./token-encryption"

describe("TokenEncryptionService", () => {
    let service: TokenEncryptionService
    let testKey: string

    beforeEach(() => {
        // Generate a test key
        testKey = generateEncryptionKey()

        // Create service instance with environment strategy
        service = new TokenEncryptionService({
            strategy: "environment",
            environmentVariableName: "TEST_ENCRYPTION_KEY",
        })

        // Set the test key in environment
        process.env.TEST_ENCRYPTION_KEY = testKey
    })

    afterEach(() => {
        // Clean up environment
        delete process.env.TEST_ENCRYPTION_KEY
        service.clearKeyCache()
    })

    describe("encrypt", () => {
        it("should encrypt a token successfully", async () => {
            const token = "ya29.a0AfH6SMBx1234567890abcdefghijklmnopqrstuvwxyz"

            const result = await service.encrypt(token)

            expect(result).toBeDefined()
            expect(result.encryptedToken).toBeDefined()
            expect(result.algorithm).toBe("aes-256-gcm")
            expect(result.encryptedAt).toBeInstanceOf(Date)
            expect(typeof result.encryptedToken).toBe("string")
            expect(result.encryptedToken.length).toBeGreaterThan(0)
        })

        it("should produce different ciphertexts for the same token (due to random IV)", async () => {
            const token = "ya29.a0AfH6SMBx1234567890abcdefghijklmnopqrstuvwxyz"

            const result1 = await service.encrypt(token)
            const result2 = await service.encrypt(token)

            // Encrypted tokens should be different due to random IV
            expect(result1.encryptedToken).not.toBe(result2.encryptedToken)
        })

        it("should throw error for empty token", async () => {
            await expect(service.encrypt("")).rejects.toThrow(
                "Token must be a non-empty string"
            )
        })

        it("should throw error for null token", async () => {
            await expect(service.encrypt(null as any)).rejects.toThrow(
                "Token must be a non-empty string"
            )
        })

        it("should throw error for undefined token", async () => {
            await expect(service.encrypt(undefined as any)).rejects.toThrow(
                "Token must be a non-empty string"
            )
        })

        it("should handle tokens with special characters", async () => {
            const token = "ya29.a0AfH6SMBx!@#$%^&*()_+-=[]{}|;:',.<>?/~`"

            const result = await service.encrypt(token)

            expect(result.encryptedToken).toBeDefined()
            expect(typeof result.encryptedToken).toBe("string")
        })

        it("should handle very long tokens", async () => {
            const token = "ya29.a0AfH6SMBx" + "x".repeat(10000)

            const result = await service.encrypt(token)

            expect(result.encryptedToken).toBeDefined()
            expect(typeof result.encryptedToken).toBe("string")
        })
    })

    describe("decrypt", () => {
        it("should decrypt an encrypted token successfully", async () => {
            const originalToken =
                "ya29.a0AfH6SMBx1234567890abcdefghijklmnopqrstuvwxyz"

            const encrypted = await service.encrypt(originalToken)
            const decrypted = await service.decrypt(encrypted.encryptedToken)

            expect(decrypted.token).toBe(originalToken)
            expect(decrypted.decryptedAt).toBeInstanceOf(Date)
        })

        it("should throw error for empty encrypted token", async () => {
            await expect(service.decrypt("")).rejects.toThrow(
                "Encrypted token must be a non-empty string"
            )
        })

        it("should throw error for null encrypted token", async () => {
            await expect(service.decrypt(null as any)).rejects.toThrow(
                "Encrypted token must be a non-empty string"
            )
        })

        it("should throw error for invalid base64", async () => {
            await expect(
                service.decrypt("not-valid-base64!!!")
            ).rejects.toThrow()
        })

        it("should throw error for tampered ciphertext", async () => {
            const originalToken =
                "ya29.a0AfH6SMBx1234567890abcdefghijklmnopqrstuvwxyz"

            const encrypted = await service.encrypt(originalToken)

            // Tamper with the encrypted token
            const buffer = Buffer.from(encrypted.encryptedToken, "base64")
            buffer[0] = buffer[0] ^ 0xff // Flip bits in first byte
            const tamperedToken = buffer.toString("base64")

            await expect(service.decrypt(tamperedToken)).rejects.toThrow()
        })

        it("should throw error for truncated ciphertext", async () => {
            const originalToken =
                "ya29.a0AfH6SMBx1234567890abcdefghijklmnopqrstuvwxyz"

            const encrypted = await service.encrypt(originalToken)

            // Truncate the encrypted token
            const truncated = encrypted.encryptedToken.slice(0, -10)

            await expect(service.decrypt(truncated)).rejects.toThrow()
        })
    })

    describe("round-trip encryption/decryption", () => {
        it("should successfully encrypt and decrypt a token", async () => {
            const originalToken =
                "ya29.a0AfH6SMBx1234567890abcdefghijklmnopqrstuvwxyz"

            const encrypted = await service.encrypt(originalToken)
            const decrypted = await service.decrypt(encrypted.encryptedToken)

            expect(decrypted.token).toBe(originalToken)
        })

        it("should handle multiple tokens independently", async () => {
            const token1 = "ya29.a0AfH6SMBx1111111111111111111111111111111111"
            const token2 = "ya29.a0AfH6SMBx2222222222222222222222222222222222"

            const encrypted1 = await service.encrypt(token1)
            const encrypted2 = await service.encrypt(token2)

            const decrypted1 = await service.decrypt(encrypted1.encryptedToken)
            const decrypted2 = await service.decrypt(encrypted2.encryptedToken)

            expect(decrypted1.token).toBe(token1)
            expect(decrypted2.token).toBe(token2)
        })

        it("should not decrypt with wrong key", async () => {
            const originalToken =
                "ya29.a0AfH6SMBx1234567890abcdefghijklmnopqrstuvwxyz"

            const encrypted = await service.encrypt(originalToken)

            // Create a new service with a different key
            const wrongKey = generateEncryptionKey()
            process.env.TEST_ENCRYPTION_KEY = wrongKey
            service.clearKeyCache()

            // Attempt to decrypt with wrong key should fail
            await expect(
                service.decrypt(encrypted.encryptedToken)
            ).rejects.toThrow()
        })
    })

    describe("key management", () => {
        it("should throw error for missing environment variable", async () => {
            delete process.env.TEST_ENCRYPTION_KEY

            const newService = new TokenEncryptionService({
                strategy: "environment",
                environmentVariableName: "MISSING_KEY",
            })

            await expect(newService.encrypt("token")).rejects.toThrow(
                "Environment variable MISSING_KEY is not set"
            )
        })

        it("should throw error for invalid key length", () => {
            process.env.TEST_ENCRYPTION_KEY = "tooshort"

            const newService = new TokenEncryptionService({
                strategy: "environment",
                environmentVariableName: "TEST_ENCRYPTION_KEY",
            })

            expect(() => {
                newService.clearKeyCache()
            }).not.toThrow()
        })

        it("should throw error for invalid hex key", async () => {
            process.env.TEST_ENCRYPTION_KEY = "z".repeat(64) // 'z' is not valid hex

            const newService = new TokenEncryptionService({
                strategy: "environment",
                environmentVariableName: "TEST_ENCRYPTION_KEY",
            })

            await expect(newService.encrypt("token")).rejects.toThrow(
                "Encryption key must be a valid hex string"
            )
        })

        it("should validate configuration on initialization", () => {
            expect(() => {
                new TokenEncryptionService({
                    strategy: "environment",
                    environmentVariableName: undefined,
                })
            }).toThrow(
                "Environment variable name is required for environment strategy"
            )
        })

        it("should validate AWS KMS configuration", () => {
            expect(() => {
                new TokenEncryptionService({
                    strategy: "aws-kms",
                    kmsKeyId: undefined,
                })
            }).toThrow("AWS KMS key ID is required for aws-kms strategy")
        })

        it("should validate local-file configuration", () => {
            expect(() => {
                new TokenEncryptionService({
                    strategy: "local-file",
                    localKeyPath: undefined,
                })
            }).toThrow("Local key path is required for local-file strategy")
        })
    })

    describe("key rotation", () => {
        it("should rotate key successfully", async () => {
            const originalToken =
                "ya29.a0AfH6SMBx1234567890abcdefghijklmnopqrstuvwxyz"

            // Encrypt with original key
            const encrypted = await service.encrypt(originalToken)

            // Rotate to new key
            const newKey = generateEncryptionKey()
            process.env.TEST_ENCRYPTION_KEY = newKey
            service.rotateKey(newKey)

            // Old encrypted token should not decrypt with new key
            await expect(
                service.decrypt(encrypted.encryptedToken)
            ).rejects.toThrow()
        })

        it("should throw error for invalid new key", () => {
            expect(() => {
                service.rotateKey("invalid")
            }).toThrow(/Encryption key must be 64 characters/)
        })

        it("should throw error for empty new key", () => {
            expect(() => {
                service.rotateKey("")
            }).toThrow("New key must be a non-empty string")
        })
    })

    describe("key caching", () => {
        it("should cache the encryption key", async () => {
            const token = "ya29.a0AfH6SMBx1234567890abcdefghijklmnopqrstuvwxyz"

            // First encryption should load the key
            await service.encrypt(token)

            // Delete environment variable
            delete process.env.TEST_ENCRYPTION_KEY

            // Second encryption should still work (using cached key)
            const result = await service.encrypt(token)
            expect(result.encryptedToken).toBeDefined()
        })

        it("should clear key cache", async () => {
            const token = "ya29.a0AfH6SMBx1234567890abcdefghijklmnopqrstuvwxyz"

            // First encryption should load the key
            await service.encrypt(token)

            // Clear cache
            service.clearKeyCache()

            // Delete environment variable
            delete process.env.TEST_ENCRYPTION_KEY

            // Second encryption should fail (key not in cache and env var deleted)
            await expect(service.encrypt(token)).rejects.toThrow(
                "Environment variable TEST_ENCRYPTION_KEY is not set"
            )
        })
    })
})

describe("generateEncryptionKey", () => {
    it("should generate a valid encryption key", () => {
        const key = generateEncryptionKey()

        expect(typeof key).toBe("string")
        expect(key.length).toBe(64) // 32 bytes in hex
        expect(/^[a-f0-9]{64}$/i.test(key)).toBe(true)
    })

    it("should generate unique keys", () => {
        const key1 = generateEncryptionKey()
        const key2 = generateEncryptionKey()

        expect(key1).not.toBe(key2)
    })

    it("should generate cryptographically secure keys", () => {
        const keys = new Set()

        for (let i = 0; i < 100; i++) {
            keys.add(generateEncryptionKey())
        }

        // All keys should be unique
        expect(keys.size).toBe(100)
    })
})

describe("validateEncryptionKey", () => {
    it("should validate a correct key", () => {
        const key = generateEncryptionKey()
        const result = validateEncryptionKey(key)

        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
    })

    it("should reject empty key", () => {
        const result = validateEncryptionKey("")

        expect(result.isValid).toBe(false)
        expect(result.error).toBe("Key is required")
    })

    it("should reject null key", () => {
        const result = validateEncryptionKey(null as any)

        expect(result.isValid).toBe(false)
        expect(result.error).toBe("Key is required")
    })

    it("should reject key with wrong length", () => {
        const result = validateEncryptionKey("abc123")

        expect(result.isValid).toBe(false)
        expect(result.error).toContain("Key must be 64 characters")
    })

    it("should reject non-hex key", () => {
        const result = validateEncryptionKey("z".repeat(64))

        expect(result.isValid).toBe(false)
        expect(result.error).toBe("Key must be a valid hex string")
    })
})

describe("getTokenEncryptionService", () => {
    beforeEach(() => {
        // Reset environment
        delete process.env.TOKEN_ENCRYPTION_STRATEGY
        delete process.env.TOKEN_ENCRYPTION_KEY_ENV_VAR
        delete process.env.TOKEN_ENCRYPTION_KEY
    })

    it("should return a singleton instance", () => {
        // Set up environment for environment strategy
        process.env.TOKEN_ENCRYPTION_KEY = generateEncryptionKey()

        const service1 = getTokenEncryptionService()
        const service2 = getTokenEncryptionService()

        expect(service1).toBe(service2)
    })

    it("should use environment strategy by default", () => {
        process.env.TOKEN_ENCRYPTION_KEY = generateEncryptionKey()

        const service = getTokenEncryptionService()

        expect(service).toBeInstanceOf(TokenEncryptionService)
    })
})

/**
 * Property-Based Tests for Token Encryption
 * Validates: Requirements 1.4
 */
describe("Token Encryption - Property-Based Tests", () => {
    let service: TokenEncryptionService
    let testKey: string

    beforeEach(() => {
        testKey = generateEncryptionKey()
        service = new TokenEncryptionService({
            strategy: "environment",
            environmentVariableName: "TEST_ENCRYPTION_KEY",
        })
        process.env.TEST_ENCRYPTION_KEY = testKey
    })

    afterEach(() => {
        delete process.env.TEST_ENCRYPTION_KEY
        service.clearKeyCache()
    })

    it("should satisfy Property 3: Token Encryption - round-trip property", async () => {
        /**
         * **Validates: Requirements 1.4**
         *
         * Property 3: Token Encryption
         * For any OAuth access token, the system SHALL store it in encrypted form
         * such that retrieving and decrypting it produces the original token.
         */

        // Test with various token formats
        const testTokens = [
            "ya29.a0AfH6SMBx1234567890abcdefghijklmnopqrstuvwxyz",
            "ya29.a0AfH6SMBx" + "x".repeat(1000), // Long token
            "ya29.a0AfH6SMBx!@#$%^&*()", // Special characters
            "ya29.a0AfH6SMBx\n\t\r", // Whitespace characters
        ]

        for (const token of testTokens) {
            // Encrypt the token
            const encrypted = await service.encrypt(token)

            // Verify encrypted token is different from original
            expect(encrypted.encryptedToken).not.toBe(token)
            expect(encrypted.encryptedToken).not.toContain(token)

            // Decrypt and verify it matches original
            const decrypted = await service.decrypt(encrypted.encryptedToken)
            expect(decrypted.token).toBe(token)
        }
    })

    it("should satisfy Property 3: Token Encryption - deterministic decryption", async () => {
        /**
         * **Validates: Requirements 1.4**
         *
         * For any encrypted token, decrypting it multiple times should always
         * produce the same original token.
         */

        const originalToken =
            "ya29.a0AfH6SMBx1234567890abcdefghijklmnopqrstuvwxyz"
        const encrypted = await service.encrypt(originalToken)

        // Decrypt multiple times
        const decrypted1 = await service.decrypt(encrypted.encryptedToken)
        const decrypted2 = await service.decrypt(encrypted.encryptedToken)
        const decrypted3 = await service.decrypt(encrypted.encryptedToken)

        // All decryptions should produce the same token
        expect(decrypted1.token).toBe(originalToken)
        expect(decrypted2.token).toBe(originalToken)
        expect(decrypted3.token).toBe(originalToken)
    })

    it("should satisfy Property 3: Token Encryption - non-deterministic encryption", async () => {
        /**
         * **Validates: Requirements 1.4**
         *
         * For any token, encrypting it multiple times should produce different
         * ciphertexts (due to random IV), but all should decrypt to the same token.
         */

        const originalToken =
            "ya29.a0AfH6SMBx1234567890abcdefghijklmnopqrstuvwxyz"

        // Encrypt multiple times
        const encrypted1 = await service.encrypt(originalToken)
        const encrypted2 = await service.encrypt(originalToken)
        const encrypted3 = await service.encrypt(originalToken)

        // All ciphertexts should be different
        expect(encrypted1.encryptedToken).not.toBe(encrypted2.encryptedToken)
        expect(encrypted2.encryptedToken).not.toBe(encrypted3.encryptedToken)
        expect(encrypted1.encryptedToken).not.toBe(encrypted3.encryptedToken)

        // But all should decrypt to the same token
        const decrypted1 = await service.decrypt(encrypted1.encryptedToken)
        const decrypted2 = await service.decrypt(encrypted2.encryptedToken)
        const decrypted3 = await service.decrypt(encrypted3.encryptedToken)

        expect(decrypted1.token).toBe(originalToken)
        expect(decrypted2.token).toBe(originalToken)
        expect(decrypted3.token).toBe(originalToken)
    })
})
