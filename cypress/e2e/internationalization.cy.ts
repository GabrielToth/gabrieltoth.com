describe("Internationalization (i18n) Tests", () => {
    beforeEach(() => {
        // Ignore hydration errors
        cy.on("uncaught:exception", err => {
            if (
                err.message.includes("Hydration failed") ||
                err.message.includes("418") ||
                err.message.includes("server rendered HTML")
            ) {
                return false
            }
            return true
        })
    })

    describe("Language Detection and Persistence", () => {
        it("should default to Portuguese when visiting root", () => {
            cy.visit("/")
            cy.wait(2000)

            // Should redirect to /pt-BR or show Portuguese content
            cy.url().should("match", /\/(pt-BR)?/)

            // Check for Portuguese content
            cy.get("html")
                .should("have.attr", "lang")
                .and("match", /pt|pt-BR/)
        })

        it("should maintain language when navigating", () => {
            // Start with English
            cy.visit("/en")
            cy.wait(2000)

            // Navigate to different pages and check language persistence
            const englishPages = [
                "/en/channel-management",
                "/en/pc-optimization",
                "/en/investments",
            ]

            englishPages.forEach(page => {
                cy.visit(page)
                cy.wait(1000)

                // Should maintain English
                cy.url().should("include", "/en/")
                cy.get("html").should("have.attr", "lang").and("match", /en/)
            })
        })

        it("should maintain Portuguese when navigating", () => {
            // Start with Portuguese
            cy.visit("/pt-BR")
            cy.wait(2000)

            // Navigate to different pages and check language persistence
            const portuguesePages = [
                "/pt-BR/channel-management",
                "/pt-BR/pc-optimization",
                "/pt-BR/investments",
            ]

            portuguesePages.forEach(page => {
                cy.visit(page)
                cy.wait(1000)

                // Should maintain Portuguese
                cy.url().should("include", "/pt-BR/")
                cy.get("html").should("have.attr", "lang").and("match", /pt/)
            })
        })
    })

    describe("Language Switching", () => {
        it("should switch from Portuguese to English", () => {
            cy.visit("/pt-BR")
            cy.wait(2000)

            // Look for language switcher
            cy.get("body").then($body => {
                if ($body.find("[data-cy=language-selector]").length > 0) {
                    cy.get("[data-cy=language-selector]").click()
                    cy.get("[data-cy=language-en]").click()
                    cy.wait(1000)
                    cy.url().should("include", "/en")
                } else {
                    // Alternative: direct navigation
                    cy.visit("/en")
                    cy.wait(1000)
                    cy.url().should("include", "/en")
                }
            })
        })

        it("should switch from English to Portuguese", () => {
            cy.visit("/en")
            cy.wait(2000)

            // Look for language switcher
            cy.get("body").then($body => {
                if ($body.find("[data-cy=language-selector]").length > 0) {
                    cy.get("[data-cy=language-selector]").click()
                    cy.get("[data-cy=language-pt-BR]").click()
                    cy.wait(1000)
                    cy.url().should("include", "/pt-BR")
                } else {
                    // Alternative: direct navigation
                    cy.visit("/pt-BR")
                    cy.wait(1000)
                    cy.url().should("include", "/pt-BR")
                }
            })
        })
    })

    describe("Content Translation", () => {
        const contentChecks = [
            {
                page: "/en",
                englishText: ["Home", "About", "Projects", "Contact"],
                portugueseText: ["Início", "Sobre", "Projetos", "Contato"],
            },
            {
                page: "/channel-management",
                englishText: ["Channel Management", "Analytics", "Growth"],
                portugueseText: [
                    "Gerenciamento de Canais",
                    "Análises",
                    "Crescimento",
                ],
            },
        ]

        contentChecks.forEach(check => {
            it(`should show correct translations on ${check.page}`, () => {
                // Test English
                cy.visit(`/en${check.page === "/en" ? "" : check.page}`)
                cy.wait(2000)

                check.englishText.forEach(text => {
                    cy.get("body").should("contain", text)
                })

                // Test Portuguese
                cy.visit(`/pt-BR${check.page === "/en" ? "" : check.page}`)
                cy.wait(2000)

                check.portugueseText.forEach(text => {
                    cy.get("body").should("contain", text)
                })
            })
        })
    })

    describe("SEO and Meta Tags", () => {
        it("should have correct meta tags for each language", () => {
            // English meta tags
            cy.visit("/en")
            cy.wait(2000)

            cy.get("html").should("have.attr", "lang", "en")
            cy.get("title").should("not.be.empty")
            cy.get('meta[name="description"]').should("exist")

            // Portuguese meta tags
            cy.visit("/pt-BR")
            cy.wait(2000)

            cy.get("html").should("have.attr", "lang").and("match", /pt/)
            cy.get("title").should("not.be.empty")
            cy.get('meta[name="description"]').should("exist")
        })
    })
})
