/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Custom command to select DOM element by data-cy attribute.
             * @example cy.dataCy('greeting')
             */
            dataCy(value: string): Chainable<JQuery<HTMLElement>>

            /**
             * Custom command to change language
             * @example cy.changeLanguage('en')
             */
            changeLanguage(locale: "en" | "pt-BR"): Chainable<void>
        }
    }
}

Cypress.Commands.add("dataCy", value => {
    return cy.get(`[data-cy=${value}]`)
})

Cypress.Commands.add("changeLanguage", locale => {
    cy.get("[data-cy=language-selector]").click()
    cy.get(`[data-cy=language-${locale}]`).click()
})

export {}
