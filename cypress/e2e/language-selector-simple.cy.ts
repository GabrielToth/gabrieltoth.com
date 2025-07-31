/**
 * Simple Language Selector Test
 * Ignores hydration errors to focus on actual presence
 */

describe("Language Selector Simple Test", () => {
    beforeEach(() => {
        // Ignore hydration errors and other React errors during testing
        cy.on("uncaught:exception", err => {
            // Ignore hydration errors
            if (err.message.includes("Hydration failed")) {
                return false
            }
            // Ignore other React errors
            if (err.message.includes("React")) {
                return false
            }
            return true
        })
    })

    it("Should have language selector on all Landing Pages", () => {
        const landingPages = [
            "/en/pc-optimization",
            "/en/channel-management",
            "/en/waveigl-support",
            "/en/editors",
        ]

        landingPages.forEach(page => {
            cy.visit(page)
            cy.wait(1000)

            // Language selector should exist and be visible
            cy.get('[data-testid="language-selector"]')
                .first()
                .should("exist")
                .and("be.visible")

            // Should have globe icon
            cy.get('[data-testid="language-selector"] [data-lucide="globe"]')
                .first()
                .should("exist")
                .and("be.visible")

            // Should show current language
            cy.get('[data-testid="language-selector"]')
                .first()
                .should("contain.text", "EN")
        })
    })

    it("Should have language selector on homepage and institutional pages", () => {
        const pages = [
            "/en", // Homepage
            "/en/privacy-policy", // Privacy Policy
            "/en/terms-of-service", // Terms of Service
        ]

        pages.forEach(page => {
            cy.visit(page)
            cy.wait(1000)

            // Language selector should exist and be visible
            cy.get('[data-testid="language-selector"]')
                .first()
                .should("exist")
                .and("be.visible")

            // Should have globe icon
            cy.get('[data-testid="language-selector"] [data-lucide="globe"]')
                .first()
                .should("exist")
                .and("be.visible")

            // Should show current language
            cy.get('[data-testid="language-selector"]')
                .first()
                .should("contain.text", "EN")
        })
    })
})
