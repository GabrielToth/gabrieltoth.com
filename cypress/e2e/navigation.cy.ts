describe("Navigation Tests", () => {
    beforeEach(() => {
        cy.visit("/")
    })

    it("should load the homepage", () => {
        cy.contains("Gabriel Toth Gonçalves")
        cy.get("h1").should("be.visible")
    })

    it("should navigate to different sections", () => {
        // Test navigation to about section
        cy.get('a[href*="#about"]').click()
        cy.url().should("include", "#about")

        // Test navigation to projects section
        cy.get('a[href*="#projects"]').click()
        cy.url().should("include", "#projects")

        // Test navigation to contact section
        cy.get('a[href*="#contact"]').click()
        cy.url().should("include", "#contact")
    })

    it("should change language", () => {
        // Click language selector
        cy.get("[data-cy=language-selector]").click()

        // Change to English
        cy.get("[data-cy=language-en]").click()

        // Verify language change
        cy.contains("Home").should("be.visible")

        // Change back to Portuguese
        cy.get("[data-cy=language-selector]").click()
        cy.get("[data-cy=language-pt-BR]").click()

        // Verify language change
        cy.contains("Início").should("be.visible")
    })

    it("should open services dropdown", () => {
        cy.contains("Serviços").click()
        cy.contains("Gerenciamento de Canais").should("be.visible")
        cy.contains("Otimização de PC").should("be.visible")
    })

    it("should navigate to channel management page", () => {
        cy.contains("Serviços").click()
        cy.contains("Gerenciamento de Canais").click()
        cy.url().should("include", "/channel-management")
    })
})
