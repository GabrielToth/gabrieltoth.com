describe("Navigation Structure - Quick Tests", () => {
    beforeEach(() => {
        // Ignore hydration errors and other React development warnings
        cy.on("uncaught:exception", err => {
            if (
                err.message.includes("Hydration failed") ||
                err.message.includes("server rendered HTML") ||
                err.message.includes("client") ||
                err.message.includes("Minified React error #418") ||
                err.message.includes("418") ||
                err.stack?.includes("418") ||
                err.name === "Error"
            ) {
                return false
            }
            return true
        })
    })

    it("Landing pages should NOT have main header but SHOULD have breadcrumbs", () => {
        const landingPages = [
            "/en/pc-optimization",
            "/pt-BR/pc-optimization",
            "/en/channel-management",
            "/pt-BR/channel-management",
            "/en/waveigl-support",
            "/pt-BR/waveigl-support",
            "/en/editors",
            "/pt-BR/editors",
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

    it("Homepage should have main header", () => {
        const homepages = ["/en", "/pt-BR"]

        homepages.forEach(path => {
            cy.visit(path)
            cy.wait(1000)

            // Should have main header
            cy.get("header").should("exist")

            // Note: Homepage may or may not have breadcrumbs depending on implementation
            // This is acceptable as long as it has the main header for navigation

            // Should have footer
            cy.get("footer").should("exist")
        })
    })

    it("All non-landing pages should have main header AND breadcrumbs", () => {
        const institutionalPages = [
            "/en/privacy-policy",
            "/pt-BR/privacy-policy",
            "/en/terms-of-service",
            "/pt-BR/terms-of-service",
        ]

        institutionalPages.forEach(path => {
            cy.visit(path)
            cy.wait(1000)

            // Should have main header
            cy.get("header").should("exist")

            // Should have breadcrumbs navigation
            cy.get(
                'nav[aria-label*="Breadcrumb"], nav[aria-label*="estrutural"]'
            ).should("exist")

            // Should have footer
            cy.get("footer").should("exist")
        })
    })

    it("All pages should have breadcrumbs navigation except homepage", () => {
        const allPagesExceptHome = [
            "/en/pc-optimization",
            "/pt-BR/pc-optimization",
            "/en/channel-management",
            "/pt-BR/channel-management",
            "/en/waveigl-support",
            "/pt-BR/waveigl-support",
            "/en/editors",
            "/pt-BR/editors",
            "/en/privacy-policy",
            "/pt-BR/privacy-policy",
            "/en/terms-of-service",
            "/pt-BR/terms-of-service",
        ]

        allPagesExceptHome.forEach(path => {
            cy.visit(path)
            cy.wait(1000)

            // Should have breadcrumbs navigation
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
        cy.wait(3000) // Wait longer for translations to load
        cy.get("header").should("not.exist")
    })

    it("Breadcrumbs should provide proper navigation hierarchy with 'Início'", () => {
        // Test landing page breadcrumbs
        cy.visit("/en/pc-optimization")
        cy.wait(3000) // Wait longer for translations to load

        // Should show hierarchy like "Início > PC Optimization" in any language
        cy.get(
            'nav[aria-label*="Breadcrumb"], nav[aria-label*="estrutural"]'
        ).then($nav => {
            const text = $nav.text()
            expect(text).to.satisfy((text: string) => {
                return text.includes("Início") // Always "Início" regardless of language
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

        // Should show hierarchy like "Início > Terms of Service"
        cy.get(
            'nav[aria-label*="Breadcrumb"], nav[aria-label*="estrutural"]'
        ).should("contain.text", "Início")
    })
})
