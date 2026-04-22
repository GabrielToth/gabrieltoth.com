/**
 * useAccountCompletion Hook Tests
 *
 * Tests for form state management hook
 *
 * Validates: Requirements 4.10
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAccountCompletion } from "./useAccountCompletion"

describe("useAccountCompletion", () => {
    beforeEach(() => {
        // Clear session storage before each test
        if (typeof window !== "undefined") {
            sessionStorage.clear()
        }
        vi.clearAllMocks()
    })

    describe("Initial state", () => {
        it("should initialize with default values", () => {
            const { result } = renderHook(() => useAccountCompletion())

            expect(result.current.currentStep).toBe(1)
            expect(result.current.prefilledData).toEqual({
                email: "",
                name: "",
                picture: undefined,
            })
            expect(result.current.editedData).toEqual({
                email: "",
                name: "",
            })
            expect(result.current.newFields).toEqual({
                password: "",
                phone: "",
                birthDate: "",
            })
            expect(result.current.errors).toEqual({})
        })
    })

    describe("Step navigation", () => {
        it("should navigate to next step", () => {
            const { result } = renderHook(() => useAccountCompletion())

            act(() => {
                result.current.setCurrentStep(2)
            })

            expect(result.current.currentStep).toBe(2)
        })

        it("should navigate to previous step", () => {
            const { result } = renderHook(() => useAccountCompletion())

            act(() => {
                result.current.setCurrentStep(2)
            })

            act(() => {
                result.current.setCurrentStep(1)
            })

            expect(result.current.currentStep).toBe(1)
        })

        it("should navigate to verification step", () => {
            const { result } = renderHook(() => useAccountCompletion())

            act(() => {
                result.current.setCurrentStep(3)
            })

            expect(result.current.currentStep).toBe(3)
        })
    })

    describe("Field updates", () => {
        it("should update prefilled email field", () => {
            const { result } = renderHook(() => useAccountCompletion())

            act(() => {
                result.current.updatePrefilledField("email", "test@example.com")
            })

            expect(result.current.editedData.email).toBe("test@example.com")
        })

        it("should update prefilled name field", () => {
            const { result } = renderHook(() => useAccountCompletion())

            act(() => {
                result.current.updatePrefilledField("name", "John Doe")
            })

            expect(result.current.editedData.name).toBe("John Doe")
        })

        it("should update password field", () => {
            const { result } = renderHook(() => useAccountCompletion())

            act(() => {
                result.current.updateNewField("password", "SecurePass123!")
            })

            expect(result.current.newFields.password).toBe("SecurePass123!")
        })

        it("should update phone field", () => {
            const { result } = renderHook(() => useAccountCompletion())

            act(() => {
                result.current.updateNewField("phone", "+1234567890")
            })

            expect(result.current.newFields.phone).toBe("+1234567890")
        })

        it("should update birth date field", () => {
            const { result } = renderHook(() => useAccountCompletion())

            act(() => {
                result.current.updateNewField("birthDate", "1990-01-01")
            })

            expect(result.current.newFields.birthDate).toBe("1990-01-01")
        })

        it("should clear errors when field is updated", () => {
            const { result } = renderHook(() => useAccountCompletion())

            // Set an error
            act(() => {
                result.current.validateStep(1)
            })

            expect(Object.keys(result.current.errors).length).toBeGreaterThan(0)

            // Update field should clear error
            act(() => {
                result.current.updatePrefilledField("email", "test@example.com")
            })

            expect(result.current.errors.email).toBe("")
        })
    })

    describe("Validation", () => {
        it("should validate step 1 with valid data", () => {
            const { result } = renderHook(() => useAccountCompletion())

            act(() => {
                result.current.updatePrefilledField("email", "test@example.com")
                result.current.updatePrefilledField("name", "John Doe")
            })

            const isValid = act(() => result.current.validateStep(1))

            expect(result.current.errors.email).toBe("")
            expect(result.current.errors.name).toBe("")
        })

        it("should reject invalid email", () => {
            const { result } = renderHook(() => useAccountCompletion())

            act(() => {
                result.current.updatePrefilledField("email", "invalid-email")
                result.current.updatePrefilledField("name", "John Doe")
            })

            act(() => {
                result.current.validateStep(1)
            })

            expect(result.current.errors.email).toBeTruthy()
        })

        it("should reject short name", () => {
            const { result } = renderHook(() => useAccountCompletion())

            act(() => {
                result.current.updatePrefilledField("email", "test@example.com")
                result.current.updatePrefilledField("name", "J")
            })

            act(() => {
                result.current.validateStep(1)
            })

            expect(result.current.errors.name).toBeTruthy()
        })

        it("should validate step 2 with valid data", () => {
            const { result } = renderHook(() => useAccountCompletion())

            act(() => {
                result.current.updatePrefilledField("email", "test@example.com")
                result.current.updatePrefilledField("name", "John Doe")
                result.current.updateNewField("password", "SecurePass123!")
                result.current.updateNewField("phone", "+1234567890")
                result.current.updateNewField("birthDate", "1990-01-01")
            })

            act(() => {
                result.current.validateStep(2)
            })

            expect(Object.keys(result.current.errors).length).toBe(0)
        })

        it("should reject weak password", () => {
            const { result } = renderHook(() => useAccountCompletion())

            act(() => {
                result.current.updateNewField("password", "weak")
            })

            act(() => {
                result.current.validateStep(2)
            })

            expect(result.current.errors.password).toBeTruthy()
        })

        it("should reject invalid phone", () => {
            const { result } = renderHook(() => useAccountCompletion())

            act(() => {
                result.current.updateNewField("phone", "1234567890")
            })

            act(() => {
                result.current.validateStep(2)
            })

            expect(result.current.errors.phone).toBeTruthy()
        })

        it("should reject invalid birth date", () => {
            const { result } = renderHook(() => useAccountCompletion())

            act(() => {
                result.current.updateNewField("birthDate", "2020-01-01")
            })

            act(() => {
                result.current.validateStep(2)
            })

            expect(result.current.errors.birthDate).toBeTruthy()
        })
    })

    describe("Form submission", () => {
        it("should submit form with valid data", async () => {
            const { result } = renderHook(() => useAccountCompletion())

            // Mock fetch
            global.fetch = vi.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            success: true,
                            redirectUrl: "/dashboard",
                        }),
                })
            )

            act(() => {
                result.current.updatePrefilledField("email", "test@example.com")
                result.current.updatePrefilledField("name", "John Doe")
                result.current.updateNewField("password", "SecurePass123!")
                result.current.updateNewField("phone", "+1234567890")
                result.current.updateNewField("birthDate", "1990-01-01")
            })

            const submitResult = await act(async () => {
                return await result.current.submitForm()
            })

            expect(submitResult.success).toBe(true)
            expect(submitResult.redirectUrl).toBe("/dashboard")
        })

        it("should handle submission error", async () => {
            const { result } = renderHook(() => useAccountCompletion())

            // Mock fetch to return error
            global.fetch = vi.fn(() =>
                Promise.resolve({
                    ok: false,
                    json: () =>
                        Promise.resolve({
                            success: false,
                            error: "Email already registered",
                        }),
                })
            )

            const submitResult = await act(async () => {
                return await result.current.submitForm()
            })

            expect(submitResult.success).toBe(false)
            expect(submitResult.error).toBe("Email already registered")
        })
    })

    describe("Form reset", () => {
        it("should reset form to initial state", () => {
            const { result } = renderHook(() => useAccountCompletion())

            act(() => {
                result.current.updatePrefilledField("email", "test@example.com")
                result.current.updatePrefilledField("name", "John Doe")
                result.current.updateNewField("password", "SecurePass123!")
                result.current.setCurrentStep(2)
            })

            act(() => {
                result.current.resetForm()
            })

            expect(result.current.currentStep).toBe(1)
            expect(result.current.editedData.email).toBe("")
            expect(result.current.editedData.name).toBe("")
            expect(result.current.newFields.password).toBe("")
        })
    })
})
