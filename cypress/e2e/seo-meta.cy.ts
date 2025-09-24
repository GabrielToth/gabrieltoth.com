describe("SEO Meta validation", () => {
    const locales = ["en", "pt-BR", "es", "de"]
    const routes = [
        "/",
        "/channel-management",
        "/editors",
        "/pc-optimization",
        "/privacy-policy",
        "/terms-of-service",
        "/waveigl-support",
    ]

    locales.forEach(locale => {
        routes.forEach(route => {
            const url = `/${locale}${route === "/" ? "" : route}`
            it(`validates meta tags on ${url}`, () => {
                cy.visit(url, { failOnStatusCode: false })
                cy.title().should("not.be.empty")
                cy.get('meta[name="description"]')
                    .should("have.attr", "content")
                    .and("not.be.empty")
                cy.get('link[rel="canonical"]')
                    .should("have.attr", "href")
                    .and("include", url)
                cy.get('meta[http-equiv="content-language"]').should(
                    "not.exist"
                )
                cy.get('meta[property="og:title"]').should("exist")
                cy.get('meta[property="og:description"]').should("exist")
                cy.get('meta[property="og:url"]').should("exist")
                cy.get('meta[property="og:image"]').should("exist")
                cy.get('meta[name="twitter:card"]').should(
                    "have.attr",
                    "content"
                )
            })
        })
    })
})
