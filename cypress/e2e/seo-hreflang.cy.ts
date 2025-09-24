describe("Hreflang and alternates", () => {
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
            it(`has hreflang alternates on ${url}`, () => {
                cy.visit(url)
                cy.get('link[rel="alternate"][hreflang="en"]').should("exist")
                cy.get('link[rel="alternate"][hreflang="pt-BR"]').should(
                    "exist"
                )
                cy.get('link[rel="alternate"][hreflang="es"]').should("exist")
                cy.get('link[rel="alternate"][hreflang="de"]').should("exist")
                cy.get('link[rel="alternate"][hreflang="x-default"]').should(
                    "exist"
                )
            })
        })
    })
})
