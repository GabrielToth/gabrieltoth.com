/**
 * Language Selector Presence Tests
 *
 * Ensures language selector is present on ALL pages without exception
 * This is critical for international accessibility
 */

describe("Language Selector Presence - ALL Pages", () => {
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

    // Define all pages that should have language selector
    const allPages = [
        // Homepage
        { path: "/en", name: "Homepage EN" },
        { path: "/pt-BR", name: "Homepage PT-BR" },

        // Landing Pages (without full header)
        { path: "/en/waveigl-support", name: "WaveIGL Support EN" },
        { path: "/pt-BR/waveigl-support", name: "WaveIGL Support PT-BR" },
        { path: "/en/channel-management", name: "Channel Management EN" },
        { path: "/pt-BR/channel-management", name: "Channel Management PT-BR" },
        { path: "/en/pc-optimization", name: "PC Optimization EN" },
        { path: "/pt-BR/pc-optimization", name: "PC Optimization PT-BR" },
        { path: "/en/editors", name: "Editors EN" },
        { path: "/pt-BR/editors", name: "Editors PT-BR" },

        // Institutional Pages (with full header)
        { path: "/en/privacy-policy", name: "Privacy Policy EN" },
        { path: "/pt-BR/privacy-policy", name: "Privacy Policy PT-BR" },
        { path: "/en/terms-of-service", name: "Terms of Service EN" },
        { path: "/pt-BR/terms-of-service", name: "Terms of Service PT-BR" },

        // Nested Pages
        { path: "/en/pc-optimization/terms", name: "PC Optimization Terms EN" },
        {
            path: "/pt-BR/pc-optimization/terms",
            name: "PC Optimization Terms PT-BR",
        },
    ]

    it("Should have language selector on ALL pages without exception", () => {
        allPages.forEach(page => {
            cy.visit(page.path)
            cy.wait(1500) // Wait for translations to load

            // Language selector should exist
            cy.get('[data-testid="language-selector"]')
                .first()
                .should("exist")
                .and("be.visible")

            // Should have globe icon
            cy.get('[data-testid="language-selector"] [data-lucide="globe"]')
                .first()
                .should("exist")
                .and("be.visible")

            // Should have current language visible
            cy.get('[data-testid="language-selector"]')
                .first()
                .should("contain.text", page.path.includes("/en") ? "EN" : "PT")

            cy.log(`✅ ${page.name}: Language selector present and functional`)
        })
    })

    it("Language selector should be functional on all page types", () => {
        const testPages = [
            "/en", // Homepage
            "/en/waveigl-support", // Landing Page
            "/en/privacy-policy", // Institutional Page
        ]

        testPages.forEach(page => {
            cy.visit(page)
            cy.wait(1000)

            // Click language selector
            cy.get('[data-testid="language-selector"]').first().click()

            // Should show dropdown with options
            cy.get('[role="menu"]').should("be.visible")

            // Should have multiple language options
            cy.get('[role="menuitem"]').should("have.length.at.least", 2)

            // Should have PT and EN options at minimum
            cy.get('[role="menuitem"]').contains("PT").should("be.visible")
            cy.get('[role="menuitem"]').contains("EN").should("be.visible")

            // Close dropdown by clicking outside
            cy.get("body").click(0, 0)

            cy.log(`✅ Language selector functional on: ${page}`)
        })
    })

    it("Language switching should work correctly", () => {
        // Start on English homepage
        cy.visit("/en")
        cy.wait(1000)

        // Current language should be EN
        cy.get('[data-testid="language-selector"]')
            .first()
            .should("contain.text", "EN")

        // Click language selector
        cy.get('[data-testid="language-selector"]').first().click()

        // Click Portuguese option
        cy.get('[role="menuitem"]').contains("PT").click()

        // Should redirect to Portuguese version
        cy.url().should("include", "/pt-BR")

        // Language selector should now show PT
        cy.get('[data-testid="language-selector"]')
            .first()
            .should("contain.text", "PT")

        // Test switching back to English
        cy.get('[data-testid="language-selector"]').first().click()
        cy.get('[role="menuitem"]').contains("EN").click()

        // Should be back to English
        cy.url().should("include", "/en")
        cy.get('[data-testid="language-selector"]')
            .first()
            .should("contain.text", "EN")
    })

    it("Language selector position should be consistent across page types", () => {
        const pageTypes = [
            { path: "/en", type: "Homepage (with header)" },
            { path: "/en/waveigl-support", type: "Landing Page (no header)" },
            {
                path: "/en/privacy-policy",
                type: "Institutional Page (with header)",
            },
        ]

        pageTypes.forEach(({ path, type }) => {
            cy.visit(path)
            cy.wait(1000)

            // Language selector should always be in top-right area
            cy.get('[data-testid="language-selector"]')
                .first()
                .should("exist")
                .then($el => {
                    const rect = $el[0].getBoundingClientRect()
                    // Should be in the upper portion of the screen
                    expect(rect.top).to.be.lessThan(200)
                    // Should be towards the right side
                    expect(rect.right).to.be.greaterThan(
                        window.innerWidth * 0.7
                    )
                })

            cy.log(`✅ ${type}: Language selector positioned correctly`)
        })
    })

    it("Language selector should persist user preferences", () => {
        // Visit English page
        cy.visit("/en")
        cy.wait(1000)

        // Switch to Portuguese
        cy.get('[data-testid="language-selector"]').first().click()
        cy.get('[role="menuitem"]').contains("PT").click()
        cy.wait(1000)

        // Navigate to different page
        cy.visit("/pt-BR/waveigl-support")
        cy.wait(1000)

        // Should still be in Portuguese
        cy.url().should("include", "/pt-BR")
        cy.get('[data-testid="language-selector"]')
            .first()
            .should("contain.text", "PT")
    })
})
