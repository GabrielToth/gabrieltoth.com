describe("Internationalization (i18n) Tests", () => {
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

    describe("Language Detection and Persistence", () => {
        it("should default to English when visiting root", () => {
            cy.visit("/")
            cy.wait(1000)
            cy.url().should("include", "/en")
        })

        it("should maintain language when navigating", () => {
            // Start in English
            cy.visit("/en")
            cy.wait(1000)

            // Navigate to different pages
            cy.visit("/en/channel-management")
            cy.wait(1000)
            cy.url().should("include", "/en")

            cy.visit("/en/privacy-policy")
            cy.wait(1000)
            cy.url().should("include", "/en")
        })

        it("should maintain Portuguese when navigating", () => {
            // Start in Portuguese
            cy.visit("/pt-BR")
            cy.wait(1000)

            // Navigate to different pages
            cy.visit("/pt-BR/channel-management")
            cy.wait(1000)
            cy.url().should("include", "/pt-BR")

            cy.visit("/pt-BR/privacy-policy")
            cy.wait(1000)
            cy.url().should("include", "/pt-BR")
        })
    })

    describe("Language Switching", () => {
        it("should switch from English to Portuguese", () => {
            cy.visit("/en")
            cy.wait(1000)

            // Click language selector
            cy.get('[data-testid="language-selector"]').first().click()
            cy.wait(500)

            // Select Portuguese
            cy.get('[role="menuitem"]').contains("PT").click()
            cy.wait(500)

            // Verify URL and content
            cy.url().should("include", "/pt-BR")
            cy.get('[data-testid="language-selector"]')
                .first()
                .should("contain.text", "PT")
        })

        it("should switch from Portuguese to English", () => {
            cy.visit("/pt-BR")
            cy.wait(1000)

            // Click language selector
            cy.get('[data-testid="language-selector"]').first().click()
            cy.wait(500)

            // Select English
            cy.get('[role="menuitem"]').contains("EN").click()
            cy.wait(500)

            // Verify URL and content
            cy.url().should("include", "/en")
            cy.get('[data-testid="language-selector"]')
                .first()
                .should("contain.text", "EN")
        })
    })

    describe("Content Translation", () => {
        it("should show correct translations on /", () => {
            // Check English content
            cy.visit("/en")
            cy.wait(1000)
            cy.contains("Get in touch").should("be.visible")

            // Check Portuguese content
            cy.visit("/pt-BR")
            cy.wait(1000)
            cy.contains("Entre em contato").should("be.visible")
        })

        it("should show correct translations on /channel-management", () => {
            // Check English content
            cy.visit("/en/channel-management")
            cy.wait(1000)
            cy.get("body").should("be.visible")
            cy.get("head").should("exist")
            cy.get("title").should("exist")
            cy.get("meta[name='description']").should("exist")
            cy.get("meta[name='viewport']").should("exist")
            cy.get("meta[name='theme-color']").should("exist")
            cy.contains("ViraTrend").should("be.visible")
            cy.get('nav[aria-label="breadcrumb"]')
                .find("a")
                .first()
                .should("contain.text", "Home")

            // Check Portuguese content
            cy.visit("/pt-BR/channel-management")
            cy.wait(1000)
            cy.get("body").should("be.visible")
            cy.get("head").should("exist")
            cy.get("title").should("exist")
            cy.get("meta[name='description']").should("exist")
            cy.get("meta[name='viewport']").should("exist")
            cy.get("meta[name='theme-color']").should("exist")
            cy.contains("ViraTrend").should("be.visible")
            cy.get('nav[aria-label="breadcrumb"]')
                .find("a")
                .first()
                .should("contain.text", "Início")
        })
    })

    describe("SEO and Meta Tags", () => {
        it("should have correct meta tags for each language", () => {
            // Check English meta tags
            cy.visit("/en")
            cy.wait(1000)
            cy.get('html[lang="en"]').should("exist")

            // Check Portuguese meta tags
            cy.visit("/pt-BR")
            cy.wait(1000)
            cy.get('html[lang="pt-BR"]').should("exist")
        })
    })
})
