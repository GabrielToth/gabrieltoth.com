function getJSONLDScripts() {
    return cy.get('script[type="application/ld+json"]')
}

describe("Structured Data", () => {
    it("has Person/Website on home", () => {
        cy.visit("/en")
        getJSONLDScripts().should("exist")
        getJSONLDScripts().then($scripts => {
            const texts = [...$scripts].map(s => s.textContent || "")
            expect(texts.some(t => t.includes('"@type":"Person"'))).to.be.true
            expect(texts.some(t => t.includes('"@type":"WebSite"'))).to.be.true
        })
    })

    it("has OfferCatalog on channel-management", () => {
        cy.visit("/en/channel-management")
        getJSONLDScripts().then($scripts => {
            const texts = [...$scripts].map(s => s.textContent || "")
            expect(texts.some(t => t.includes('"@type":"OfferCatalog"'))).to.be
                .true
        })
    })

    it("has HowTo and OfferCatalog on pc-optimization", () => {
        cy.visit("/en/pc-optimization")
        getJSONLDScripts().then($scripts => {
            const texts = [...$scripts].map(s => s.textContent || "")
            expect(texts.some(t => t.includes('"@type":"HowTo"'))).to.be.true
            expect(texts.some(t => t.includes('"@type":"OfferCatalog"'))).to.be
                .true
        })
    })
})
