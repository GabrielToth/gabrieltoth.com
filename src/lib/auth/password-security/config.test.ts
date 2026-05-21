/**
 * Test Suite: Configuration Manager
 * Purpose: Verify Configuration Manager loads, validates, and caches configuration correctly
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 3.2, 3.3
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ConfigurationManager } from "./config"

describe("ConfigurationManager", () => {
    let originalEnv: Record<string, string | undefined>

    beforeEach(() => {
        // Save original environment
        originalEnv = { ...process.env }
        // Reset singleton for each test
        ;(ConfigurationManager as any).instance = null
        ;(ConfigurationManager as any).devPepperWarned = false
    })

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv as NodeJS.ProcessEnv
        // Reset singleton after each test
        ;(ConfigurationManager as any).instance = null
        ;(ConfigurationManager as any).devPepperWarned = false
    })

    describe("Configuration Loading", () => {
        it("should load valid configuration with all environment variables set", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "128"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"
            ;(process.env as any).NODE_ENV = "development"

            // Act
            const manager = ConfigurationManager.getInstance()
            const config = manager.getConfig()

            // Assert
            expect(config.argon2id.memory).toBe(128)
            expect(config.argon2id.time).toBe(3)
            expect(config.argon2id.parallelism).toBe(2)
            expect(config.pepper).toBe(
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"
            )
        })

        it("should use default values when environment variables are not set", () => {
            // Arrange - clear environment variables
            delete process.env.ARGON2_MEMORY_COST
            delete process.env.ARGON2_TIME_COST
            delete process.env.ARGON2_PARALLELISM
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"
            ;(process.env as any).NODE_ENV = "development"

            // Act
            const manager = ConfigurationManager.getInstance()
            const config = manager.getConfig()

            // Assert - should use defaults
            expect(config.argon2id.memory).toBe(64)
            expect(config.argon2id.time).toBe(3)
            expect(config.argon2id.parallelism).toBe(2)
        })

        it("should cache configuration in memory (singleton pattern)", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "128"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"
            ;(process.env as any).NODE_ENV = "development"

            // Act
            const manager1 = ConfigurationManager.getInstance()
            const config1 = manager1.getConfig()

            // Modify environment (should have no effect due to caching)
            process.env.ARGON2_MEMORY_COST = "256"

            const manager2 = ConfigurationManager.getInstance()
            const config2 = manager2.getConfig()

            // Assert - should be same instance and same values
            expect(manager1).toBe(manager2)
            expect(config1.argon2id.memory).toBe(128) // Not updated to 256
            expect(config2.argon2id.memory).toBe(128)
        })

        it("should log configuration on startup (excluding secrets)", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "128"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"
            ;(process.env as any).NODE_ENV = "development"

            const consoleSpy = vi
                .spyOn(console, "log")
                .mockImplementation(() => {})
            delete process.env.SUPPRESS_SECURITY_CONFIG_LOGS

            // Act
            ConfigurationManager.getInstance()

            // Assert
            expect(consoleSpy).toHaveBeenCalled()
            const logCall = consoleSpy.mock.calls[0]
            expect(logCall[0]).toContain("Security configuration loaded")
            expect(JSON.stringify(logCall[1])).toContain("<secret>")
            expect(JSON.stringify(logCall[1])).not.toContain("this-is-a-valid")

            consoleSpy.mockRestore()
        })
    })

    describe("Argon2id Parameter Validation", () => {
        it("should reject memory cost below minimum (16 MB)", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "15"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"

            // Act & Assert
            expect(() => {
                ConfigurationManager.getInstance()
            }).toThrow(/Invalid Argon2id configuration/)
        })

        it("should reject memory cost above maximum (256 MB)", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "257"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"

            // Act & Assert
            expect(() => {
                ConfigurationManager.getInstance()
            }).toThrow(/Invalid Argon2id configuration/)
        })

        it("should accept valid memory cost boundaries (16 and 256)", () => {
            // Test minimum
            process.env.ARGON2_MEMORY_COST = "16"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"
            ;(process.env as any).NODE_ENV = "development"

            let manager = ConfigurationManager.getInstance()
            expect(manager.getConfig().argon2id.memory).toBe(16)

            // Reset for next test
            ;(ConfigurationManager as any).instance = null

            // Test maximum
            process.env.ARGON2_MEMORY_COST = "256"
            manager = ConfigurationManager.getInstance()
            expect(manager.getConfig().argon2id.memory).toBe(256)
        })

        it("should reject time cost below minimum (2)", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "64"
            process.env.ARGON2_TIME_COST = "1"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"

            // Act & Assert
            expect(() => {
                ConfigurationManager.getInstance()
            }).toThrow(/Invalid Argon2id configuration/)
        })

        it("should reject time cost above maximum (10)", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "64"
            process.env.ARGON2_TIME_COST = "11"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"

            // Act & Assert
            expect(() => {
                ConfigurationManager.getInstance()
            }).toThrow(/Invalid Argon2id configuration/)
        })

        it("should accept valid time cost boundaries (2 and 10)", () => {
            // Test minimum
            process.env.ARGON2_MEMORY_COST = "64"
            process.env.ARGON2_TIME_COST = "2"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"
            ;(process.env as any).NODE_ENV = "development"

            let manager = ConfigurationManager.getInstance()
            expect(manager.getConfig().argon2id.time).toBe(2)

            // Reset for next test
            ;(ConfigurationManager as any).instance = null

            // Test maximum
            process.env.ARGON2_TIME_COST = "10"
            manager = ConfigurationManager.getInstance()
            expect(manager.getConfig().argon2id.time).toBe(10)
        })

        it("should reject parallelism below minimum (1)", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "64"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "0"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"

            // Act & Assert
            expect(() => {
                ConfigurationManager.getInstance()
            }).toThrow(/Invalid Argon2id configuration/)
        })

        it("should reject parallelism above maximum (4)", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "64"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "5"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"

            // Act & Assert
            expect(() => {
                ConfigurationManager.getInstance()
            }).toThrow(/Invalid Argon2id configuration/)
        })

        it("should accept valid parallelism boundaries (1 and 4)", () => {
            // Test minimum
            process.env.ARGON2_MEMORY_COST = "64"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "1"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"
            ;(process.env as any).NODE_ENV = "development"

            let manager = ConfigurationManager.getInstance()
            expect(manager.getConfig().argon2id.parallelism).toBe(1)

            // Reset for next test
            ;(ConfigurationManager as any).instance = null

            // Test maximum
            process.env.ARGON2_PARALLELISM = "4"
            manager = ConfigurationManager.getInstance()
            expect(manager.getConfig().argon2id.parallelism).toBe(4)
        })

        it("should reject non-numeric parameters", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "invalid"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"

            // Act & Assert
            expect(() => {
                ConfigurationManager.getInstance()
            }).toThrow()
        })
    })

    describe("Pepper Validation", () => {
        it("should throw error if PEPPER_SECRET is not configured (fail-secure)", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "64"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            delete process.env.PEPPER_SECRET

            // Act & Assert
            expect(() => {
                ConfigurationManager.getInstance()
            }).toThrow(/PEPPER_SECRET.*not configured/)
        })

        it("should throw error if PEPPER_SECRET is too short (< 32 chars)", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "64"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET = "short-pepper"

            // Act & Assert
            expect(() => {
                ConfigurationManager.getInstance()
            }).toThrow(/PEPPER_SECRET.*too short/)
        })

        it("should accept pepper with exactly 32 characters", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "64"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET = "a".repeat(32)
            ;(process.env as any).NODE_ENV = "development"

            // Act
            const manager = ConfigurationManager.getInstance()
            const config = manager.getConfig()

            // Assert
            expect(config.pepper).toBe("a".repeat(32))
        })

        it("should accept pepper longer than 32 characters", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "64"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET = "a".repeat(64)
            ;(process.env as any).NODE_ENV = "development"

            // Act
            const manager = ConfigurationManager.getInstance()
            const config = manager.getConfig()

            // Assert
            expect(config.pepper.length).toBe(64)
        })

        it("should throw error if development pepper is used in Vercel production", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "64"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET =
                "dev-pepper-test-very-long-string-32chars-minimum-required!"
            ;(process.env as any).NODE_ENV = "production"
            process.env.VERCEL = "1"
            process.env.VERCEL_ENV = "production"

            // Act & Assert
            expect(() => {
                ConfigurationManager.getInstance()
            }).toThrow(/development value in production/)
        })

        it("should warn but not throw if development pepper is used in development", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "64"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET =
                "dev-pepper-test-very-long-string-32chars-minimum-required!"
            ;(process.env as any).NODE_ENV = "development"

            const consoleWarnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {})
            delete process.env.SUPPRESS_SECURITY_CONFIG_LOGS

            // Act
            const manager = ConfigurationManager.getInstance()

            // Assert - should not throw, but should warn
            expect(manager.getConfig().pepper).toBe(
                "dev-pepper-test-very-long-string-32chars-minimum-required!"
            )
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining("WARNING")
            )

            consoleWarnSpy.mockRestore()
        })
    })

    describe("Accessor Methods", () => {
        beforeEach(() => {
            process.env.ARGON2_MEMORY_COST = "128"
            process.env.ARGON2_TIME_COST = "4"
            process.env.ARGON2_PARALLELISM = "3"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"
            ;(process.env as any).NODE_ENV = "development"
        })

        it("should provide getArgon2Params() method", () => {
            // Arrange
            const manager = ConfigurationManager.getInstance()

            // Act
            const params = manager.getArgon2Params()

            // Assert
            expect(params.memory).toBe(128)
            expect(params.time).toBe(4)
            expect(params.parallelism).toBe(3)
        })

        it("should provide getPepper() method", () => {
            // Arrange
            const manager = ConfigurationManager.getInstance()

            // Act
            const pepper = manager.getPepper()

            // Assert
            expect(pepper).toBe(
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"
            )
        })

        it("should provide getRateLimitingConfig() method", () => {
            // Arrange
            process.env.RATE_LIMIT_FAILURE_THRESHOLD = "3"
            process.env.RATE_LIMIT_WINDOW_MINUTES = "15"
            process.env.RATE_LIMIT_LOCKOUT_MINUTES = "15"
            ;(ConfigurationManager as any).instance = null

            const manager = ConfigurationManager.getInstance()

            // Act
            const rateLimitingConfig = manager.getRateLimitingConfig()

            // Assert
            expect(rateLimitingConfig.failureThreshold).toBe(3)
            expect(rateLimitingConfig.windowMinutes).toBe(15)
        })

        it("should provide getCaptchaProvider() method", () => {
            // Arrange
            process.env.CAPTCHA_PROVIDER = "google"
            ;(ConfigurationManager as any).instance = null

            const manager = ConfigurationManager.getInstance()

            // Act
            const provider = manager.getCaptchaProvider()

            // Assert
            expect(provider).toBe("google")
        })

        it("should default CAPTCHA provider to cloudflare", () => {
            // Arrange
            delete process.env.CAPTCHA_PROVIDER

            const manager = ConfigurationManager.getInstance()

            // Act
            const provider = manager.getCaptchaProvider()

            // Assert
            expect(provider).toBe("cloudflare")
        })
    })

    describe("Rate Limiting Configuration", () => {
        it("should load custom rate limiting parameters from environment", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "64"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"
            process.env.RATE_LIMIT_FAILURE_THRESHOLD = "3"
            process.env.RATE_LIMIT_WINDOW_MINUTES = "30"
            process.env.RATE_LIMIT_LOCKOUT_MINUTES = "60"
            process.env.RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD = "2"
            ;(process.env as any).NODE_ENV = "development"

            // Act
            const manager = ConfigurationManager.getInstance()
            const config = manager.getConfig()

            // Assert
            expect(config.rateLimiting.failureThreshold).toBe(3)
            expect(config.rateLimiting.windowMinutes).toBe(30)
            expect(config.rateLimiting.lockoutMinutes).toBe(60)
            expect(config.rateLimiting.captchaEscalationThreshold).toBe(2)
        })

        it("should use default rate limiting values when not specified", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "64"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"
            delete process.env.RATE_LIMIT_FAILURE_THRESHOLD
            delete process.env.RATE_LIMIT_WINDOW_MINUTES
            delete process.env.RATE_LIMIT_LOCKOUT_MINUTES
            delete process.env.RATE_LIMIT_CAPTCHA_ESCALATION_THRESHOLD
            ;(process.env as any).NODE_ENV = "development"

            // Act
            const manager = ConfigurationManager.getInstance()
            const config = manager.getConfig()

            // Assert
            expect(config.rateLimiting.failureThreshold).toBe(5)
            expect(config.rateLimiting.windowMinutes).toBe(15)
            expect(config.rateLimiting.lockoutMinutes).toBe(15)
            expect(config.rateLimiting.captchaEscalationThreshold).toBe(3)
        })
    })

    describe("Error Handling", () => {
        it("should throw error on multiple validation failures", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "1000"
            process.env.ARGON2_TIME_COST = "100"
            process.env.ARGON2_PARALLELISM = "100"
            process.env.PEPPER_SECRET = "short"

            // Act & Assert
            expect(() => {
                ConfigurationManager.getInstance()
            }).toThrow()
        })

        it("should provide clear error messages for debugging", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "1000"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            process.env.PEPPER_SECRET =
                "this-is-a-valid-pepper-secret-that-is-long-enough-32-chars"

            // Act & Assert
            expect(() => {
                ConfigurationManager.getInstance()
            }).toThrow(/Invalid Argon2id configuration/)
        })

        it("should log errors to console on configuration failure", () => {
            // Arrange
            process.env.ARGON2_MEMORY_COST = "64"
            process.env.ARGON2_TIME_COST = "3"
            process.env.ARGON2_PARALLELISM = "2"
            delete process.env.PEPPER_SECRET

            const consoleErrorSpy = vi
                .spyOn(console, "error")
                .mockImplementation(() => {})
            delete process.env.SUPPRESS_AUTH_SECURITY_STDERR

            // Act & Assert
            expect(() => {
                ConfigurationManager.getInstance()
            }).toThrow()

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining(
                    "Failed to load security configuration"
                ),
                expect.any(Error)
            )

            consoleErrorSpy.mockRestore()
        })
    })
})
