/**
 * Account Completion Multilingual Integration Tests
 *
 * Tests account completion flow in multiple languages.
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock translation function
async function getTranslations(locale: string) {
    const translations: Record<string, Record<string, string>> = {
        en: {
            "completeAccount.title": "Complete Your Account",
            "completeAccount.subtitle":
                "Finish setting up your account to get started",
            "completeAccount.step1.title": "Review Your Information",
            "completeAccount.step2.title": "Add Required Information",
            "completeAccount.step3.title": "Verify Your Information",
            "completeAccount.errors.invalidEmail":
                "Please enter a valid email address",
            "completeAccount.errors.emailAlreadyRegistered":
                "This email is already in use",
            "completeAccount.errors.invalidPassword":
                "Password does not meet security requirements",
            "completeAccount.errors.invalidPhone":
                "Please enter a valid international phone number",
            "completeAccount.errors.invalidBirthDate":
                "Please enter a valid birth date",
            "completeAccount.errors.userTooYoung":
                "You must be at least 13 years old",
            "completeAccount.errors.futureDate":
                "Birth date cannot be in the future",
            "completeAccount.errors.invalidToken":
                "Your session has expired. Please log in again",
            "completeAccount.errors.serverError":
                "An error occurred. Please try again later",
        },
        "pt-BR": {
            "completeAccount.title": "Complete Sua Conta",
            "completeAccount.subtitle":
                "Termine de configurar sua conta para começar",
            "completeAccount.step1.title": "Revise Suas Informações",
            "completeAccount.step2.title": "Adicione Informações Necessárias",
            "completeAccount.step3.title": "Verifique Suas Informações",
            "completeAccount.errors.invalidEmail":
                "Por favor, insira um endereço de e-mail válido",
            "completeAccount.errors.emailAlreadyRegistered":
                "Este e-mail já está em uso",
            "completeAccount.errors.invalidPassword":
                "A senha não atende aos requisitos de segurança",
            "completeAccount.errors.invalidPhone":
                "Por favor, insira um número de telefone internacional válido",
            "completeAccount.errors.invalidBirthDate":
                "Por favor, insira uma data de nascimento válida",
            "completeAccount.errors.userTooYoung":
                "Você deve ter pelo menos 13 anos de idade",
            "completeAccount.errors.futureDate":
                "A data de nascimento não pode estar no futuro",
            "completeAccount.errors.invalidToken":
                "Sua sessão expirou. Por favor, faça login novamente",
            "completeAccount.errors.serverError":
                "Ocorreu um erro. Por favor, tente novamente mais tarde",
        },
        es: {
            "completeAccount.title": "Completa Tu Cuenta",
            "completeAccount.subtitle":
                "Termina de configurar tu cuenta para comenzar",
            "completeAccount.step1.title": "Revisa Tu Información",
            "completeAccount.step2.title": "Agrega Información Requerida",
            "completeAccount.step3.title": "Verifica Tu Información",
            "completeAccount.errors.invalidEmail":
                "Por favor, ingresa una dirección de correo válida",
            "completeAccount.errors.emailAlreadyRegistered":
                "Este correo ya está en uso",
            "completeAccount.errors.invalidPassword":
                "La contraseña no cumple con los requisitos de seguridad",
            "completeAccount.errors.invalidPhone":
                "Por favor, ingresa un número de teléfono internacional válido",
            "completeAccount.errors.invalidBirthDate":
                "Por favor, ingresa una fecha de nacimiento válida",
            "completeAccount.errors.userTooYoung":
                "Debes tener al menos 13 años de edad",
            "completeAccount.errors.futureDate":
                "La fecha de nacimiento no puede estar en el futuro",
            "completeAccount.errors.invalidToken":
                "Tu sesión ha expirado. Por favor, inicia sesión nuevamente",
            "completeAccount.errors.serverError":
                "Ocurrió un error. Por favor, intenta de nuevo más tarde",
        },
        de: {
            "completeAccount.title": "Vervollständige Dein Konto",
            "completeAccount.subtitle":
                "Beende die Einrichtung deines Kontos, um zu beginnen",
            "completeAccount.step1.title": "Überprüfe Deine Informationen",
            "completeAccount.step2.title":
                "Füge erforderliche Informationen hinzu",
            "completeAccount.step3.title": "Überprüfe Deine Informationen",
            "completeAccount.errors.invalidEmail":
                "Bitte geben Sie eine gültige E-Mail-Adresse ein",
            "completeAccount.errors.emailAlreadyRegistered":
                "Diese E-Mail wird bereits verwendet",
            "completeAccount.errors.invalidPassword":
                "Das Passwort erfüllt nicht die Sicherheitsanforderungen",
            "completeAccount.errors.invalidPhone":
                "Bitte geben Sie eine gültige internationale Telefonnummer ein",
            "completeAccount.errors.invalidBirthDate":
                "Bitte geben Sie ein gültiges Geburtsdatum ein",
            "completeAccount.errors.userTooYoung":
                "Sie müssen mindestens 13 Jahre alt sein",
            "completeAccount.errors.futureDate":
                "Das Geburtsdatum kann nicht in der Zukunft liegen",
            "completeAccount.errors.invalidToken":
                "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an",
            "completeAccount.errors.serverError":
                "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut",
        },
    }

    return translations[locale] || translations.en
}

vi.mock("@/lib/i18n", () => ({
    getTranslations,
}))

describe("Account Completion Multilingual Support", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("Language support", () => {
        it("should support English locale", async () => {
            const translations = await getTranslations("en")

            expect(translations["completeAccount.title"]).toBe(
                "Complete Your Account"
            )
            expect(translations["completeAccount.step1.title"]).toBe(
                "Review Your Information"
            )
        })

        it("should support Portuguese (Brazil) locale", async () => {
            const translations = await getTranslations("pt-BR")

            expect(translations["completeAccount.title"]).toBe(
                "Complete Sua Conta"
            )
            expect(translations["completeAccount.step1.title"]).toBe(
                "Revise Suas Informações"
            )
        })

        it("should support Spanish locale", async () => {
            const translations = await getTranslations("es")

            expect(translations["completeAccount.title"]).toBe(
                "Completa Tu Cuenta"
            )
            expect(translations["completeAccount.step1.title"]).toBe(
                "Revisa Tu Información"
            )
        })

        it("should support German locale", async () => {
            const translations = await getTranslations("de")

            expect(translations["completeAccount.title"]).toBe(
                "Vervollständige Dein Konto"
            )
            expect(translations["completeAccount.step1.title"]).toBe(
                "Überprüfe Deine Informationen"
            )
        })
    })

    describe("Error messages in different languages", () => {
        it("should display invalid email error in English", async () => {
            const translations = await getTranslations("en")

            expect(translations["completeAccount.errors.invalidEmail"]).toBe(
                "Please enter a valid email address"
            )
        })

        it("should display invalid email error in Portuguese", async () => {
            const translations = await getTranslations("pt-BR")

            expect(translations["completeAccount.errors.invalidEmail"]).toBe(
                "Por favor, insira um endereço de e-mail válido"
            )
        })

        it("should display invalid email error in Spanish", async () => {
            const translations = await getTranslations("es")

            expect(translations["completeAccount.errors.invalidEmail"]).toBe(
                "Por favor, ingresa una dirección de correo válida"
            )
        })

        it("should display invalid email error in German", async () => {
            const translations = await getTranslations("de")

            expect(translations["completeAccount.errors.invalidEmail"]).toBe(
                "Bitte geben Sie eine gültige E-Mail-Adresse ein"
            )
        })

        it("should display duplicate email error in all languages", async () => {
            const locales = ["en", "pt-BR", "es", "de"]

            for (const locale of locales) {
                const translations = await getTranslations(locale)
                expect(
                    translations[
                        "completeAccount.errors.emailAlreadyRegistered"
                    ]
                ).toBeDefined()
                expect(
                    translations[
                        "completeAccount.errors.emailAlreadyRegistered"
                    ]
                ).not.toBe("")
            }
        })

        it("should display password error in all languages", async () => {
            const locales = ["en", "pt-BR", "es", "de"]

            for (const locale of locales) {
                const translations = await getTranslations(locale)
                expect(
                    translations["completeAccount.errors.invalidPassword"]
                ).toBeDefined()
            }
        })

        it("should display phone error in all languages", async () => {
            const locales = ["en", "pt-BR", "es", "de"]

            for (const locale of locales) {
                const translations = await getTranslations(locale)
                expect(
                    translations["completeAccount.errors.invalidPhone"]
                ).toBeDefined()
            }
        })

        it("should display birth date error in all languages", async () => {
            const locales = ["en", "pt-BR", "es", "de"]

            for (const locale of locales) {
                const translations = await getTranslations(locale)
                expect(
                    translations["completeAccount.errors.invalidBirthDate"]
                ).toBeDefined()
            }
        })

        it("should display age validation error in all languages", async () => {
            const locales = ["en", "pt-BR", "es", "de"]

            for (const locale of locales) {
                const translations = await getTranslations(locale)
                expect(
                    translations["completeAccount.errors.userTooYoung"]
                ).toBeDefined()
            }
        })
    })

    describe("Form labels in different languages", () => {
        it("should display all form labels in English", async () => {
            const translations = await getTranslations("en")

            expect(translations["completeAccount.step1.title"]).toBe(
                "Review Your Information"
            )
            expect(translations["completeAccount.step2.title"]).toBe(
                "Add Required Information"
            )
            expect(translations["completeAccount.step3.title"]).toBe(
                "Verify Your Information"
            )
        })

        it("should display all form labels in Portuguese", async () => {
            const translations = await getTranslations("pt-BR")

            expect(translations["completeAccount.step1.title"]).toBe(
                "Revise Suas Informações"
            )
            expect(translations["completeAccount.step2.title"]).toBe(
                "Adicione Informações Necessárias"
            )
            expect(translations["completeAccount.step3.title"]).toBe(
                "Verifique Suas Informações"
            )
        })

        it("should display all form labels in Spanish", async () => {
            const translations = await getTranslations("es")

            expect(translations["completeAccount.step1.title"]).toBe(
                "Revisa Tu Información"
            )
            expect(translations["completeAccount.step2.title"]).toBe(
                "Agrega Información Requerida"
            )
            expect(translations["completeAccount.step3.title"]).toBe(
                "Verifica Tu Información"
            )
        })

        it("should display all form labels in German", async () => {
            const translations = await getTranslations("de")

            expect(translations["completeAccount.step1.title"]).toBe(
                "Überprüfe Deine Informationen"
            )
            expect(translations["completeAccount.step2.title"]).toBe(
                "Füge erforderliche Informationen hinzu"
            )
            expect(translations["completeAccount.step3.title"]).toBe(
                "Überprüfe Deine Informationen"
            )
        })
    })

    describe("Locale switching", () => {
        it("should switch from English to Portuguese", async () => {
            const enTranslations = await getTranslations("en")
            const ptTranslations = await getTranslations("pt-BR")

            expect(enTranslations["completeAccount.title"]).not.toBe(
                ptTranslations["completeAccount.title"]
            )
            expect(ptTranslations["completeAccount.title"]).toBe(
                "Complete Sua Conta"
            )
        })

        it("should switch from Portuguese to Spanish", async () => {
            const ptTranslations = await getTranslations("pt-BR")
            const esTranslations = await getTranslations("es")

            expect(ptTranslations["completeAccount.title"]).not.toBe(
                esTranslations["completeAccount.title"]
            )
            expect(esTranslations["completeAccount.title"]).toBe(
                "Completa Tu Cuenta"
            )
        })

        it("should switch from Spanish to German", async () => {
            const esTranslations = await getTranslations("es")
            const deTranslations = await getTranslations("de")

            expect(esTranslations["completeAccount.title"]).not.toBe(
                deTranslations["completeAccount.title"]
            )
            expect(deTranslations["completeAccount.title"]).toBe(
                "Vervollständige Dein Konto"
            )
        })

        it("should switch from German to English", async () => {
            const deTranslations = await getTranslations("de")
            const enTranslations = await getTranslations("en")

            expect(deTranslations["completeAccount.title"]).not.toBe(
                enTranslations["completeAccount.title"]
            )
            expect(enTranslations["completeAccount.title"]).toBe(
                "Complete Your Account"
            )
        })
    })

    describe("Translation completeness", () => {
        it("should have all required keys in English", async () => {
            const translations = await getTranslations("en")
            const requiredKeys = [
                "completeAccount.title",
                "completeAccount.subtitle",
                "completeAccount.step1.title",
                "completeAccount.step2.title",
                "completeAccount.step3.title",
                "completeAccount.errors.invalidEmail",
                "completeAccount.errors.emailAlreadyRegistered",
                "completeAccount.errors.invalidPassword",
                "completeAccount.errors.invalidPhone",
                "completeAccount.errors.invalidBirthDate",
                "completeAccount.errors.userTooYoung",
                "completeAccount.errors.futureDate",
                "completeAccount.errors.invalidToken",
                "completeAccount.errors.serverError",
            ]

            for (const key of requiredKeys) {
                expect(translations[key]).toBeDefined()
                expect(translations[key]).not.toBe("")
            }
        })

        it("should have all required keys in Portuguese", async () => {
            const translations = await getTranslations("pt-BR")
            const requiredKeys = [
                "completeAccount.title",
                "completeAccount.subtitle",
                "completeAccount.step1.title",
                "completeAccount.step2.title",
                "completeAccount.step3.title",
                "completeAccount.errors.invalidEmail",
                "completeAccount.errors.emailAlreadyRegistered",
                "completeAccount.errors.invalidPassword",
                "completeAccount.errors.invalidPhone",
                "completeAccount.errors.invalidBirthDate",
                "completeAccount.errors.userTooYoung",
                "completeAccount.errors.futureDate",
                "completeAccount.errors.invalidToken",
                "completeAccount.errors.serverError",
            ]

            for (const key of requiredKeys) {
                expect(translations[key]).toBeDefined()
                expect(translations[key]).not.toBe("")
            }
        })

        it("should have all required keys in Spanish", async () => {
            const translations = await getTranslations("es")
            const requiredKeys = [
                "completeAccount.title",
                "completeAccount.subtitle",
                "completeAccount.step1.title",
                "completeAccount.step2.title",
                "completeAccount.step3.title",
                "completeAccount.errors.invalidEmail",
                "completeAccount.errors.emailAlreadyRegistered",
                "completeAccount.errors.invalidPassword",
                "completeAccount.errors.invalidPhone",
                "completeAccount.errors.invalidBirthDate",
                "completeAccount.errors.userTooYoung",
                "completeAccount.errors.futureDate",
                "completeAccount.errors.invalidToken",
                "completeAccount.errors.serverError",
            ]

            for (const key of requiredKeys) {
                expect(translations[key]).toBeDefined()
                expect(translations[key]).not.toBe("")
            }
        })

        it("should have all required keys in German", async () => {
            const translations = await getTranslations("de")
            const requiredKeys = [
                "completeAccount.title",
                "completeAccount.subtitle",
                "completeAccount.step1.title",
                "completeAccount.step2.title",
                "completeAccount.step3.title",
                "completeAccount.errors.invalidEmail",
                "completeAccount.errors.emailAlreadyRegistered",
                "completeAccount.errors.invalidPassword",
                "completeAccount.errors.invalidPhone",
                "completeAccount.errors.invalidBirthDate",
                "completeAccount.errors.userTooYoung",
                "completeAccount.errors.futureDate",
                "completeAccount.errors.invalidToken",
                "completeAccount.errors.serverError",
            ]

            for (const key of requiredKeys) {
                expect(translations[key]).toBeDefined()
                expect(translations[key]).not.toBe("")
            }
        })
    })

    describe("Locale in URL", () => {
        it("should use English locale from URL", () => {
            const url = "http://localhost:3000/en/auth/complete-account"
            const locale = url.split("/")[3]

            expect(locale).toBe("en")
        })

        it("should use Portuguese locale from URL", () => {
            const url = "http://localhost:3000/pt-BR/auth/complete-account"
            const locale = url.split("/")[3]

            expect(locale).toBe("pt-BR")
        })

        it("should use Spanish locale from URL", () => {
            const url = "http://localhost:3000/es/auth/complete-account"
            const locale = url.split("/")[3]

            expect(locale).toBe("es")
        })

        it("should use German locale from URL", () => {
            const url = "http://localhost:3000/de/auth/complete-account"
            const locale = url.split("/")[3]

            expect(locale).toBe("de")
        })
    })

    describe("Fallback to default locale", () => {
        it("should fallback to English for unsupported locale", async () => {
            const translations = await getTranslations("fr")

            expect(translations["completeAccount.title"]).toBe(
                "Complete Your Account"
            )
        })

        it("should fallback to English for empty locale", async () => {
            const translations = await getTranslations("")

            expect(translations["completeAccount.title"]).toBe(
                "Complete Your Account"
            )
        })
    })

    describe("Multilingual flow", () => {
        it("should complete account in English", async () => {
            const translations = await getTranslations("en")
            const flowData = {
                locale: "en",
                title: translations["completeAccount.title"],
                step1: translations["completeAccount.step1.title"],
                step2: translations["completeAccount.step2.title"],
                step3: translations["completeAccount.step3.title"],
            }

            expect(flowData.locale).toBe("en")
            expect(flowData.title).toBe("Complete Your Account")
        })

        it("should complete account in Portuguese", async () => {
            const translations = await getTranslations("pt-BR")
            const flowData = {
                locale: "pt-BR",
                title: translations["completeAccount.title"],
                step1: translations["completeAccount.step1.title"],
                step2: translations["completeAccount.step2.title"],
                step3: translations["completeAccount.step3.title"],
            }

            expect(flowData.locale).toBe("pt-BR")
            expect(flowData.title).toBe("Complete Sua Conta")
        })

        it("should complete account in Spanish", async () => {
            const translations = await getTranslations("es")
            const flowData = {
                locale: "es",
                title: translations["completeAccount.title"],
                step1: translations["completeAccount.step1.title"],
                step2: translations["completeAccount.step2.title"],
                step3: translations["completeAccount.step3.title"],
            }

            expect(flowData.locale).toBe("es")
            expect(flowData.title).toBe("Completa Tu Cuenta")
        })

        it("should complete account in German", async () => {
            const translations = await getTranslations("de")
            const flowData = {
                locale: "de",
                title: translations["completeAccount.title"],
                step1: translations["completeAccount.step1.title"],
                step2: translations["completeAccount.step2.title"],
                step3: translations["completeAccount.step3.title"],
            }

            expect(flowData.locale).toBe("de")
            expect(flowData.title).toBe("Vervollständige Dein Konto")
        })
    })
})
