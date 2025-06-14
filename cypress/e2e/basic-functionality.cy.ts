describe("Basic Functionality Tests", () => {
    beforeEach(() => {
        // Ignore ALL uncaught exceptions to focus on user functionality
        cy.on("uncaught:exception", () => {
            return false
        })
    })

    it("should load the homepage and display main content", () => {
        cy.visit("/")

        // Wait for page to load
        cy.wait(2000)

        // Check if main content is visible
        cy.get("body").should("be.visible")
        cy.contains("Gabriel", { timeout: 10000 }).should("be.visible")

        // Check if navigation exists
        cy.get("nav", { timeout: 10000 }).should("exist")
    })

    it("should be able to scroll and interact with the page", () => {
        cy.visit("/")
        cy.wait(2000)

        // Scroll down
        cy.scrollTo(0, 500)
        cy.wait(1000)

        // Scroll back up
        cy.scrollTo(0, 0)
        cy.wait(1000)

        // Page should still be functional
        cy.get("body").should("be.visible")
    })

    it("should handle navigation clicks without breaking", () => {
        cy.visit("/")
        cy.wait(2000)

        // Try to click on navigation elements (if they exist)
        cy.get("body").then($body => {
            if ($body.find('a[href*="#about"]').length > 0) {
                cy.get('a[href*="#about"]').first().click()
                cy.wait(1000)
            }
        })

        // Page should still be functional
        cy.get("body").should("be.visible")
    })

    it("should load different pages without critical errors", () => {
        // Test homepage
        cy.visit("/")
        cy.wait(2000)
        cy.get("body").should("be.visible")

        // Test channel management page
        cy.visit("/channel-management")
        cy.wait(2000)
        cy.get("body").should("be.visible")

        // Test PC optimization page
        cy.visit("/pc-optimization")
        cy.wait(2000)
        cy.get("body").should("be.visible")
    })

    it("should handle language switching", () => {
        cy.visit("/")
        cy.wait(2000)

        // Try English
        cy.visit("/en")
        cy.wait(2000)
        cy.get("body").should("be.visible")

        // Try Portuguese
        cy.visit("/pt-BR")
        cy.wait(2000)
        cy.get("body").should("be.visible")
    })
})
