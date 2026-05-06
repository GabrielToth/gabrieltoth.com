/**
 * Unified Authentication Module
 * Handles unified sign-in/sign-up flow with automatic user detection
 */

import { createClient } from "@/lib/supabase/client"

export interface UnifiedAuthResult {
    success: boolean
    userExists: boolean
    userId?: string
    email?: string
    error?: string
}

/**
 * Check if user exists by email
 */
export async function checkUserExists(
    email: string
): Promise<UnifiedAuthResult> {
    try {
        const supabase = createClient()

        // Use the REST API to check if user exists
        // This is more reliable than trying to sign in
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        )

        if (!response.ok) {
            // Fallback: try to sign in with dummy password
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password: "dummy-password-for-check",
            })

            if (error?.message.includes("Invalid login credentials")) {
                return {
                    success: true,
                    userExists: true,
                    email,
                }
            }

            return {
                success: true,
                userExists: false,
                email,
            }
        }

        const data = await response.json()
        const userExists = Array.isArray(data) && data.length > 0

        return {
            success: true,
            userExists,
            email,
        }
    } catch (err) {
        // Fallback: try to sign in with dummy password
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password: "dummy-password-for-check",
            })

            if (error?.message.includes("Invalid login credentials")) {
                return {
                    success: true,
                    userExists: true,
                    email,
                }
            }

            return {
                success: true,
                userExists: false,
                email,
            }
        } catch (fallbackErr) {
            return {
                success: false,
                userExists: false,
                error:
                    fallbackErr instanceof Error
                        ? fallbackErr.message
                        : "Unknown error",
            }
        }
    }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
    email: string,
    password: string
): Promise<UnifiedAuthResult> {
    try {
        const supabase = createClient()

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return {
                success: false,
                userExists: false,
                error: error.message,
            }
        }

        return {
            success: true,
            userExists: true,
            userId: data.user?.id,
            email: data.user?.email,
        }
    } catch (err) {
        return {
            success: false,
            userExists: false,
            error: err instanceof Error ? err.message : "Unknown error",
        }
    }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
    email: string,
    password: string,
    metadata?: Record<string, unknown>
): Promise<UnifiedAuthResult> {
    try {
        const supabase = createClient()

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            },
        })

        if (error) {
            return {
                success: false,
                userExists: false,
                error: error.message,
            }
        }

        return {
            success: true,
            userExists: false,
            userId: data.user?.id,
            email: data.user?.email,
        }
    } catch (err) {
        return {
            success: false,
            userExists: false,
            error: err instanceof Error ? err.message : "Unknown error",
        }
    }
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithOAuth(
    provider: "google" | "github"
): Promise<void> {
    try {
        const supabase = createClient()

        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            throw new Error(error.message)
        }
    } catch (err) {
        throw err instanceof Error ? err : new Error("OAuth sign-in failed")
    }
}

/**
 * Sign in with SSO (Single Sign-On)
 * Requires SSO domain configuration in Supabase
 */
export async function signInWithSSO(email: string): Promise<void> {
    try {
        const supabase = createClient()

        // Extract domain from email
        const domain = email.split("@")[1]

        const { error } = await supabase.auth.signInWithSSO({
            domain,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            throw new Error(error.message)
        }
    } catch (err) {
        throw err instanceof Error ? err : new Error("SSO sign-in failed")
    }
}
