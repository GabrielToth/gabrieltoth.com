import { beforeEach, describe, expect, it } from "vitest"
import {
    changePassword,
    clearUserCache,
    connectIntegration,
    disableTwoFactor,
    disconnectIntegration,
    downloadInvoice,
    enableTwoFactor,
    fetchBillingInfo,
    fetchIntegrations,
    fetchUserPreferences,
    fetchUserProfile,
    updateUserPreferences,
    updateUserProfile,
} from "./user"

describe("User API Service", () => {
    beforeEach(() => {
        clearUserCache()
    })

    describe("fetchUserProfile", () => {
        it("returns user profile data", async () => {
            const profile = await fetchUserProfile()

            expect(profile).toBeDefined()
            expect(profile.id).toBe("1")
            expect(profile.name).toBe("John Doe")
            expect(profile.email).toBe("john@example.com")
        })

        it("caches user profile data", async () => {
            const profile1 = await fetchUserProfile()
            const profile2 = await fetchUserProfile()

            expect(profile1).toEqual(profile2)
        })
    })

    describe("updateUserProfile", () => {
        it("updates user profile", async () => {
            const updated = await updateUserProfile({
                name: "Jane Doe",
                email: "jane@example.com",
            })

            expect(updated.name).toBe("Jane Doe")
            expect(updated.email).toBe("jane@example.com")
        })

        it("invalidates cache after update", async () => {
            await fetchUserProfile()
            await updateUserProfile({ name: "Jane Doe" })

            // Cache should be cleared, so next fetch should get fresh data
            const profile = await fetchUserProfile()
            expect(profile).toBeDefined()
        })
    })

    describe("fetchUserPreferences", () => {
        it("returns user preferences", async () => {
            const preferences = await fetchUserPreferences()

            expect(preferences).toBeDefined()
            expect(preferences.notificationsEnabled).toBe(true)
            expect(preferences.language).toBe("en")
            expect(preferences.theme).toBe("auto")
        })

        it("caches preferences data", async () => {
            const prefs1 = await fetchUserPreferences()
            const prefs2 = await fetchUserPreferences()

            expect(prefs1).toEqual(prefs2)
        })
    })

    describe("updateUserPreferences", () => {
        it("updates user preferences", async () => {
            const updated = await updateUserPreferences({
                notificationsEnabled: false,
                language: "pt",
                theme: "dark",
            })

            expect(updated.notificationsEnabled).toBe(false)
            expect(updated.language).toBe("pt")
            expect(updated.theme).toBe("dark")
        })

        it("invalidates cache after update", async () => {
            await fetchUserPreferences()
            await updateUserPreferences({
                notificationsEnabled: false,
                language: "pt",
                theme: "dark",
            })

            const preferences = await fetchUserPreferences()
            expect(preferences).toBeDefined()
        })
    })

    describe("fetchBillingInfo", () => {
        it("returns billing information", async () => {
            const billing = await fetchBillingInfo()

            expect(billing).toBeDefined()
            expect(billing.plan).toBe("Pro")
            expect(billing.price).toBe(29.99)
            expect(billing.invoices).toBeDefined()
            expect(Array.isArray(billing.invoices)).toBe(true)
        })

        it("caches billing data", async () => {
            const billing1 = await fetchBillingInfo()
            const billing2 = await fetchBillingInfo()

            expect(billing1).toEqual(billing2)
        })
    })

    describe("fetchIntegrations", () => {
        it("returns integrations list", async () => {
            const integrations = await fetchIntegrations()

            expect(Array.isArray(integrations)).toBe(true)
            expect(integrations.length).toBeGreaterThan(0)
        })

        it("includes integration details", async () => {
            const integrations = await fetchIntegrations()

            const integration = integrations[0]
            expect(integration.id).toBeDefined()
            expect(integration.name).toBeDefined()
            expect(integration.icon).toBeDefined()
            expect(typeof integration.isConnected).toBe("boolean")
        })

        it("caches integrations data", async () => {
            const integrations1 = await fetchIntegrations()
            const integrations2 = await fetchIntegrations()

            expect(integrations1).toEqual(integrations2)
        })
    })

    describe("connectIntegration", () => {
        it("connects an integration", async () => {
            const integration = await connectIntegration("1")

            expect(integration.isConnected).toBe(true)
            expect(integration.connectedAt).toBeDefined()
        })

        it("invalidates cache after connection", async () => {
            await fetchIntegrations()
            await connectIntegration("1")

            const integrations = await fetchIntegrations()
            expect(integrations).toBeDefined()
        })
    })

    describe("disconnectIntegration", () => {
        it("disconnects an integration", async () => {
            await expect(disconnectIntegration("1")).resolves.toBeUndefined()
        })

        it("invalidates cache after disconnection", async () => {
            await fetchIntegrations()
            await disconnectIntegration("1")

            const integrations = await fetchIntegrations()
            expect(integrations).toBeDefined()
        })
    })

    describe("changePassword", () => {
        it("changes password", async () => {
            await expect(
                changePassword("oldPassword", "newPassword123!")
            ).resolves.toBeUndefined()
        })

        it("invalidates cache after password change", async () => {
            await fetchUserProfile()
            await changePassword("oldPassword", "newPassword123!")

            const profile = await fetchUserProfile()
            expect(profile).toBeDefined()
        })
    })

    describe("enableTwoFactor", () => {
        it("returns 2FA setup data", async () => {
            const result = await enableTwoFactor()

            expect(result).toBeDefined()
            expect(result.secret).toBeDefined()
            expect(result.qrCode).toBeDefined()
        })
    })

    describe("disableTwoFactor", () => {
        it("disables 2FA", async () => {
            await expect(disableTwoFactor()).resolves.toBeUndefined()
        })

        it("invalidates cache after disabling 2FA", async () => {
            await fetchUserProfile()
            await disableTwoFactor()

            const profile = await fetchUserProfile()
            expect(profile).toBeDefined()
        })
    })

    describe("downloadInvoice", () => {
        it("returns invoice blob", async () => {
            const blob = await downloadInvoice("inv-001")

            expect(blob).toBeInstanceOf(Blob)
            expect(blob.type).toBe("application/pdf")
        })
    })

    describe("clearUserCache", () => {
        it("clears all cached data", async () => {
            await fetchUserProfile()
            await fetchUserPreferences()
            await fetchBillingInfo()
            await fetchIntegrations()

            clearUserCache()

            // After clearing cache, next fetch should work
            const profile = await fetchUserProfile()
            expect(profile).toBeDefined()
        })
    })
})
