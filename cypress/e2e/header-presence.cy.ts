describe("Navigation Structure Tests", () => {
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

        landingPages.forEach(({ path, name }) => {
            it(`should NOT have main header on ${name}`, () => {
                cy.visit(path)
                cy.wait(1000)

                // Should not have main header
                cy.get("header").should("not.exist")
            })
        })
    })

    describe("Homepage SHOULD Have Main Header", () => {
        it("should have main header on Homepage (EN)", () => {
            cy.visit("/en")
            cy.wait(1000)
            cy.get("header").should("be.visible")
        })

        it("should have main header on Homepage (PT)", () => {
            cy.visit("/pt-BR")
            cy.wait(1000)
            cy.get("header").should("be.visible")
        })
    })

    describe("Institutional Pages SHOULD Have Main Header", () => {
        it("should have main header on Privacy Policy (EN)", () => {
            cy.visit("/en/privacy-policy")
            cy.wait(1000)
            cy.get("header").should("be.visible")
        })

        it("should have main header on Privacy Policy (PT)", () => {
            cy.visit("/pt-BR/privacy-policy")
            cy.wait(1000)
            cy.get("header").should("be.visible")
        })

        it("should have main header on Terms of Service (EN)", () => {
            cy.visit("/en/terms-of-service")
            cy.wait(1000)
            cy.get("header").should("be.visible")
        })

        it("should have main header on Terms of Service (PT)", () => {
            cy.visit("/pt-BR/terms-of-service")
            cy.wait(1000)
            cy.get("header").should("be.visible")
        })
    })

    describe("Breadcrumbs Should Exist on All Pages Except Homepage", () => {
        const pages = [
            { path: "/en/pc-optimization", name: "PC Optimization (EN)" },
            { path: "/pt-BR/pc-optimization", name: "PC Optimization (PT)" },
            { path: "/en/channel-management", name: "Channel Management (EN)" },
            {
                path: "/pt-BR/channel-management",
                name: "Channel Management (PT)",
            },
            { path: "/en/waveigl-support", name: "WaveIGL Support (EN)" },
            { path: "/pt-BR/waveigl-support", name: "WaveIGL Support (PT)" },
            { path: "/en/editors", name: "Editors (EN)" },
            { path: "/pt-BR/editors", name: "Editors (PT)" },
            { path: "/en/privacy-policy", name: "Privacy Policy (EN)" },
            { path: "/pt-BR/privacy-policy", name: "Privacy Policy (PT)" },
            { path: "/en/terms-of-service", name: "Terms of Service (EN)" },
            { path: "/pt-BR/terms-of-service", name: "Terms of Service (PT)" },
        ]

        pages.forEach(({ path, name }) => {
            it(`should have breadcrumbs on ${path}`, () => {
                cy.visit(path)
                cy.wait(1000)
                cy.get('nav[aria-label="breadcrumb"]').should("be.visible")
            })
        })
    })

    describe("Main Header Navigation Functionality", () => {
        it("should have working navigation on homepage", () => {
            cy.visit("/en")
            cy.wait(1000)

            // Check navigation links
            cy.get('a[href="#about"]').first().should("be.visible")
            cy.get('a[href="#projects"]').first().should("be.visible")
            cy.get('a[href="#contact"]').first().should("be.visible")
        })

        it("should have services dropdown on homepage", () => {
            cy.visit("/en")
            cy.wait(1000)

            // Click services button
            cy.contains("Services").first().click()
            cy.wait(500)

            // Verify dropdown is visible
            cy.get('a[href="/en/channel-management"]').should("be.visible")
            cy.get('a[href="/en/pc-optimization"]').should("be.visible")
            cy.get('a[href="/en/waveigl-support"]').should("be.visible")
        })
    })

    describe("Breadcrumbs Navigation Functionality", () => {
        it("should have functional breadcrumbs on landing pages", () => {
            cy.visit("/en/channel-management")
            cy.wait(1000)

            // Check breadcrumb links
            cy.get('nav[aria-label="breadcrumb"]')
                .find("a")
                .first()
                .should("be.visible")
                .and("have.attr", "href", "/en")
                .and("contain.text", "Home")
                .and("not.be.disabled")
                .and("have.length", 1)
        })

        it("should show correct breadcrumb hierarchy", () => {
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

    describe("Navigation Structure Consistency", () => {
        it("should maintain consistent navigation patterns", () => {
            // Check homepage navigation
            cy.visit("/en")
            cy.wait(1000)
            cy.get("header").should("be.visible")

            // Check landing page navigation
            cy.visit("/en/channel-management")
            cy.wait(1000)
            cy.get('nav[aria-label="breadcrumb"]').should("be.visible")

            // Check institutional page navigation
            cy.visit("/en/privacy-policy")
            cy.wait(1000)
            cy.get("header").should("be.visible")
            cy.get('nav[aria-label="breadcrumb"]').should("be.visible")
        })
    })
})
