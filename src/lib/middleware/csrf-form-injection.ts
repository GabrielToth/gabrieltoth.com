/**
 * CSRF Form Injection Utilities
 * Utilities for injecting CSRF tokens into form responses
 *
 * Requirements: 6.1, 6.4
 */

import { NextRequest, NextResponse } from "next/server"
import {
    addCsrfTokenToResponse,
    getOrGenerateCsrfToken,
} from "./api-csrf-middleware"

/**
 * Interface for form data with CSRF token
 */
export interface FormDataWithCsrf<T = Record<string, unknown>> {
    csrfToken: string
    data?: T
}

/**
 * Inject CSRF token into form response data
 * This utility generates or retrieves a CSRF token and includes it in the response
 *
 * @param request - The incoming Next.js request
 * @param formData - Optional additional form data to include in response
 * @returns Response with CSRF token in body and header, or error response
 *
 * @example
 * // In a GET endpoint that serves form data
 * export async function GET(request: NextRequest) {
 *   return injectCsrfIntoFormResponse(request, {
 *     email: "user@example.com",
 *     name: "John Doe"
 *   })
 * }
 */
export function injectCsrfIntoFormResponse<T = Record<string, unknown>>(
    request: NextRequest,
    formData?: T
): NextResponse {
    // Get or generate CSRF token for the session
    const csrfToken = getOrGenerateCsrfToken(request)

    if (!csrfToken) {
        return NextResponse.json(
            {
                success: false,
                error: "No active session. Please log in first.",
            },
            { status: 401 }
        )
    }

    // Create response with CSRF token and optional form data
    const responseData: FormDataWithCsrf<T> = {
        csrfToken,
        ...(formData && { data: formData }),
    }

    const response = NextResponse.json({
        success: true,
        ...responseData,
    })

    // Add CSRF token to response header for API clients
    return addCsrfTokenToResponse(response, csrfToken)
}

/**
 * Create a form response with CSRF token for registration forms
 * Convenience wrapper for registration-specific form data
 *
 * @param request - The incoming Next.js request
 * @returns Response with CSRF token for registration form
 *
 * @example
 * // GET /api/auth/register
 * export async function GET(request: NextRequest) {
 *   return createRegistrationFormResponse(request)
 * }
 */
export function createRegistrationFormResponse(
    request: NextRequest
): NextResponse {
    return injectCsrfIntoFormResponse(request)
}

/**
 * Create a form response with CSRF token for login forms
 * Convenience wrapper for login-specific form data
 *
 * @param request - The incoming Next.js request
 * @returns Response with CSRF token for login form
 *
 * @example
 * // GET /api/auth/login
 * export async function GET(request: NextRequest) {
 *   return createLoginFormResponse(request)
 * }
 */
export function createLoginFormResponse(request: NextRequest): NextResponse {
    return injectCsrfIntoFormResponse(request)
}

/**
 * Create a form response with CSRF token for password reset forms
 * Convenience wrapper for password reset-specific form data
 *
 * @param request - The incoming Next.js request
 * @param resetToken - Optional password reset token to include
 * @returns Response with CSRF token for password reset form
 *
 * @example
 * // GET /api/auth/reset-password?token=abc123
 * export async function GET(request: NextRequest) {
 *   const resetToken = request.nextUrl.searchParams.get("token")
 *   return createPasswordResetFormResponse(request, resetToken || undefined)
 * }
 */
export function createPasswordResetFormResponse(
    request: NextRequest,
    resetToken?: string
): NextResponse {
    return injectCsrfIntoFormResponse(
        request,
        resetToken ? { resetToken } : undefined
    )
}

/**
 * Create a form response with CSRF token for forgot password forms
 * Convenience wrapper for forgot password-specific form data
 *
 * @param request - The incoming Next.js request
 * @returns Response with CSRF token for forgot password form
 *
 * @example
 * // GET /api/auth/forgot-password
 * export async function GET(request: NextRequest) {
 *   return createForgotPasswordFormResponse(request)
 * }
 */
export function createForgotPasswordFormResponse(
    request: NextRequest
): NextResponse {
    return injectCsrfIntoFormResponse(request)
}

/**
 * Extract CSRF token from form data object
 * Utility to help with form data that includes CSRF token
 *
 * @param formData - Form data object that may contain csrfToken
 * @returns Object with csrfToken and remaining data
 *
 * @example
 * const body = await request.json()
 * const { csrfToken, data } = extractCsrfFromFormData(body)
 */
export function extractCsrfFromFormData<T extends Record<string, unknown>>(
    formData: T & { csrfToken?: string }
): { csrfToken: string | undefined; data: Omit<T, "csrfToken"> } {
    const { csrfToken, ...data } = formData
    return {
        csrfToken,
        data: data as Omit<T, "csrfToken">,
    }
}
