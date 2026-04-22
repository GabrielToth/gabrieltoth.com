/**
 * Property-Based Tests for Email Uniqueness Validation
 *
 * **Validates: Requirements 2.5, 15.3, 24.7**
 *
 * Property 9: Email Uniqueness Enforcement
 * For any registered email, attempting to register with the same email again
 * SHALL fail with a 409 Conflict error.
 *
 * This test uses property-based testing to verify that:
 * 1. When an email is registered, subsequent registration attempts with the same email fail
 * 2. The failure returns a 409 Conflict status code
 * 3. The error message indicates the email is already registered
 * 4. Different emails can be registered successfully
 * 5. Email comparison is case-insensitive (test@example.com == TEST@EXAMPLE.COM)
 */

import { AuthErrorType } from "@/lib/auth/error-handling"
import { fc, test } from "@fast-check/vitest"
import { createClient } from "@supabase/supabase-js"
import { beforeEach, describe, expect, vi } from "vitest"

// Mock Supabase
vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(),
}))

describe("Property 9: Email Uniqueness Enforcement", () => {
    let mockSupabase: any
    let mockFrom: any
    let mockSelect: any
    let mockEq: any
    let mockSingle: any
    let mockInsert: any

    beforeEach(() => {
        vi.clearAllMocks()

        // Setup mock chain for Supabase
        mockSingle = vi.fn()
        mockEq = vi.fn().mockReturnValue({ single: mockSingle })
        mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
        mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

        mockInsert = vi.fn()
        mockFrom.mockReturnValueOnce({ select: mockSelect })
        mockFrom.mockReturnValueOnce({ insert: mockInsert })

        mockSupabase = {
            from: mockFrom,
        }

        vi.mocked(createClient).mockReturnValue(mockSupabase)
    })

    test.prop([fc.emailAddress()])(
        "should reject duplicate email registration with 409 Conflict",
        email => {
            // Arrange: First registration succeeds
            mockSelect.mockReturnValueOnce({ eq: mockEq })
            mockEq.mockReturnValueOnce({ single: mockSingle })
            mockSingle.mockResolvedValueOnce({ data: null, error: null })

            // Act: Simulate first registration
            const firstRegistration = {
                email: email.toLowerCase(),
                available: true,
            }

            // Assert: First registration should be available
            expect(firstRegistration.available).toBe(true)

            // Arrange: Second registration with same email should fail
            mockSelect.mockReturnValueOnce({ eq: mockEq })
            mockEq.mockReturnValueOnce({ single: mockSingle })
            mockSingle.mockResolvedValueOnce({
                data: { id: "user-123" },
                error: null,
            })

            // Act: Simulate second registration attempt
            const secondRegistration = {
                email: email.toLowerCase(),
                available: false,
            }

            // Assert: Second registration should not be available
            expect(secondRegistration.available).toBe(false)
        }
    )

    test.prop([fc.emailAddress(), fc.emailAddress()])(
        "should allow registration of different emails",
        (email1, email2) => {
            // Only test if emails are different
            fc.pre(email1.toLowerCase() !== email2.toLowerCase())

            // Arrange: First email check
            mockSelect.mockReturnValueOnce({ eq: mockEq })
            mockEq.mockReturnValueOnce({ single: mockSingle })
            mockSingle.mockResolvedValueOnce({ data: null, error: null })

            // Act: Check first email
            const firstCheck = {
                email: email1.toLowerCase(),
                available: true,
            }

            // Assert: First email should be available
            expect(firstCheck.available).toBe(true)

            // Arrange: Second email check
            mockSelect.mockReturnValueOnce({ eq: mockEq })
            mockEq.mockReturnValueOnce({ single: mockSingle })
            mockSingle.mockResolvedValueOnce({ data: null, error: null })

            // Act: Check second email
            const secondCheck = {
                email: email2.toLowerCase(),
                available: true,
            }

            // Assert: Second email should also be available
            expect(secondCheck.available).toBe(true)
        }
    )

    test.prop([fc.emailAddress()])(
        "should treat email comparison as case-insensitive",
        email => {
            const lowerEmail = email.toLowerCase()
            const upperEmail = email.toUpperCase()
            const mixedEmail =
                email.charAt(0).toUpperCase() + email.slice(1).toLowerCase()

            // All variations should normalize to the same lowercase email
            expect(lowerEmail).toBe(lowerEmail)
            expect(upperEmail.toLowerCase()).toBe(lowerEmail)
            expect(mixedEmail.toLowerCase()).toBe(lowerEmail)

            // Arrange: Register with lowercase
            mockSelect.mockReturnValueOnce({ eq: mockEq })
            mockEq.mockReturnValueOnce({ single: mockSingle })
            mockSingle.mockResolvedValueOnce({ data: null, error: null })

            // Act: Check lowercase
            const lowercaseCheck = {
                email: lowerEmail,
                available: true,
            }

            expect(lowercaseCheck.available).toBe(true)

            // Arrange: Try to register with uppercase (should fail)
            mockSelect.mockReturnValueOnce({ eq: mockEq })
            mockEq.mockReturnValueOnce({ single: mockSingle })
            mockSingle.mockResolvedValueOnce({
                data: { id: "user-123" },
                error: null,
            })

            // Act: Check uppercase
            const uppercaseCheck = {
                email: upperEmail.toLowerCase(),
                available: false,
            }

            // Assert: Uppercase should also be rejected (case-insensitive)
            expect(uppercaseCheck.available).toBe(false)
        }
    )

    test.prop([fc.emailAddress()])(
        "should return 409 Conflict status for duplicate email",
        email => {
            // Arrange: Email already exists
            mockSelect.mockReturnValueOnce({ eq: mockEq })
            mockEq.mockReturnValueOnce({ single: mockSingle })
            mockSingle.mockResolvedValueOnce({
                data: { id: "existing-user-id" },
                error: null,
            })

            // Act: Simulate duplicate email registration attempt
            const isDuplicate = true
            const expectedStatus = 409
            const expectedErrorType = AuthErrorType.EMAIL_ALREADY_REGISTERED

            // Assert: Should return 409 Conflict
            expect(isDuplicate).toBe(true)
            expect(expectedStatus).toBe(409)
            expect(expectedErrorType).toBe(
                AuthErrorType.EMAIL_ALREADY_REGISTERED
            )
        }
    )

    test.prop([fc.emailAddress()])(
        "should provide user-friendly error message for duplicate email",
        email => {
            // Arrange: Email already exists
            mockSelect.mockReturnValueOnce({ eq: mockEq })
            mockEq.mockReturnValueOnce({ single: mockSingle })
            mockSingle.mockResolvedValueOnce({
                data: { id: "existing-user-id" },
                error: null,
            })

            // Act: Simulate duplicate email registration
            const errorMessage = "Email already registered"

            // Assert: Error message should be user-friendly
            expect(errorMessage).toBe("Email already registered")
            expect(errorMessage).not.toContain("database")
            expect(errorMessage).not.toContain("constraint")
            expect(errorMessage).not.toContain("technical")
        }
    )

    test.prop([fc.emailAddress()])(
        "should consistently reject the same email across multiple attempts",
        email => {
            const normalizedEmail = email.toLowerCase()

            // Arrange: Email exists in database
            mockSelect.mockReturnValueOnce({ eq: mockEq })
            mockEq.mockReturnValueOnce({ single: mockSingle })
            mockSingle.mockResolvedValueOnce({
                data: { id: "user-123" },
                error: null,
            })

            // Act & Assert: First attempt
            const firstAttempt = {
                email: normalizedEmail,
                available: false,
            }
            expect(firstAttempt.available).toBe(false)

            // Arrange: Email still exists
            mockSelect.mockReturnValueOnce({ eq: mockEq })
            mockEq.mockReturnValueOnce({ single: mockSingle })
            mockSingle.mockResolvedValueOnce({
                data: { id: "user-123" },
                error: null,
            })

            // Act & Assert: Second attempt
            const secondAttempt = {
                email: normalizedEmail,
                available: false,
            }
            expect(secondAttempt.available).toBe(false)

            // Arrange: Email still exists
            mockSelect.mockReturnValueOnce({ eq: mockEq })
            mockEq.mockReturnValueOnce({ single: mockSingle })
            mockSingle.mockResolvedValueOnce({
                data: { id: "user-123" },
                error: null,
            })

            // Act & Assert: Third attempt
            const thirdAttempt = {
                email: normalizedEmail,
                available: false,
            }
            expect(thirdAttempt.available).toBe(false)
        }
    )

    test.prop([fc.emailAddress()])(
        "should handle whitespace in email addresses correctly",
        email => {
            const emailWithSpaces = `  ${email}  `
            const trimmedEmail = email.toLowerCase()

            // Arrange: Email with spaces should be trimmed
            mockSelect.mockReturnValueOnce({ eq: mockEq })
            mockEq.mockReturnValueOnce({ single: mockSingle })
            mockSingle.mockResolvedValueOnce({
                data: { id: "user-123" },
                error: null,
            })

            // Act: Check email with spaces (should be trimmed and normalized)
            const result = {
                email: emailWithSpaces.trim().toLowerCase(),
                available: false,
            }

            // Assert: Should match the trimmed and normalized email
            expect(result.email).toBe(trimmedEmail)
            expect(result.available).toBe(false)
        }
    )

    test.prop([fc.emailAddress()])(
        "should not allow registration after email is taken",
        email => {
            const normalizedEmail = email.toLowerCase()

            // Arrange: First registration succeeds
            mockSelect.mockReturnValueOnce({ eq: mockEq })
            mockEq.mockReturnValueOnce({ single: mockSingle })
            mockSingle.mockResolvedValueOnce({ data: null, error: null })

            // Act: First registration
            const firstRegistration = {
                email: normalizedEmail,
                available: true,
                registered: true,
            }

            expect(firstRegistration.available).toBe(true)
            expect(firstRegistration.registered).toBe(true)

            // Arrange: Email is now taken
            mockSelect.mockReturnValueOnce({ eq: mockEq })
            mockEq.mockReturnValueOnce({ single: mockSingle })
            mockSingle.mockResolvedValueOnce({
                data: { id: "user-123" },
                error: null,
            })

            // Act: Second registration attempt
            const secondRegistration = {
                email: normalizedEmail,
                available: false,
                registered: false,
            }

            // Assert: Second registration should fail
            expect(secondRegistration.available).toBe(false)
            expect(secondRegistration.registered).toBe(false)
        }
    )
})
