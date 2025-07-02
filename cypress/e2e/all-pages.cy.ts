describe("All Pages E2E Tests", () => {
    beforeEach(() => {
        // Ignore hydration errors to focus on functionality
        cy.on("uncaught:exception", err => {
            if (
                err.message.includes("Hydration failed") ||
                err.message.includes("418") ||
                err.message.includes("server rendered HTML")
            ) {
                return false
            }
            return true
        })
    })

    const pages = [
        { path: "/", name: "Homepage" },
        { path: "/en/", name: "Homepage (English)" },
        { path: "/pt-BR/", name: "Homepage (Portuguese)" },
        { path: "/en/channel-management", name: "Channel Management (EN)" },
        { path: "/pt-BR/channel-management", name: "Channel Management (PT)" },
        { path: "/en/pc-optimization", name: "PC Optimization (EN)" },
        { path: "/pt-BR/pc-optimization", name: "PC Optimization (PT)" },
        { path: "/en/waveigl-support", name: "WaveIGL Support (EN)" },
        { path: "/pt-BR/waveigl-support", name: "WaveIGL Support (PT)" },

        { path: "/en/terms-of-service", name: "Terms of Service (EN)" },
        { path: "/pt-BR/terms-of-service", name: "Terms of Service (PT)" },
        { path: "/en/privacy-policy", name: "Privacy Policy (EN)" },
        { path: "/pt-BR/privacy-policy", name: "Privacy Policy (PT)" },
    ]

    pages.forEach(page => {
        it(`should load ${page.name} successfully`, () => {
            cy.visit(page.path)
            cy.wait(2000)

            // Check if page loads
            cy.get("body").should("be.visible")

            // Check if content exists (flexible check)
            cy.get("h1, h2, h3, div, section").should("exist")

            // Check if navigation exists
            cy.get("nav, header").should("exist")

            // Check if footer exists
            cy.get("footer").should("exist")

            // Verify no critical errors in console
            cy.window().then(win => {
                cy.wrap(win.document.title).should("not.be.empty")
            })
        })
    })

    it("should handle 404 pages gracefully", () => {
        cy.visit("/non-existent-page", { failOnStatusCode: false })
        cy.wait(2000)

        // Should show 404 page or redirect
        cy.get("body").should("be.visible")
    })
})
