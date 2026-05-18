/**
 * Property-Based Tests for User Manager
 * Tests universal properties of user data persistence
 *
 * Feature: oauth-password-requirement
 * **Validates: Requirements 2.5, 3.6**
 */

import {
    createOAuthUser,
    getUserByEmail,
    getUserByOAuthId,
} from "@/lib/auth/user"
import { OAuthUser } from "@/types/auth"
import fc from "fast-check"
import { beforeEach, describe, expect, it, vi } from "vitest"

const usersByEmail = new Map<string, OAuthUser>()
const usersByOAuthKey = new Map<string, OAuthUser>()

function oauthKey(provider: string, id: string) {
    return `${provider}:${id}`
}

vi.mock("@/lib/db", () => ({
    db: {
        queryOne: vi.fn(async (sql: string, params?: unknown[]) => {
            if (sql.includes("INSERT INTO users")) {
                const [
                    email,
                    password_hash,
                    oauth_provider,
                    oauth_id,
                    name,
                    picture,
                    email_verified,
                ] = params as [
                    string,
                    string,
                    string,
                    string,
                    string,
                    string | null,
                    boolean,
                ]

                const user: OAuthUser = {
                    id: `user-${usersByEmail.size + 1}`,
                    email,
                    password_hash,
                    oauth_provider,
                    oauth_id,
                    name,
                    picture,
                    email_verified,
                    created_at: new Date(),
                    updated_at: new Date(),
                }

                usersByEmail.set(email, user)
                usersByOAuthKey.set(oauthKey(oauth_provider, oauth_id), user)
                return user
            }

            if (sql.includes("WHERE email =")) {
                return usersByEmail.get(params?.[0] as string) ?? null
            }

            if (sql.includes("oauth_provider =") && sql.includes("oauth_id =")) {
                const [provider, id] = params as [string, string]
                return usersByOAuthKey.get(oauthKey(provider, id)) ?? null
            }

            return null
        }),
        query: vi.fn(async (sql: string, params?: unknown[]) => {
            if (sql.includes("DELETE FROM users WHERE email")) {
                const email = params?.[0] as string
                const user = usersByEmail.get(email)
                if (user) {
                    usersByEmail.delete(email)
                    usersByOAuthKey.delete(
                        oauthKey(user.oauth_provider, user.oauth_id)
                    )
                }
            }
        }),
    },
}))

vi.mock("@/lib/logger", () => ({
    logger: {
        debug: vi.fn(),
        error: vi.fn(),
    },
}))

describe("Property 3: User Data Persistence", () => {
    beforeEach(() => {
        usersByEmail.clear()
        usersByOAuthKey.clear()
        vi.clearAllMocks()
    })

    it("should persist and retrieve all user fields correctly", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    email: fc.emailAddress(),
                    password_hash: fc
                        .string({ minLength: 60, maxLength: 60 })
                        .map(s => `$2b$12$${s}`),
                    oauth_provider: fc.constantFrom(
                        "google",
                        "facebook",
                        "tiktok"
                    ),
                    oauth_id: fc.uuid(),
                    name: fc.string({ minLength: 1, maxLength: 255 }),
                    picture: fc.option(fc.webUrl(), { nil: undefined }),
                }),
                async userData => {
                    const createdUser = await createOAuthUser(userData)

                    expect(createdUser).toBeDefined()
                    expect(createdUser.id).toBeDefined()
                    expect(createdUser.email).toBe(userData.email)
                    expect(createdUser.password_hash).toBe(
                        userData.password_hash
                    )
                    expect(createdUser.oauth_provider).toBe(
                        userData.oauth_provider
                    )
                    expect(createdUser.oauth_id).toBe(userData.oauth_id)
                    expect(createdUser.name).toBe(userData.name)
                    expect(createdUser.picture).toBe(userData.picture || null)
                    expect(createdUser.email_verified).toBe(
                        userData.oauth_provider === "google"
                    )
                    expect(createdUser.created_at).toBeInstanceOf(Date)
                    expect(createdUser.updated_at).toBeInstanceOf(Date)

                    const retrievedByEmail = await getUserByEmail(
                        userData.email
                    )

                    expect(retrievedByEmail).toBeDefined()
                    expect(retrievedByEmail?.id).toBe(createdUser.id)
                    expect(retrievedByEmail?.email).toBe(createdUser.email)

                    const retrievedByOAuth = await getUserByOAuthId(
                        userData.oauth_provider,
                        userData.oauth_id
                    )

                    expect(retrievedByOAuth).toBeDefined()
                    expect(retrievedByOAuth?.id).toBe(createdUser.id)
                }
            ),
            { numRuns: 10 }
        )
    })

    it("should return null for non-existent users", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.emailAddress(),
                fc.uuid(),
                async (email, oauthId) => {
                    const userByEmail = await getUserByEmail(email)
                    const userByOAuth = await getUserByOAuthId(
                        "google",
                        oauthId
                    )

                    if (userByEmail === null) {
                        expect(userByEmail).toBeNull()
                    }
                    if (userByOAuth === null) {
                        expect(userByOAuth).toBeNull()
                    }
                }
            ),
            { numRuns: 10 }
        )
    })

    it("should handle missing optional fields gracefully", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    email: fc.emailAddress(),
                    password_hash: fc
                        .string({ minLength: 60, maxLength: 60 })
                        .map(s => `$2b$12$${s}`),
                    oauth_provider: fc.constantFrom(
                        "google",
                        "facebook",
                        "tiktok"
                    ),
                    oauth_id: fc.uuid(),
                    name: fc.string({ minLength: 1, maxLength: 255 }),
                }),
                async userData => {
                    const createdUser = await createOAuthUser(userData)

                    expect(createdUser).toBeDefined()
                    expect(createdUser.picture).toBeNull()

                    const retrieved = await getUserByEmail(userData.email)
                    expect(retrieved?.picture).toBeNull()
                }
            ),
            { numRuns: 10 }
        )
    })
})
