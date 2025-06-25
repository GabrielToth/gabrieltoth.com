import PCOptimizationTermsPage from "./page"

describe("<PCOptimizationTermsPage />", () => {
    it("renders", () => {
        // see: https://on.cypress.io/mounting-react
        cy.mount(
            <PCOptimizationTermsPage
                params={Promise.resolve({ locale: "en" })}
            />
        )
    })
})
