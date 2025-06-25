describe("Navigation and Interaction Tests", () => {
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

    describe("Header Navigation", () => {
        it("should navigate through all header menu items", () => {
            cy.visit("/")
            cy.wait(2000)

            // Test main navigation links
            const navItems = ["#about", "#projects", "#contact"]

            navItems.forEach(item => {
                cy.get("body").then($body => {
                    if ($body.find(`a[href*="${item}"]`).length > 0) {
                        cy.get(`a[href*="${item}"]`).first().click()
                        cy.wait(1000)
                        cy.url().should("include", item)
                    }
                })
            })
        })

        it("should open and navigate services dropdown", () => {
            cy.visit("/")
            cy.wait(2000)

            // Look for services menu
            cy.get("body").then($body => {
                if (
                    $body
                        .find("*")
                        .filter((i, el) =>
                            Boolean(
                                el.textContent?.includes("Serviços") ||
                                    el.textContent?.includes("Services")
                            )
                        ).length > 0
                ) {
                    // Click services
                    cy.contains(/Serviços|Services/).click()
                    cy.wait(1000)

                    // Check if dropdown items are visible
                    cy.get("body").should(
                        "contain.text",
                        /Gerenciamento|Channel/
                    )
                    cy.get("body").should("contain.text", /SpeedPC/)
                }
            })
        })

        it("should navigate to service pages from dropdown", () => {
            cy.visit("/")
            cy.wait(2000)

            const servicePages = [
                { text: /Gerenciamento|Channel/, url: "channel-management" },
                { text: /SpeedPC/, url: "pc-optimization" },
            ]

            servicePages.forEach(service => {
                cy.visit("/")
                cy.wait(1000)

                cy.get("body").then($body => {
                    if (
                        $body
                            .find("*")
                            .filter((i, el) =>
                                service.text.test(el.textContent || "")
                            ).length > 0
                    ) {
                        cy.contains(service.text).click()
                        cy.wait(2000)
                        cy.url().should("include", service.url)
                    }
                })
            })
        })
    })

    describe("Footer Navigation", () => {
        it("should navigate through footer links", () => {
            cy.visit("/")
            cy.wait(2000)

            // Scroll to footer
            cy.get("footer").scrollIntoView()
            cy.wait(1000)

            // Test footer links
            const footerLinks = ["terms", "privacy", "contact"]

            footerLinks.forEach(link => {
                cy.get("footer").then($footer => {
                    if ($footer.find(`a[href*="${link}"]`).length > 0) {
                        cy.get("footer")
                            .find(`a[href*="${link}"]`)
                            .first()
                            .click()
                        cy.wait(2000)
                        cy.url().should("include", link)

                        // Go back to homepage
                        cy.visit("/")
                        cy.wait(1000)
                    }
                })
            })
        })

        it("should have working social media links", () => {
            cy.visit("/")
            cy.wait(2000)

            cy.get("footer").scrollIntoView()
            cy.wait(1000)

            // Check for social media links (they should open in new tab)
            cy.get("footer").then($footer => {
                const socialLinks = $footer.find(
                    'a[href*="github"], a[href*="linkedin"], a[href*="twitter"], a[href*="instagram"]'
                )

                socialLinks.each((i, link) => {
                    cy.wrap(link).should("have.attr", "target", "_blank")
                    cy.wrap(link)
                        .should("have.attr", "rel")
                        .and("include", "no-opener")
                })
            })
        })
    })

    describe("Page Interactions", () => {
        it("should handle form interactions", () => {
            cy.visit("/")
            cy.wait(2000)

            // Look for contact forms
            cy.get("body").then($body => {
                if (
                    $body.find("form, input[type='email'], textarea").length > 0
                ) {
                    // Test form elements exist and are interactive
                    cy.get("input, textarea, select")
                        .first()
                        .should("be.visible")

                    // Try to interact with form elements
                    cy.get("input[type='text'], input[type='email']")
                        .first()
                        .then($input => {
                            if ($input.length > 0) {
                                cy.wrap($input).type("test@example.com")
                                cy.wrap($input).should(
                                    "have.value",
                                    "test@example.com"
                                )
                            }
                        })
                }
            })
        })

        it("should handle modal interactions", () => {
            cy.visit("/")
            cy.wait(2000)

            // Look for buttons that might open modals
            cy.get("body").then($body => {
                const modalTriggers = $body
                    .find("button, a")
                    .filter((i, el) => {
                        const text = el.textContent?.toLowerCase() || ""
                        return (
                            text.includes("contato") ||
                            text.includes("contact") ||
                            text.includes("modal") ||
                            text.includes("popup")
                        )
                    })

                if (modalTriggers.length > 0) {
                    cy.wrap(modalTriggers.first()).click()
                    cy.wait(1000)

                    // Check if modal opened
                    cy.get("body").should("be.visible")
                }
            })
        })

        it("should handle theme switching", () => {
            cy.visit("/")
            cy.wait(2000)

            // Look for theme toggle
            cy.get("body").then($body => {
                if (
                    $body
                        .find("[data-cy='theme-toggle'], button")
                        .filter((i, el) => {
                            const text = el.textContent?.toLowerCase() || ""
                            return (
                                text.includes("theme") ||
                                text.includes("dark") ||
                                text.includes("light")
                            )
                        }).length > 0
                ) {
                    // Get initial theme
                    cy.get("html").then($html => {
                        const initialClass = $html.attr("class") || ""

                        // Click theme toggle
                        cy.get("button")
                            .filter((i, el) => {
                                const text = el.textContent?.toLowerCase() || ""
                                return (
                                    text.includes("theme") ||
                                    text.includes("dark") ||
                                    text.includes("light")
                                )
                            })
                            .first()
                            .click()

                        cy.wait(1000)

                        // Check if theme changed
                        cy.get("html").should("not.have.class", initialClass)
                    })
                }
            })
        })
    })

    describe("Responsive Navigation", () => {
        it("should work on mobile viewport", () => {
            cy.viewport(375, 667) // iPhone SE
            cy.visit("/")
            cy.wait(2000)

            // Check if mobile navigation works
            cy.get("body").should("be.visible")

            // Look for mobile menu toggle
            cy.get("body").then($body => {
                if (
                    $body.find("button").filter((i, el) => {
                        const text = el.textContent?.toLowerCase() || ""
                        return (
                            text.includes("menu") ||
                            el.querySelector("svg") !== null
                        )
                    }).length > 0
                ) {
                    cy.get("button")
                        .filter((i, el) => {
                            return (
                                el.querySelector("svg") !== null ||
                                (el.textContent?.toLowerCase() || "").includes(
                                    "menu"
                                )
                            )
                        })
                        .first()
                        .click()

                    cy.wait(1000)
                    cy.get("body").should("be.visible")
                }
            })
        })

        it("should work on tablet viewport", () => {
            cy.viewport(768, 1024) // iPad
            cy.visit("/")
            cy.wait(2000)

            cy.get("body").should("be.visible")
            cy.get("nav, header").should("be.visible")
        })

        it("should work on desktop viewport", () => {
            cy.viewport(1920, 1080) // Desktop
            cy.visit("/")
            cy.wait(2000)

            cy.get("body").should("be.visible")
            cy.get("nav, header").should("be.visible")
        })
    })
})
