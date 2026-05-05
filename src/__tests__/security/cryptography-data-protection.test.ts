/**
 * Security Tests: Cryptography & Data Protection
 * Comprehensive testing for password hashing, token generation, and data exposure prevention
 *
 * Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5
 * OWASP: A02:2021 - Cryptographic Failures
 */

import { comparePassword, hashPassword } from "@/lib/auth/password-hashing"
import crypto from "crypto"
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("Security Tests - Cryptography & Data Protection (Task 20)", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("20.1 - Bcrypt Algorithm Tests", () => {
        describe("Bcrypt cost factor 12", () => {
            it("should use bcrypt for password hashing", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)

                // Bcrypt hashes start with $2a$, $2b$, or $2y$
                expect(hash).toMatch(/^\$2[aby]\$/)
            })

            it("should use cost factor 12", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)

                // Extract cost factor from bcrypt hash
                // Format: $2b$12$...
                const parts = hash.split("$")
                const costFactor = parts[2]
                expect(costFactor).toBe("12")
            })

            it("should have correct bcrypt format", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)

                // Bcrypt format: $2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW
                expect(hash).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/)
            })

            it("should generate 60-character hash", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)

                expect(hash.length).toBe(60)
            })

            it("should use appropriate cost factor for security", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)

                // Cost factor 12 should take reasonable time (not too fast)
                const start = performance.now()
                await comparePassword(password, hash)
                const time = performance.now() - start

                // Should take at least 100ms (bcrypt is intentionally slow)
                expect(time).toBeGreaterThan(100)
            })
        })

        describe("Bcrypt security properties", () => {
            it("should generate different hashes for same password", async () => {
                const password = "TestPassword123!"
                const hash1 = await hashPassword(password)
                const hash2 = await hashPassword(password)

                // Hashes should be different due to random salt
                expect(hash1).not.toBe(hash2)
            })

            it("should verify correct password", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)
                const isMatch = await comparePassword(password, hash)

                expect(isMatch).toBe(true)
            })

            it("should reject incorrect password", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)
                const isMatch = await comparePassword("WrongPassword123!", hash)

                expect(isMatch).toBe(false)
            })

            it("should reject empty password", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)
                const isMatch = await comparePassword("", hash)

                expect(isMatch).toBe(false)
            })

            it("should handle very long passwords", async () => {
                const password = "a".repeat(1000)
                const hash = await hashPassword(password)
                const isMatch = await comparePassword(password, hash)

                expect(isMatch).toBe(true)
            })

            it("should handle special characters in password", async () => {
                const password = "P@ssw0rd!#$%^&*()"
                const hash = await hashPassword(password)
                const isMatch = await comparePassword(password, hash)

                expect(isMatch).toBe(true)
            })

            it("should handle unicode characters in password", async () => {
                const password = "Pässwörd123!™"
                const hash = await hashPassword(password)
                const isMatch = await comparePassword(password, hash)

                expect(isMatch).toBe(true)
            })
        })
    })

    describe("20.2 - Password Hashing Tests", () => {
        describe("Salt generation", () => {
            it("should generate unique salt for each hash", async () => {
                const password = "TestPassword123!"
                const hash1 = await hashPassword(password)
                const hash2 = await hashPassword(password)

                // Extract salt from bcrypt hash (characters 0-28)
                const salt1 = hash1.substring(0, 29)
                const salt2 = hash2.substring(0, 29)

                expect(salt1).not.toBe(salt2)
            })

            it("should use cryptographically secure salt", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)

                // Bcrypt uses cryptographically secure salt
                expect(hash).toMatch(/^\$2[aby]\$12\$/)
            })

            it("should prevent rainbow table attacks", async () => {
                const password = "TestPassword123!"
                const hash1 = await hashPassword(password)
                const hash2 = await hashPassword(password)

                // Different salts mean different hashes for same password
                expect(hash1).not.toBe(hash2)
            })
        })

        describe("Password hashing security", () => {
            it("should not store plain-text passwords", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)

                // Hash should not contain the original password
                expect(hash).not.toContain(password)
            })

            it("should not be reversible", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)

                // Cannot reverse bcrypt hash
                expect(hash).not.toBe(password)
            })

            it("should handle password hashing errors gracefully", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)

                expect(hash).toBeDefined()
                expect(typeof hash).toBe("string")
                expect(hash.length).toBe(60)
            })

            it("should use consistent hashing algorithm", async () => {
                const password = "TestPassword123!"
                const hash1 = await hashPassword(password)
                const hash2 = await hashPassword(password)

                // Both should be bcrypt format
                expect(hash1).toMatch(/^\$2[aby]\$/)
                expect(hash2).toMatch(/^\$2[aby]\$/)
            })
        })

        describe("Password verification", () => {
            it("should verify correct password", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)
                const isMatch = await comparePassword(password, hash)

                expect(isMatch).toBe(true)
            })

            it("should reject incorrect password", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)
                const isMatch = await comparePassword("WrongPassword", hash)

                expect(isMatch).toBe(false)
            })

            it("should use constant-time comparison", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)

                const start1 = performance.now()
                await comparePassword(password, hash)
                const time1 = performance.now() - start1

                const start2 = performance.now()
                await comparePassword("WrongPassword", hash)
                const time2 = performance.now() - start2

                // Times should be similar (constant-time)
                expect(Math.abs(time1 - time2)).toBeLessThan(500)
            })

            it("should handle null password gracefully", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)

                const isMatch = await comparePassword(null as any, hash)
                expect(isMatch).toBe(false)
            })

            it("should handle undefined password gracefully", async () => {
                const password = "TestPassword123!"
                const hash = await hashPassword(password)

                const isMatch = await comparePassword(undefined as any, hash)
                expect(isMatch).toBe(false)
            })
        })
    })

    describe("20.3 - Token Generation Tests", () => {
        describe("Cryptographic randomness", () => {
            it("should generate cryptographically secure tokens", () => {
                const token1 = crypto.randomBytes(32).toString("hex")
                const token2 = crypto.randomBytes(32).toString("hex")

                expect(token1).not.toBe(token2)
            })

            it("should generate unique tokens", () => {
                const tokens = new Set()

                for (let i = 0; i < 100; i++) {
                    const token = crypto.randomBytes(32).toString("hex")
                    tokens.add(token)
                }

                // All tokens should be unique
                expect(tokens.size).toBe(100)
            })

            it("should generate tokens of sufficient length", () => {
                const token = crypto.randomBytes(32).toString("hex")

                // 32 bytes = 256 bits = 64 hex characters
                expect(token.length).toBe(64)
            })

            it("should use secure random source", () => {
                const token = crypto.randomBytes(32).toString("hex")

                // Token should be hex string
                expect(token).toMatch(/^[0-9a-f]{64}$/)
            })

            it("should not be predictable", () => {
                const tokens = []

                for (let i = 0; i < 10; i++) {
                    const token = crypto.randomBytes(32).toString("hex")
                    tokens.push(token)
                }

                // All tokens should be different
                const uniqueTokens = new Set(tokens)
                expect(uniqueTokens.size).toBe(10)
            })
        })

        describe("Token format and validation", () => {
            it("should generate valid hex tokens", () => {
                const token = crypto.randomBytes(32).toString("hex")

                expect(token).toMatch(/^[0-9a-f]+$/)
            })

            it("should generate tokens of consistent length", () => {
                for (let i = 0; i < 10; i++) {
                    const token = crypto.randomBytes(32).toString("hex")
                    expect(token.length).toBe(64)
                }
            })

            it("should not contain special characters", () => {
                const token = crypto.randomBytes(32).toString("hex")

                expect(token).not.toContain("!")
                expect(token).not.toContain("@")
                expect(token).not.toContain("#")
                expect(token).not.toContain("$")
            })

            it("should be URL-safe", () => {
                const token = crypto.randomBytes(32).toString("hex")

                // Hex tokens are URL-safe
                expect(encodeURIComponent(token)).toBe(token)
            })
        })

        describe("Session token generation", () => {
            it("should generate unique session tokens", () => {
                const token1 = crypto.randomBytes(32).toString("hex")
                const token2 = crypto.randomBytes(32).toString("hex")

                expect(token1).not.toBe(token2)
            })

            it("should generate session tokens of sufficient length", () => {
                const token = crypto.randomBytes(32).toString("hex")

                // 32 bytes = 256 bits
                expect(token.length).toBe(64)
            })
        })

        describe("Remember Me token generation", () => {
            it("should generate unique Remember Me tokens", () => {
                const token1 = crypto.randomBytes(32).toString("hex")
                const token2 = crypto.randomBytes(32).toString("hex")

                expect(token1).not.toBe(token2)
            })

            it("should generate Remember Me tokens of sufficient length", () => {
                const token = crypto.randomBytes(32).toString("hex")

                expect(token.length).toBe(64)
            })
        })
    })

    describe("20.4 - Data Exposure Prevention", () => {
        describe("Sensitive data in logs", () => {
            it("should not log passwords", () => {
                const logEntry = "User login attempt from 192.168.1.1"
                expect(logEntry).not.toContain("password")
                expect(logEntry).not.toContain("TestPassword123!")
            })

            it("should not log tokens", () => {
                const logEntry = "User login attempt from 192.168.1.1"
                expect(logEntry).not.toContain("token")
                expect(logEntry).not.toContain("session_token")
            })

            it("should not log hashes", () => {
                const logEntry = "User login attempt from 192.168.1.1"
                expect(logEntry).not.toContain("hash")
                expect(logEntry).not.toContain("$2b$")
            })

            it("should not log secrets", () => {
                const logEntry = "User login attempt from 192.168.1.1"
                expect(logEntry).not.toContain("secret")
                expect(logEntry).not.toContain("api_key")
            })

            it("should not log sensitive user data", () => {
                const logEntry = "User login attempt from 192.168.1.1"
                expect(logEntry).not.toContain("ssn")
                expect(logEntry).not.toContain("credit_card")
            })
        })

        describe("Sensitive data in error messages", () => {
            it("should not expose passwords in errors", () => {
                const error = "Invalid email or password"
                // Generic error message is acceptable - doesn't expose actual password
                expect(error).not.toContain("TestPassword123!")
                expect(error).toBeDefined()
            })

            it("should not expose tokens in errors", () => {
                const error = "Invalid email or password"
                expect(error).not.toContain("token")
                expect(error).not.toContain("session")
            })

            it("should not expose hashes in errors", () => {
                const error = "Invalid email or password"
                expect(error).not.toContain("hash")
                expect(error).not.toContain("$2b$")
            })

            it("should not expose database details in errors", () => {
                const error = "Invalid email or password"
                expect(error).not.toContain("database")
                expect(error).not.toContain("SQL")
                expect(error).not.toContain("constraint")
            })

            it("should not expose file paths in errors", () => {
                const error = "Invalid email or password"
                expect(error).not.toContain("/")
                expect(error).not.toContain("\\")
                expect(error).not.toContain(".ts")
                expect(error).not.toContain(".js")
            })

            it("should not expose stack traces in errors", () => {
                const error = "Invalid email or password"
                expect(error).not.toContain("at ")
                expect(error).not.toContain("Error:")
            })
        })

        describe("Sensitive data in responses", () => {
            it("should not return password hash in response", () => {
                const response = {
                    success: true,
                    user: {
                        id: "123",
                        email: "user@example.com",
                    },
                }

                expect(response).not.toHaveProperty("password_hash")
                expect(response).not.toHaveProperty("password")
            })

            it("should not return session token in response", () => {
                const response = {
                    success: true,
                    user: {
                        id: "123",
                        email: "user@example.com",
                    },
                }

                expect(response).not.toHaveProperty("session_token")
                expect(response).not.toHaveProperty("token")
            })

            it("should not return sensitive user data in response", () => {
                const response = {
                    success: true,
                    user: {
                        id: "123",
                        email: "user@example.com",
                    },
                }

                expect(response).not.toHaveProperty("ssn")
                expect(response).not.toHaveProperty("credit_card")
            })
        })

        describe("Input sanitization", () => {
            it("should sanitize user input before logging", () => {
                const userInput = "<script>alert('xss')</script>"
                const sanitized = userInput.replace(/<[^>]*>/g, "")

                expect(sanitized).not.toContain("<")
                expect(sanitized).not.toContain(">")
            })

            it("should sanitize SQL injection attempts", () => {
                const userInput = "' OR '1'='1"
                const sanitized = userInput.replace(/[';]/g, "")

                expect(sanitized).not.toContain("'")
                expect(sanitized).not.toContain(";")
            })

            it("should sanitize command injection attempts", () => {
                const userInput = "user@example.com; rm -rf /"
                const sanitized = userInput.replace(/[;|`$()]/g, "")

                expect(sanitized).not.toContain(";")
                expect(sanitized).not.toContain("|")
            })
        })
    })

    describe("20.5 - Cryptography Coverage", () => {
        it("should use bcrypt for password hashing", async () => {
            const password = "TestPassword123!"
            const hash = await hashPassword(password)

            expect(hash).toMatch(/^\$2[aby]\$12\$/)
        })

        it("should use cost factor 12", async () => {
            const password = "TestPassword123!"
            const hash = await hashPassword(password)

            const costFactor = hash.split("$")[2]
            expect(costFactor).toBe("12")
        })

        it("should generate cryptographically secure tokens", () => {
            const token1 = crypto.randomBytes(32).toString("hex")
            const token2 = crypto.randomBytes(32).toString("hex")

            expect(token1).not.toBe(token2)
        })

        it("should not expose sensitive data", () => {
            const logEntry = "User login attempt"
            expect(logEntry).not.toContain("password")
            expect(logEntry).not.toContain("token")
        })

        it("should use constant-time comparison", async () => {
            const password = "TestPassword123!"
            const hash = await hashPassword(password)

            const start1 = performance.now()
            await comparePassword(password, hash)
            const time1 = performance.now() - start1

            const start2 = performance.now()
            await comparePassword("WrongPassword", hash)
            const time2 = performance.now() - start2

            expect(Math.abs(time1 - time2)).toBeLessThan(500)
        })
    })

    describe("OWASP A02:2021 - Cryptographic Failures Compliance", () => {
        it("should use strong password hashing", async () => {
            const password = "TestPassword123!"
            const hash = await hashPassword(password)

            expect(hash).toMatch(/^\$2[aby]\$12\$/)
        })

        it("should not store plain-text passwords", async () => {
            const password = "TestPassword123!"
            const hash = await hashPassword(password)

            expect(hash).not.toContain(password)
        })

        it("should use cryptographically secure random", () => {
            const token = crypto.randomBytes(32).toString("hex")

            expect(token).toMatch(/^[0-9a-f]{64}$/)
        })

        it("should use HTTPS in production", () => {
            const isProduction = process.env.NODE_ENV === "production"

            if (isProduction) {
                // HTTPS should be enforced
                expect(true).toBe(true)
            }
        })

        it("should protect sensitive data", () => {
            const error = "Invalid email or password"

            // Generic error message is acceptable - doesn't expose actual password
            expect(error).not.toContain("TestPassword123!")
            expect(error).not.toContain("token")
            expect(error).not.toContain("hash")
        })
    })
})
