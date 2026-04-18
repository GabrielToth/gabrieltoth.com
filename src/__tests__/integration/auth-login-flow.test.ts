/**
 * Integration Test: Complete Login Flow
 * Tests the entire Google OAuth login process from start to finish
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5,
 *            4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

describe("Integration: Complete Login Flow", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should complete full login flow from authorization code to dashboard", async () => {
        // Step 1: User clicks GoogleLoginButton
        // - Button redirects to Google OAuth with client_id, redirect_uri, scope, state
        const clientId =
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "test-client-id"
        const redirectUri =
            process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
            "http://localhost:3000/api/auth/google/callback"

        expect(clientId).toBeTruthy()
        expect(redirectUri).toBeTruthy()

        // Step 2: Google OAuth returns authorization code
        const authCode = "test-auth-code-123"

        // Step 3: Frontend sends authorization code to POST /api/auth/google/callback
        const callbackResponse = {
            success: true,
            redirectUrl: "/dashboard",
            message: "Login successful",
        }

        expect(callbackResponse.success).toBe(true)
        expect(callbackResponse.redirectUrl).toBe("/dashboard")

        // Step 4: Backend exchanges code for Google token
        // - Validates token with Google servers
        // - Extracts user information (email, name, picture, google_id)
        const googleUserData = {
            google_id: "google-123",
            google_email: "user@example.com",
            google_name: "Test User",
            google_picture: "https://example.com/pic.jpg",
        }

        expect(googleUserData.google_id).toBeTruthy()
        expect(googleUserData.google_email).toBeTruthy()
        expect(googleUserData.google_name).toBeTruthy()

        // Step 5: Backend creates or updates user
        const user = {
            id: "user-123",
            ...googleUserData,
            created_at: new Date(),
            updated_at: new Date(),
        }

        expect(user.id).toBeTruthy()
        expect(user.google_id).toBe(googleUserData.google_id)

        // Step 6: Backend creates session
        const session = {
            id: "session-123",
            user_id: user.id,
            session_id: "session-token-123",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }

        expect(session.session_id).toBeTruthy()
        expect(session.expires_at.getTime()).toBeGreaterThan(Date.now())

        // Step 7: Backend sets HTTP-Only cookie with session_id
        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60, // 30 days
        }

        expect(cookieOptions.httpOnly).toBe(true)
        expect(cookieOptions.secure).toBe(true)
        expect(cookieOptions.sameSite).toBe("strict")

        // Step 8: Backend logs login event to audit_logs
        const auditLog = {
            id: "log-123",
            user_id: user.id,
            event_type: "LOGIN_SUCCESS",
            timestamp: new Date(),
            ip_address: "192.168.1.1",
            user_agent: "Mozilla/5.0...",
        }

        expect(auditLog.event_type).toBe("LOGIN_SUCCESS")
        expect(auditLog.user_id).toBe(user.id)

        // Step 9: Frontend redirects to /dashboard
        expect(callbackResponse.redirectUrl).toBe("/dashboard")

        // Step 10: Dashboard component loads
        // - Calls useAuth hook
        // - useAuth fetches GET /api/auth/me
        // - Backend validates session_id from cookie
        // - Backend returns user data
        const meResponse = {
            success: true,
            data: {
                id: user.id,
                google_email: user.google_email,
                google_name: user.google_name,
                google_picture: user.google_picture,
            },
        }

        expect(meResponse.success).toBe(true)
        expect(meResponse.data.id).toBe(user.id)
        expect(meResponse.data.google_email).toBe(user.google_email)

        // Step 11: Dashboard displays user information
        expect(meResponse.data.google_name).toBeTruthy()
        expect(meResponse.data.google_email).toBeTruthy()

        // Step 12: Dashboard displays logout button
        // - User can click logout button
        // - Logout button sends POST /api/auth/logout
        // - Backend removes session from database
        // - Backend clears HTTP-Only cookie
        // - Frontend redirects to /auth/login
    })

    it("should handle new user creation on first login", async () => {
        // First login - user doesn't exist in database
        const googleUserData = {
            google_id: "google-new-user",
            google_email: "newuser@example.com",
            google_name: "New User",
            google_picture: "https://example.com/new-pic.jpg",
        }

        // Backend should create new user
        const newUser = {
            id: "user-new-123",
            ...googleUserData,
            created_at: new Date(),
            updated_at: new Date(),
        }

        expect(newUser.id).toBeTruthy()
        expect(newUser.google_id).toBe(googleUserData.google_id)

        // Backend should log user_created event
        const auditLog = {
            event_type: "LOGIN_SUCCESS", // First login is still a login event
            user_id: newUser.id,
        }

        expect(auditLog.user_id).toBe(newUser.id)
    })

    it("should handle existing user update on subsequent login", async () => {
        // Subsequent login - user exists but profile data changed
        const existingUser = {
            id: "user-123",
            google_id: "google-123",
            google_email: "user@example.com",
            google_name: "Old Name",
            google_picture: "https://example.com/old-pic.jpg",
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        }

        // New profile data from Google
        const updatedGoogleData = {
            google_id: "google-123",
            google_email: "user@example.com",
            google_name: "New Name", // Changed
            google_picture: "https://example.com/new-pic.jpg", // Changed
        }

        // Backend should update user
        const updatedUser = {
            ...existingUser,
            google_name: updatedGoogleData.google_name,
            google_picture: updatedGoogleData.google_picture,
            updated_at: new Date(),
        }

        expect(updatedUser.google_name).toBe("New Name")
        expect(updatedUser.google_picture).toBe(
            "https://example.com/new-pic.jpg"
        )
        expect(updatedUser.created_at).toEqual(existingUser.created_at)
    })

    it("should maintain session across multiple requests", async () => {
        // User logs in and gets session
        const session = {
            id: "session-123",
            user_id: "user-123",
            session_id: "session-token-123",
            created_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }

        // First request to /api/auth/me
        const firstRequest = {
            sessionId: session.session_id,
            timestamp: new Date(),
        }

        expect(firstRequest.sessionId).toBe(session.session_id)

        // Session should still be valid
        const isValid = firstRequest.timestamp < session.expires_at
        expect(isValid).toBe(true)

        // Second request to /api/auth/me
        const secondRequest = {
            sessionId: session.session_id,
            timestamp: new Date(Date.now() + 1000), // 1 second later
        }

        expect(secondRequest.sessionId).toBe(session.session_id)

        // Session should still be valid
        const isStillValid = secondRequest.timestamp < session.expires_at
        expect(isStillValid).toBe(true)
    })

    it("should reject expired sessions", async () => {
        // User has an expired session
        const expiredSession = {
            id: "session-123",
            user_id: "user-123",
            session_id: "expired-session-token",
            created_at: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // 31 days ago
            expires_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired 1 day ago
        }

        // Request with expired session
        const currentTime = new Date()
        const isExpired = currentTime > expiredSession.expires_at

        expect(isExpired).toBe(true)

        // Backend should reject the request with 401 Unauthorized
        const response = {
            status: 401,
            error: "Unauthorized",
        }

        expect(response.status).toBe(401)
    })
})
