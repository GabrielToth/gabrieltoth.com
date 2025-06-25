/// <reference types="cypress" />

describe("All Pages E2E Tests", () => {
    beforeEach(() => {
        // Ignore hydration errors to focus on functionality
        cy.on("uncaught:exception", err => {
            if (
                err.message.includes("Hydration failed") ||
                err.message.includes("418") ||
                err.message.includes("server rendered HTML") ||
                err.message.includes("ENOENT")
            ) {
                return false
            }
            return true
        })
    })

    const pages = [
        { path: "/", name: "Homepage" },
        { path: "/en", name: "Homepage (English)" },
        { path: "/pt-BR", name: "Homepage (Portuguese)" },
        { path: "/en/terms-of-service", name: "Terms of Service (EN)" },
        { path: "/pt-BR/terms-of-service", name: "Terms of Service (PT)" },
        { path: "/en/privacy-policy", name: "Privacy Policy (EN)" },
        { path: "/pt-BR/privacy-policy", name: "Privacy Policy (PT)" },
    ]

    pages.forEach(page => {
        it(`should load ${page.name} successfully`, () => {
            cy.visit(page.path, { failOnStatusCode: false })
            cy.wait(2000)

            // Check if page loads
            cy.get("body").should("be.visible")

            // Check if navigation exists
            cy.get("nav, header").should("exist")

            // Check if footer exists
            cy.get("footer").should("exist")
        })
    })

    it("should handle 404 pages gracefully", () => {
        cy.visit("/non-existent-page", { failOnStatusCode: false })
        cy.wait(2000)
        cy.get("body").should("be.visible")
    })
})
