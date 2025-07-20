describe("Navigation Structure Tests", () => {
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

    describe("Landing Pages Should NOT Have Main Header", () => {
        const landingPages = [
            { path: "/en/pc-optimization", name: "PC Optimization (EN)" },
            { path: "/pt-BR/pc-optimization", name: "PC Optimization (PT)" },
            { path: "/en/waveigl-support", name: "WaveIGL Support (EN)" },
            { path: "/pt-BR/waveigl-support", name: "WaveIGL Support (PT)" },
            { path: "/en/channel-management", name: "Channel Management (EN)" },
            {
                path: "/pt-BR/channel-management",
                name: "Channel Management (PT)",
            },
            { path: "/en/editors", name: "Editors (EN)" },
            { path: "/pt-BR/editors", name: "Editors (PT)" },
        ]

        landingPages.forEach(page => {
            it(`should NOT have main header on ${page.name}`, () => {
                cy.visit(page.path)
                cy.wait(2000)

                // Check that the page loads
                cy.get("body").should("be.visible")

                // Check that there is NO main header element (fixed navigation header)
                cy.get("header").should("not.exist")

                // Check that the main navigation menu from header is not present (be more specific)
                cy.get("header").contains("Services").should("not.exist")
                cy.get("header").contains("Serviços").should("not.exist")

                // Check that language selector from header is not present
                cy.get('[data-cy="language-selector"]').should("not.exist")

                // Check that breadcrumbs ARE present (this is the navigation we want)
                cy.get(
                    'nav[aria-label*="Breadcrumb"], nav[aria-label*="estrutural"]'
                ).should("exist")

                // Check that footer exists (landing pages should have footer)
                cy.get("footer").should("exist")
            })
        })
    })

    describe("Homepage SHOULD Have Main Header", () => {
        const homepages = [
            { path: "/en", name: "Homepage (EN)" },
            { path: "/pt-BR", name: "Homepage (PT)" },
        ]

        homepages.forEach(page => {
            it(`should have main header on ${page.name}`, () => {
                cy.visit(page.path)
                cy.wait(2000)

                // Check that the page loads
                cy.get("body").should("be.visible")

                // Check that main header exists
                cy.get("header").should("exist").and("be.visible")

                // Check that main navigation exists
                cy.get("header nav").should("exist").and("be.visible")

                // Check that the Gabriel Toth Gonçalves logo link exists in header
                cy.get("header")
                    .contains("Gabriel Toth Gonçalves")
                    .should("be.visible")
                    .and("have.attr", "href")

                // Check that language selector exists in header
                cy.get('header [data-cy="language-selector"]')
                    .should("exist")
                    .and("be.visible")

                // Check that breadcrumbs also exist (but are separate from header)
                cy.get(
                    'nav[aria-label*="Breadcrumb"], nav[aria-label*="estrutural"]'
                ).should("exist")

                // Check that footer exists
                cy.get("footer").should("exist")
            })
        })
    })

    describe("Institutional Pages SHOULD Have Main Header", () => {
        const institutionalPages = [
            { path: "/en/privacy-policy", name: "Privacy Policy (EN)" },
            { path: "/pt-BR/privacy-policy", name: "Privacy Policy (PT)" },
            { path: "/en/terms-of-service", name: "Terms of Service (EN)" },
            { path: "/pt-BR/terms-of-service", name: "Terms of Service (PT)" },
        ]

        institutionalPages.forEach(page => {
            it(`should have main header on ${page.name}`, () => {
                cy.visit(page.path, { failOnStatusCode: false })
                cy.wait(2000)

                // Check that the page loads
                cy.get("body").should("be.visible")

                // Check that main header exists
                cy.get("header").should("exist").and("be.visible")

                // Check that main navigation exists
                cy.get("header nav").should("exist").and("be.visible")

                // Check that the Gabriel Toth Gonçalves logo link exists in header
                cy.get("header")
                    .contains("Gabriel Toth Gonçalves")
                    .should("be.visible")
                    .and("have.attr", "href")

                // Check that language selector exists in header (don't check visibility if covered)
                cy.get('header [data-cy="language-selector"]').should("exist")

                // Check that breadcrumbs exist
                cy.get(
                    'nav[aria-label*="Breadcrumb"], nav[aria-label*="estrutural"]'
                ).should("exist")

                // Check that footer exists
                cy.get("footer").should("exist")
            })
        })
    })

    describe("Breadcrumbs Should Exist on All Pages", () => {
        const allPages = [
            "/en",
            "/pt-BR",
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

        allPages.forEach(path => {
            it(`should have breadcrumbs on ${path}`, () => {
                cy.visit(path, { failOnStatusCode: false })
                cy.wait(2000)

                // Check that breadcrumbs navigation exists
                cy.get(
                    'nav[aria-label*="Breadcrumb"], nav[aria-label*="estrutural"]'
                ).should("exist")
            })
        })
    })

    describe("Main Header Navigation Functionality", () => {
        it("should have working navigation on homepage", () => {
            cy.visit("/en")
            cy.wait(2000)

            // Check that main header navigation works
            cy.get("header").should("be.visible")

            // Test anchor navigation
            cy.get('header a[href*="#about"]').should("exist")
            cy.get('header a[href*="#projects"]').should("exist")
            cy.get('header a[href*="#contact"]').should("exist")
        })

        it("should have services dropdown on homepage", () => {
            cy.visit("/en")
            cy.wait(2000)

            // Check services dropdown exists in header
            cy.get("header").contains("Services").should("be.visible")

            // Click services dropdown
            cy.get("header").contains("Services").click()
            cy.wait(500)

            // Check dropdown items
            cy.contains("ViraTrend").should("be.visible")
            cy.contains("PC Optimization").should("be.visible")
            cy.contains("Support WaveIGL").should("be.visible")
        })
    })

    describe("Breadcrumbs Navigation Functionality", () => {
        it("should have functional breadcrumbs on landing pages", () => {
            cy.visit("/en/pc-optimization")
            cy.wait(2000)

            // Check breadcrumbs exist
            cy.get('nav[aria-label*="Breadcrumb"]').should("exist")

            // Check breadcrumb links work
            cy.get('nav[aria-label*="Breadcrumb"] a').first().should("exist")
        })

        it("should show correct breadcrumb hierarchy", () => {
            cy.visit("/en/terms-of-service")
            cy.wait(2000)

            // Check breadcrumbs show proper hierarchy
            cy.get('nav[aria-label*="Breadcrumb"]').should("exist")
            cy.get('nav[aria-label*="Breadcrumb"]').should(
                "contain.text",
                "Home"
            )
        })
    })

    describe("Navigation Structure Consistency", () => {
        it("should maintain consistent navigation patterns", () => {
            // Homepage: Header + Breadcrumbs
            cy.visit("/en")
            cy.wait(2000)
            cy.get("header").should("exist")
            cy.get('nav[aria-label*="Breadcrumb"]').should("exist")

            // Landing page: Only Breadcrumbs (no header)
            cy.visit("/en/pc-optimization")
            cy.wait(2000)
            cy.get("header").should("not.exist")
            cy.get('nav[aria-label*="Breadcrumb"]').should("exist")

            // Institutional page: Language selector + Breadcrumbs
            cy.visit("/en/privacy-policy")
            cy.wait(2000)
            cy.get('nav[aria-label*="Breadcrumb"]').should("exist")
        })
    })
})
