describe("Header Presence - Quick Tests", () => {
    beforeEach(() => {
        cy.on("uncaught:exception", () => false)
    })

    it("Landing pages should NOT have header", () => {
        const landingPages = [
            "/en/pc-optimization",
            "/en/channel-management",
            "/en/waveigl-support",
            "/en/editors",
        ]

        landingPages.forEach(path => {
            cy.visit(path)
            cy.wait(1000)

            // Should NOT have header
            cy.get("header").should("not.exist")

            // Should NOT have navigation
            cy.get("nav").should("not.exist")

            // Should have footer
            cy.get("footer").should("exist")
        })
    })

    it("Homepage SHOULD have header", () => {
        cy.visit("/en")
        cy.wait(1000)

        // Should have header
        cy.get("header").should("exist").and("be.visible")

        // Should have navigation
        cy.get("nav").should("exist").and("be.visible")

        // Should have language selector
        cy.get('[data-cy="language-selector"]').should("exist")

        // Should have footer
        cy.get("footer").should("exist")
    })

    it("Services dropdown should only exist on pages with header", () => {
        // Check homepage has services dropdown
        cy.visit("/en")
        cy.wait(1000)
        cy.contains("Services").should("exist")

        // Check landing page does NOT have services dropdown
        cy.visit("/en/pc-optimization")
        cy.wait(1000)
        cy.contains("Services").should("not.exist")
    })
})
