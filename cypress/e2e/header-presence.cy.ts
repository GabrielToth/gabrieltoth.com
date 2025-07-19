describe("Header Presence Tests", () => {
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

    describe("Landing Pages Should NOT Have Header", () => {
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
            it(`should NOT have header on ${page.name}`, () => {
                cy.visit(page.path)
                cy.wait(2000)

                // Check that the page loads
                cy.get("body").should("be.visible")

                // Check that there is NO header element
                cy.get("header").should("not.exist")

                // Check that there is NO navigation element in the top area
                cy.get("nav").should("not.exist")

                // Specifically check that the Gabriel Toth Gonçalves logo link is not present
                // (which would indicate header presence)
                cy.get("body").then($body => {
                    if (
                        $body.find('a:contains("Gabriel Toth Gonçalves")')
                            .length > 0
                    ) {
                        cy.get('a:contains("Gabriel Toth Gonçalves")').should(
                            "not.exist"
                        )
                    }
                })

                // Check that language selector is not present at the top
                cy.get('[data-cy="language-selector"]').should("not.exist")

                // Check that footer exists (landing pages should have footer)
                cy.get("footer").should("exist")
            })
        })
    })

    describe("Homepage SHOULD Have Header", () => {
        const homepages = [
            { path: "/en", name: "Homepage (EN)" },
            { path: "/pt-BR", name: "Homepage (PT)" },
        ]

        homepages.forEach(page => {
            it(`should have header on ${page.name}`, () => {
                cy.visit(page.path)
                cy.wait(2000)

                // Check that the page loads
                cy.get("body").should("be.visible")

                // Check that header exists
                cy.get("header").should("exist").and("be.visible")

                // Check that navigation exists
                cy.get("nav").should("exist").and("be.visible")

                // Check that the Gabriel Toth Gonçalves logo link exists
                cy.get("header")
                    .contains("Gabriel Toth Gonçalves")
                    .should("be.visible")
                    .and("have.attr", "href")

                // Check that language selector exists
                cy.get('[data-cy="language-selector"]')
                    .should("exist")
                    .and("be.visible")

                // Check that navigation items exist
                cy.get("header").within(() => {
                    // These should be visible in the header - check for either language
                    cy.get("body").then($body => {
                        if ($body.find(':contains("Início")').length > 0) {
                            cy.contains("Início").should("be.visible")
                        } else {
                            cy.contains("Home").should("be.visible")
                        }
                    })
                })

                // Check that footer exists
                cy.get("footer").should("exist")
            })
        })
    })

    describe("Institutional Pages SHOULD Have Header", () => {
        const institutionalPages = [
            { path: "/en/privacy-policy", name: "Privacy Policy (EN)" },
            { path: "/pt-BR/privacy-policy", name: "Privacy Policy (PT)" },
            { path: "/en/terms-of-service", name: "Terms of Service (EN)" },
            { path: "/pt-BR/terms-of-service", name: "Terms of Service (PT)" },
        ]

        institutionalPages.forEach(page => {
            it(`should have header on ${page.name}`, () => {
                cy.visit(page.path, { failOnStatusCode: false })
                cy.wait(2000)

                // Check that the page loads
                cy.get("body").should("be.visible")

                // Check that header exists
                cy.get("header").should("exist").and("be.visible")

                // Check that navigation exists
                cy.get("nav").should("exist").and("be.visible")

                // Check that the Gabriel Toth Gonçalves logo link exists
                cy.get("header")
                    .contains("Gabriel Toth Gonçalves")
                    .should("be.visible")
                    .and("have.attr", "href")
            })
        })
    })

    describe("Header Navigation Functionality", () => {
        it("should have working navigation on homepage", () => {
            cy.visit("/en")
            cy.wait(2000)

            // Check that header navigation works
            cy.get("header").should("be.visible")

            // Test anchor navigation
            cy.get('header a[href*="#about"]').should("exist")
            cy.get('header a[href*="#projects"]').should("exist")
            cy.get('header a[href*="#contact"]').should("exist")
        })

        it("should have correct navigation links when NOT on homepage", () => {
            // Visit a non-homepage that has header (like privacy-policy)
            cy.visit("/en/privacy-policy", { failOnStatusCode: false })
            cy.wait(2000)

            // Check that header exists
            cy.get("header").should("be.visible")

            // Navigation links should point to full URLs, not just anchors
            cy.get("header").within(() => {
                // Check that home link goes to the right place
                cy.contains("Gabriel Toth Gonçalves")
                    .should("have.attr", "href")
                    .and("include", "/en")
            })
        })
    })

    describe("Services Dropdown Functionality", () => {
        it("should have services dropdown on pages with header", () => {
            cy.visit("/en")
            cy.wait(2000)

            // Check services dropdown exists
            cy.get("header").contains("Services").should("be.visible")

            // Click services dropdown
            cy.get("header").contains("Services").click()
            cy.wait(500)

            // Check dropdown items
            cy.contains("ViraTrend").should("be.visible")
            cy.contains("PC Optimization").should("be.visible")
            cy.contains("Support WaveIGL").should("be.visible")
        })

        it("should NOT have services dropdown on landing pages", () => {
            cy.visit("/en/pc-optimization")
            cy.wait(2000)

            // Services dropdown should not exist
            cy.contains("Services").should("not.exist")
            cy.contains("Serviços").should("not.exist")
        })
    })
})
