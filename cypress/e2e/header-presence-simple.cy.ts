describe("Navigation Structure - Quick Tests", () => {
    beforeEach(() => {
        cy.on("uncaught:exception", () => false)
    })

    it("Landing pages should NOT have main header but SHOULD have breadcrumbs", () => {
        const landingPages = [
            "/en/pc-optimization",
            "/en/channel-management",
            "/en/waveigl-support",
            "/en/editors",
        ]

        landingPages.forEach(path => {
            cy.visit(path)
            cy.wait(1000)

            // Should NOT have main header
            cy.get("header").should("not.exist")

            // Should have breadcrumbs navigation
            cy.get(
                'nav[aria-label*="Breadcrumb"], nav[aria-label*="estrutural"]'
            ).should("exist")

            // Should have footer
            cy.get("footer").should("exist")
        })
    })

    it("Homepage SHOULD have main header AND breadcrumbs", () => {
        cy.visit("/en")
        cy.wait(1000)

        // Should have main header
        cy.get("header").should("exist").and("be.visible")

        // Should have main navigation in header
        cy.get("header nav").should("exist").and("be.visible")

        // Should have language selector in header
        cy.get('header [data-cy="language-selector"]').should("exist")

        // Should also have breadcrumbs (separate from header)
        cy.get(
            'nav[aria-label*="Breadcrumb"], nav[aria-label*="estrutural"]'
        ).should("exist")

        // Should have footer
        cy.get("footer").should("exist")
    })

    it("All non-landing pages should have main header AND breadcrumbs", () => {
        const nonLandingPages = [
            "/en",
            "/en/privacy-policy",
            "/en/terms-of-service",
        ]

        nonLandingPages.forEach(path => {
            cy.visit(path, { failOnStatusCode: false })
            cy.wait(1000)

            // Should have main header
            cy.get("header").should("exist").and("be.visible")

            // Should have main navigation in header
            cy.get("header nav").should("exist").and("be.visible")

            // Should have language selector in header
            cy.get('header [data-cy="language-selector"]').should("exist")

            // Should also have breadcrumbs (separate from header)
            cy.get(
                'nav[aria-label*="Breadcrumb"], nav[aria-label*="estrutural"]'
            ).should("exist")

            // Should have footer
            cy.get("footer").should("exist")
        })
    })

    it("All pages should have breadcrumbs navigation", () => {
        const allPages = [
            "/en",
            "/en/pc-optimization",
            "/en/channel-management",
            "/en/waveigl-support",
            "/en/editors",
            "/en/privacy-policy",
            "/en/terms-of-service",
        ]

        allPages.forEach(path => {
            cy.visit(path, { failOnStatusCode: false })
            cy.wait(1000)

            // Should have breadcrumbs on every page
            cy.get(
                'nav[aria-label*="Breadcrumb"], nav[aria-label*="estrutural"]'
            ).should("exist")
        })
    })

    it("Services dropdown should only exist on homepage header", () => {
        // Check homepage has services dropdown in header
        cy.visit("/en")
        cy.wait(3000) // Wait longer for translations to load
        // Check for Services in any language
        cy.get("header").then($header => {
            const text = $header.text()
            expect(text).to.satisfy((text: string) => {
                return text.includes("Services") || text.includes("Serviços")
            })
        })

        // Check landing page does NOT have any header at all
        cy.visit("/en/pc-optimization")
        cy.wait(1000)
        cy.get("header").should("not.exist")
    })

    it("Breadcrumbs should provide proper navigation hierarchy", () => {
        // Test landing page breadcrumbs
        cy.visit("/en/pc-optimization")
        cy.wait(3000) // Wait longer for translations to load

        // Should show hierarchy like "Home > PC Optimization" in any language
        cy.get(
            'nav[aria-label*="Breadcrumb"], nav[aria-label*="estrutural"]'
        ).then($nav => {
            const text = $nav.text()
            expect(text).to.satisfy((text: string) => {
                return text.includes("Home") || text.includes("Início")
            })
        })
        cy.get(
            'nav[aria-label*="Breadcrumb"], nav[aria-label*="estrutural"]'
        ).then($nav => {
            const text = $nav.text()
            expect(text).to.satisfy((text: string) => {
                return (
                    text.includes("PC Optimization") ||
                    text.includes("Otimização de PC")
                )
            })
        })

        // Test nested page breadcrumbs
        cy.visit("/en/terms-of-service")
        cy.wait(1000)

        // Should show hierarchy like "Home > Legal > Terms"
        cy.get(
            'nav[aria-label*="Breadcrumb"], nav[aria-label*="estrutural"]'
        ).should("contain.text", "Home")
    })
})
