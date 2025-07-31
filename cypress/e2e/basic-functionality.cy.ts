describe("Basic Functionality Tests", () => {
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

    it("should load the homepage and display main content", () => {
        cy.visit("/en")
        cy.wait(1000)

        // Check for main content
        cy.get("h1").should("be.visible")
        cy.contains("Gabriel Toth").should("be.visible")
        cy.contains("Full Stack Developer").should("be.visible")
        cy.get("header").should("be.visible")
        cy.get("body").should("be.visible")
        cy.get("head").should("exist")
        cy.get("title").should("exist")
        cy.get("meta[name='description']").should("exist")
        cy.get("meta[name='viewport']").should("exist")
        cy.get("meta[name='theme-color']").should("exist")
    })

    it("should be able to scroll and interact with the page", () => {
        cy.visit("/en")
        cy.wait(1000)

        // Scroll to about section
        cy.get("#about").scrollIntoView()
        cy.wait(1000)
        cy.get("#about").should("be.visible")

        // Scroll to projects section
        cy.get("#projects").scrollIntoView()
        cy.wait(1000)
        cy.get("#projects").should("be.visible")

        // Scroll to contact section
        cy.get("#contact").scrollIntoView()
        cy.wait(1000)
        cy.get("#contact").should("be.visible")
    })

    it("should handle navigation clicks without breaking", () => {
        cy.visit("/en")
        cy.wait(1000)

        // Click navigation links
        cy.get('a[href="#about"]').first().click()
        cy.wait(1000)
        cy.get("#about").should("be.visible")

        cy.get('a[href="#projects"]').first().click()
        cy.wait(1000)
        cy.get("#projects").should("be.visible")
    })

    it("should load different pages without critical errors", () => {
        // Test main pages
        const pages = [
            "/en",
            "/en/channel-management",
            "/en/pc-optimization",
            "/en/privacy-policy",
        ]

        pages.forEach(page => {
            cy.visit(page)
            cy.wait(1000)
            cy.get("body").should("be.visible")
        })
    })

    it("should handle language switching", () => {
        cy.visit("/en")
        cy.wait(1000)

        // Click language selector
        cy.get('[data-testid="language-selector"]').first().click()
        cy.wait(500)

        // Select Portuguese
        cy.get('[role="menuitem"]').contains("PT").click()
        cy.wait(500)

        // Verify URL changed to Portuguese
        cy.url().should("include", "/pt-BR")

        // Switch back to English
        cy.get('[data-testid="language-selector"]').first().click()
        cy.wait(500)
        cy.get('[role="menuitem"]').contains("EN").click()
        cy.wait(500)

        // Verify URL changed back to English
        cy.url().should("include", "/en")
    })
})
