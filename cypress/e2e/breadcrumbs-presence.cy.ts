describe("Navigation Structure - Quick Tests", () => {
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

    it("Landing pages should NOT have main header but SHOULD have breadcrumbs", () => {
        const landingPages = [
            "/en/pc-optimization",
            "/en/channel-management",
            "/en/waveigl-support",
            "/en/editors",
        ]

        landingPages.forEach(page => {
            cy.visit(page)
            cy.wait(1000)

            // Should NOT have main header
            cy.get("header").should("not.exist")

            // SHOULD have breadcrumbs
            cy.get('nav[aria-label="breadcrumb"]').should("be.visible")
        })
    })

    it("Homepage should have main header", () => {
        cy.visit("/en")
        cy.wait(1000)

        // Should have main header
        cy.get("header").should("be.visible")

        // Should NOT have breadcrumbs
        cy.get('nav[aria-label="breadcrumb"]').should("not.exist")
    })

    it("All non-landing pages should have main header AND breadcrumbs", () => {
        const pages = [
            "/en/privacy-policy",
            "/en/terms-of-service",
            "/en/pc-optimization/terms",
        ]

        pages.forEach(page => {
            cy.visit(page)
            cy.wait(1000)

            // Should have main header
            cy.get("header").should("be.visible")

            // Should have breadcrumbs
            cy.get('nav[aria-label="breadcrumb"]').should("be.visible")
        })
    })

    it("All pages should have breadcrumbs navigation except homepage", () => {
        const pages = [
            "/en/pc-optimization",
            "/en/channel-management",
            "/en/waveigl-support",
            "/en/editors",
            "/en/privacy-policy",
            "/en/terms-of-service",
            "/en/pc-optimization/terms",
        ]

        pages.forEach(page => {
            cy.visit(page)
            cy.wait(1000)

            // Should have breadcrumbs
            cy.get('nav[aria-label="breadcrumb"]').should("be.visible")
        })
    })

    it("Services dropdown should only exist on homepage header", () => {
        // Check homepage
        cy.visit("/en")
        cy.wait(1000)
        cy.contains("Services").should("be.visible")

        // Check other pages
        cy.visit("/en/privacy-policy")
        cy.wait(1000)
        cy.get("header").should("not.exist")
    })

    it("Breadcrumbs should provide proper navigation hierarchy with 'Home'", () => {
        cy.visit("/en/channel-management")
        cy.wait(1000)

        // Check breadcrumb structure
        cy.get('nav[aria-label="breadcrumb"]')
            .find("a")
            .first()
            .should("contain.text", "Home")
            .and("have.attr", "href", "/en")
            .and("be.visible")
            .and("not.be.disabled")
            .and("have.length", 1)
    })
})
