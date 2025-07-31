describe("Navigation Tests", () => {
    beforeEach(() => {
        // Reset to English version
        cy.visit("/en")
        cy.wait(500)
    })

    it("should load the homepage", () => {
        cy.url().should("include", "/en")
    })

    it("should navigate to different sections", () => {
        // Test navigation to About section
        cy.get('a[href="#about"]').first().click()
        cy.wait(500)
        cy.get("#about").should("be.visible")

        // Test navigation to Projects section
        cy.get('a[href="#projects"]').first().click()
        cy.wait(500)
        cy.get("#projects").should("be.visible")
    })

    it("should change language", () => {
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

    it("should open services dropdown", () => {
        // Click services button
        cy.contains("Services").first().click()
        cy.wait(500)

        // Verify dropdown is visible
        cy.get('a[href="/en/channel-management"]').should("be.visible")
        cy.get('a[href="/en/pc-optimization"]').should("be.visible")
        cy.get('a[href="/en/waveigl-support"]').should("be.visible")
    })

    it("should navigate to channel management page", () => {
        // Open services dropdown
        cy.contains("Services").first().click()
        cy.wait(500)

        // Click channel management link
        cy.get('a[href="/en/channel-management"]').first().click()
        cy.wait(500)

        // Verify URL changed
        cy.url().should("include", "/channel-management")
    })
})
