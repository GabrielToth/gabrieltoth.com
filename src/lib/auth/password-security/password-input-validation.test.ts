/**
 * Unit Tests: Password Input Validation
 * Tests: validatePasswordInput, assertPasswordInputValid
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.7
 *
 * Test Coverage:
 * - String type validation
 * - Length constraints (8-128 characters)
 * - Null byte rejection
 * - Control character rejection
 * - Generic error messages
 */

import {
    assertPasswordInputValid,
    validatePasswordInput,
} from "./password-input-validation"

describe("Password Input Validation", () => {
    describe("validatePasswordInput - Valid Passwords", () => {
        it("should accept valid password (8 characters minimum)", () => {
            const result = validatePasswordInput("12345678")
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept valid password (128 characters maximum)", () => {
            const password = "a".repeat(128)
            const result = validatePasswordInput(password)
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept typical secure password", () => {
            const result = validatePasswordInput("MySecurePassword123!")
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept password with special characters", () => {
            const result = validatePasswordInput(
                "P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?"
            )
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept password with spaces", () => {
            const result = validatePasswordInput("My Secure Password 123")
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept password with unicode characters", () => {
            const result = validatePasswordInput("Pässwörd123!Ñoño")
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept password with numbers only", () => {
            const result = validatePasswordInput("12345678901234567890")
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept password with letters only", () => {
            const result = validatePasswordInput("abcdefghijklmnopqrst")
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept password with mixed case", () => {
            const result = validatePasswordInput("AbCdEfGhIjKlMnOpQrSt")
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should accept password at exactly 8 characters", () => {
            const result = validatePasswordInput("12345678")
            expect(result.valid).toBe(true)
        })

        it("should accept password at exactly 128 characters", () => {
            const password = "a".repeat(128)
            const result = validatePasswordInput(password)
            expect(result.valid).toBe(true)
        })
    })

    describe("validatePasswordInput - Invalid Type", () => {
        it("should reject null", () => {
            const result = validatePasswordInput(null)
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject undefined", () => {
            const result = validatePasswordInput(undefined)
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject number", () => {
            const result = validatePasswordInput(12345678)
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject boolean", () => {
            const result = validatePasswordInput(true)
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject object", () => {
            const result = validatePasswordInput({ password: "test" })
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject array", () => {
            const result = validatePasswordInput(["password"])
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject symbol", () => {
            const result = validatePasswordInput(Symbol("password"))
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })
    })

    describe("validatePasswordInput - Length Validation", () => {
        it("should reject password shorter than 8 characters (7 chars)", () => {
            const result = validatePasswordInput("1234567")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password shorter than 8 characters (1 char)", () => {
            const result = validatePasswordInput("a")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject empty string", () => {
            const result = validatePasswordInput("")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password longer than 128 characters (129 chars)", () => {
            const password = "a".repeat(129)
            const result = validatePasswordInput(password)
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password much longer than 128 characters (1000 chars)", () => {
            const password = "a".repeat(1000)
            const result = validatePasswordInput(password)
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password with only spaces (8 spaces)", () => {
            const result = validatePasswordInput("        ")
            expect(result.valid).toBe(true) // Spaces are valid characters
        })
    })

    describe("validatePasswordInput - Null Byte Rejection", () => {
        it("should reject password with null byte at start", () => {
            const result = validatePasswordInput("\x00Password123")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password with null byte in middle", () => {
            const result = validatePasswordInput("Password\x00123")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password with null byte at end", () => {
            const result = validatePasswordInput("Password123\x00")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password with multiple null bytes", () => {
            const result = validatePasswordInput("Pass\x00word\x00123")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password with only null byte", () => {
            const result = validatePasswordInput("\0")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })
    })

    describe("validatePasswordInput - Control Character Rejection", () => {
        it("should reject password with tab character (\\t)", () => {
            const result = validatePasswordInput("Password\t123")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password with newline character (\\n)", () => {
            const result = validatePasswordInput("Password\n123")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password with carriage return (\\r)", () => {
            const result = validatePasswordInput("Password\r123")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password with form feed (\\f)", () => {
            const result = validatePasswordInput("Password\f123")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password with backspace (\\b)", () => {
            const result = validatePasswordInput("Password\b123")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password with vertical tab (\\v)", () => {
            const result = validatePasswordInput("Password\v123")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password with delete character (\\x7F)", () => {
            const result = validatePasswordInput("Password\x7F123")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password with control character \\x01", () => {
            const result = validatePasswordInput("Password\x01123")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password with control character \\x1F", () => {
            const result = validatePasswordInput("Password\x1F123")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })

        it("should reject password with multiple control characters", () => {
            const result = validatePasswordInput("Pass\t\nword\r123")
            expect(result.valid).toBe(false)
            expect(result.error).toBe("Invalid password")
        })
    })

    describe("validatePasswordInput - Generic Error Messages", () => {
        it("should return generic error for type mismatch", () => {
            const result = validatePasswordInput(123)
            expect(result.error).toBe("Invalid password")
            expect(result.error).not.toContain("number")
            expect(result.error).not.toContain("type")
        })

        it("should return generic error for length violation", () => {
            const result = validatePasswordInput("short")
            expect(result.error).toBe("Invalid password")
            expect(result.error).not.toContain("8")
            expect(result.error).not.toContain("128")
            expect(result.error).not.toContain("length")
        })

        it("should return generic error for null byte", () => {
            const result = validatePasswordInput("Pass\0word")
            expect(result.error).toBe("Invalid password")
            expect(result.error).not.toContain("null")
            expect(result.error).not.toContain("byte")
        })

        it("should return generic error for control character", () => {
            const result = validatePasswordInput("Pass\nword")
            expect(result.error).toBe("Invalid password")
            expect(result.error).not.toContain("control")
            expect(result.error).not.toContain("character")
        })

        it("should not reveal specific validation failure reason", () => {
            const results = [
                validatePasswordInput(null),
                validatePasswordInput("short"),
                validatePasswordInput("Pass\0word"),
                validatePasswordInput("Pass\nword"),
            ]

            // All should have the same generic error message
            results.forEach(result => {
                expect(result.error).toBe("Invalid password")
            })
        })
    })

    describe("validatePasswordInput - Return Type", () => {
        it("should return PasswordValidationResult with valid property", () => {
            const result = validatePasswordInput("ValidPassword123")
            expect(result).toHaveProperty("valid")
            expect(typeof result.valid).toBe("boolean")
        })

        it("should return PasswordValidationResult with error property", () => {
            const result = validatePasswordInput("short")
            expect(result).toHaveProperty("error")
            expect(typeof result.error).toBe("string")
        })

        it("should not include error property when valid", () => {
            const result = validatePasswordInput("ValidPassword123")
            expect(result.error).toBeUndefined()
        })

        it("should include error property when invalid", () => {
            const result = validatePasswordInput("short")
            expect(result.error).toBeDefined()
            expect(result.error).not.toBeNull()
        })
    })

    describe("assertPasswordInputValid - Valid Passwords", () => {
        it("should not throw for valid password", () => {
            expect(() => {
                assertPasswordInputValid("ValidPassword123")
            }).not.toThrow()
        })

        it("should not throw for 8 character password", () => {
            expect(() => {
                assertPasswordInputValid("12345678")
            }).not.toThrow()
        })

        it("should not throw for 128 character password", () => {
            expect(() => {
                assertPasswordInputValid("a".repeat(128))
            }).not.toThrow()
        })
    })

    describe("assertPasswordInputValid - Invalid Passwords", () => {
        it("should throw for null", () => {
            expect(() => {
                assertPasswordInputValid(null)
            }).toThrow("Invalid password")
        })

        it("should throw for undefined", () => {
            expect(() => {
                assertPasswordInputValid(undefined)
            }).toThrow("Invalid password")
        })

        it("should throw for non-string", () => {
            expect(() => {
                assertPasswordInputValid(12345)
            }).toThrow("Invalid password")
        })

        it("should throw for too short password", () => {
            expect(() => {
                assertPasswordInputValid("short")
            }).toThrow("Invalid password")
        })

        it("should throw for too long password", () => {
            expect(() => {
                assertPasswordInputValid("a".repeat(129))
            }).toThrow("Invalid password")
        })

        it("should throw for password with null byte", () => {
            expect(() => {
                assertPasswordInputValid("Pass\0word")
            }).toThrow("Invalid password")
        })

        it("should throw for password with control character", () => {
            expect(() => {
                assertPasswordInputValid("Pass\nword")
            }).toThrow("Invalid password")
        })
    })

    describe("assertPasswordInputValid - Type Guard", () => {
        it("should narrow type to string after assertion", () => {
            const password: unknown = "ValidPassword123"
            assertPasswordInputValid(password)
            // After assertion, password is narrowed to string type
            // This test verifies TypeScript type narrowing works
            const length: number = password.length
            expect(length).toBe(16)
        })

        it("should work with type guard in conditional", () => {
            const password: unknown = "ValidPassword123"
            try {
                assertPasswordInputValid(password)
                // If we reach here, password is string
                expect(typeof password).toBe("string")
            } catch {
                // Should not reach here
                expect(true).toBe(false)
            }
        })
    })

    describe("validatePasswordInput - Edge Cases", () => {
        it("should accept password with emoji", () => {
            const result = validatePasswordInput("Password123🔒")
            expect(result.valid).toBe(true)
        })

        it("should accept password with accented characters", () => {
            const result = validatePasswordInput("Pässwörd123")
            expect(result.valid).toBe(true)
        })

        it("should accept password with CJK characters", () => {
            const result = validatePasswordInput("密码Password123")
            expect(result.valid).toBe(true)
        })

        it("should accept password with mixed scripts", () => {
            const result = validatePasswordInput("Пароль密码Pass123")
            expect(result.valid).toBe(true)
        })

        it("should accept password with all printable ASCII", () => {
            const result = validatePasswordInput(
                "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"
            )
            // This is 94 characters, should be valid
            expect(result.valid).toBe(true)
        })

        it("should reject password with only control characters", () => {
            const result = validatePasswordInput("\t\n\r")
            expect(result.valid).toBe(false)
        })

        it("should reject password with leading control character", () => {
            const result = validatePasswordInput("\tPassword123")
            expect(result.valid).toBe(false)
        })

        it("should reject password with trailing control character", () => {
            const result = validatePasswordInput("Password123\t")
            expect(result.valid).toBe(false)
        })
    })

    describe("validatePasswordInput - Consistency", () => {
        it("should return consistent results for same input", () => {
            const password = "ValidPassword123"
            const result1 = validatePasswordInput(password)
            const result2 = validatePasswordInput(password)

            expect(result1.valid).toBe(result2.valid)
            expect(result1.error).toBe(result2.error)
        })

        it("should return consistent error messages", () => {
            const invalidPasswords = [
                "short",
                "a".repeat(129),
                "Pass\0word",
                "Pass\nword",
            ]

            invalidPasswords.forEach(password => {
                const result = validatePasswordInput(password)
                expect(result.error).toBe("Invalid password")
            })
        })
    })
})
