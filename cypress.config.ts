import { defineConfig } from "cypress"

export default defineConfig({
    projectId: "6swpm5",
    e2e: {
        baseUrl: "http://localhost:3000",
        setupNodeEvents(on, config) {
            // implement node event listeners here
        },
        specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
        supportFile: "cypress/support/e2e.ts",
    },
    component: {
        devServer: {
            framework: "next",
            bundler: "webpack",
        },
        specPattern: "cypress/component/**/*.cy.{js,jsx,ts,tsx}",
        supportFile: "cypress/support/component.ts",
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
})
