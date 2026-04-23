import deAuth from "@/i18n/de/auth.json"
import enAuth from "@/i18n/en/auth.json"
import esAuth from "@/i18n/es/auth.json"
import ptBRAuth from "@/i18n/pt-BR/auth.json"
import { describe, expect, it } from "vitest"

/**
 * Validates: Requirements 5.1, 5.2
 *
 * Tests for account completion internationalization.
 * Verifies that all required translation keys are present in all locales
 * and that translations are consistent across languages.
 */

type AuthTranslations = typeof enAuth

const locales = {
    en: enAuth,
    "pt-BR": ptBRAuth,
    es: esAuth,
    de: deAuth,
}

// Define all required keys for account completion
const requiredCompleteAccountKeys = {
    title: "string",
    subtitle: "string",
    backToLogin: "string",
    loading: "string",
    saving: "string",
    save: "string",
    cancel: "string",
    back: "string",
    step: "string",
    of: "string",
    step1: {
        title: "string",
        description: "string",
        email: "string",
        emailPlaceholder: "string",
        name: "string",
        namePlaceholder: "string",
        picture: "string",
        edit: "string",
        continue: "string",
    },
    step2: {
        title: "string",
        description: "string",
        password: "string",
        passwordPlaceholder: "string",
        passwordHint: "string",
        phone: "string",
        phonePlaceholder: "string",
        phoneHint: "string",
        birthDate: "string",
        birthDateHint: "string",
        continue: "string",
    },
    step3: {
        title: "string",
        description: "string",
        prefilledData: "string",
        newFields: "string",
        edit: "string",
        complete: "string",
        success: "string",
        info: "string",
    },
    passwordRequirements: {
        minLength: "string",
        uppercase: "string",
        lowercase: "string",
        number: "string",
        special: "string",
        strong: "string",
        weak: "string",
    },
    errors: {
        invalidEmail: "string",
        emailAlreadyRegistered: "string",
        invalidPassword: "string",
        invalidPhone: "string",
        invalidBirthDate: "string",
        userTooYoung: "string",
        futureDate: "string",
        invalidToken: "string",
        serverError: "string",
        validationFailed: "string",
    },
}

describe("Account Completion Internationalization", () => {
    describe("Translation Key Presence", () => {
        it("should have completeAccount section in all locales", () => {
            Object.entries(locales).forEach(([locale, translations]) => {
                expect(translations.completeAccount).toBeDefined()
                expect(typeof translations.completeAccount).toBe("object")
            })
        })

        it("should have all required top-level keys in all locales", () => {
            const topLevelKeys = [
                "title",
                "subtitle",
                "backToLogin",
                "loading",
                "saving",
                "save",
                "cancel",
                "back",
                "step",
                "of",
                "step1",
                "step2",
                "step3",
                "passwordRequirements",
                "errors",
            ]

            Object.entries(locales).forEach(([locale, translations]) => {
                const completeAccount = translations.completeAccount
                topLevelKeys.forEach(key => {
                    expect(completeAccount).toHaveProperty(key)
                    expect(
                        completeAccount[key as keyof typeof completeAccount]
                    ).toBeDefined()
                })
            })
        })

        it("should have all required step1 keys in all locales", () => {
            const step1Keys = [
                "title",
                "description",
                "email",
                "emailPlaceholder",
                "name",
                "namePlaceholder",
                "picture",
                "edit",
                "continue",
            ]

            Object.entries(locales).forEach(([locale, translations]) => {
                const step1 = translations.completeAccount.step1
                step1Keys.forEach(key => {
                    expect(step1).toHaveProperty(key)
                    expect(step1[key as keyof typeof step1]).toBeDefined()
                })
            })
        })

        it("should have all required step2 keys in all locales", () => {
            const step2Keys = [
                "title",
                "description",
                "password",
                "passwordPlaceholder",
                "passwordHint",
                "phone",
                "phonePlaceholder",
                "phoneHint",
                "birthDate",
                "birthDateHint",
                "continue",
            ]

            Object.entries(locales).forEach(([locale, translations]) => {
                const step2 = translations.completeAccount.step2
                step2Keys.forEach(key => {
                    expect(step2).toHaveProperty(key)
                    expect(step2[key as keyof typeof step2]).toBeDefined()
                })
            })
        })

        it("should have all required step3 keys in all locales", () => {
            const step3Keys = [
                "title",
                "description",
                "prefilledData",
                "newFields",
                "edit",
                "complete",
                "success",
                "info",
            ]

            Object.entries(locales).forEach(([locale, translations]) => {
                const step3 = translations.completeAccount.step3
                step3Keys.forEach(key => {
                    expect(step3).toHaveProperty(key)
                    expect(step3[key as keyof typeof step3]).toBeDefined()
                })
            })
        })

        it("should have all required passwordRequirements keys in all locales", () => {
            const passwordRequirementsKeys = [
                "minLength",
                "uppercase",
                "lowercase",
                "number",
                "special",
                "strong",
                "weak",
            ]

            Object.entries(locales).forEach(([locale, translations]) => {
                const passwordRequirements =
                    translations.completeAccount.passwordRequirements
                passwordRequirementsKeys.forEach(key => {
                    expect(passwordRequirements).toHaveProperty(key)
                    expect(
                        passwordRequirements[
                            key as keyof typeof passwordRequirements
                        ]
                    ).toBeDefined()
                })
            })
        })

        it("should have all required error keys in all locales", () => {
            const errorKeys = [
                "invalidEmail",
                "emailAlreadyRegistered",
                "invalidPassword",
                "invalidPhone",
                "invalidBirthDate",
                "userTooYoung",
                "futureDate",
                "invalidToken",
                "serverError",
                "validationFailed",
            ]

            Object.entries(locales).forEach(([locale, translations]) => {
                const errors = translations.completeAccount.errors
                errorKeys.forEach(key => {
                    expect(errors).toHaveProperty(key)
                    expect(errors[key as keyof typeof errors]).toBeDefined()
                })
            })
        })
    })

    describe("Translation Value Consistency", () => {
        it("should have non-empty string values for all keys", () => {
            const checkStringValues = (obj: any, path: string = ""): void => {
                Object.entries(obj).forEach(([key, value]) => {
                    const currentPath = path ? `${path}.${key}` : key
                    if (typeof value === "string") {
                        expect(value.length).toBeGreaterThan(0)
                    } else if (typeof value === "object" && value !== null) {
                        checkStringValues(value, currentPath)
                    }
                })
            }

            Object.entries(locales).forEach(([locale, translations]) => {
                checkStringValues(translations.completeAccount)
            })
        })

        it("should have consistent structure across all locales", () => {
            const enKeys = JSON.stringify(
                Object.keys(locales.en.completeAccount).sort()
            )

            Object.entries(locales).forEach(([locale, translations]) => {
                const localeKeys = JSON.stringify(
                    Object.keys(translations.completeAccount).sort()
                )
                expect(localeKeys).toBe(enKeys)
            })
        })

        it("should have matching nested structure for step1 across locales", () => {
            const enStep1Keys = JSON.stringify(
                Object.keys(locales.en.completeAccount.step1).sort()
            )

            Object.entries(locales).forEach(([locale, translations]) => {
                const step1Keys = JSON.stringify(
                    Object.keys(translations.completeAccount.step1).sort()
                )
                expect(step1Keys).toBe(enStep1Keys)
            })
        })

        it("should have matching nested structure for step2 across locales", () => {
            const enStep2Keys = JSON.stringify(
                Object.keys(locales.en.completeAccount.step2).sort()
            )

            Object.entries(locales).forEach(([locale, translations]) => {
                const step2Keys = JSON.stringify(
                    Object.keys(translations.completeAccount.step2).sort()
                )
                expect(step2Keys).toBe(enStep2Keys)
            })
        })

        it("should have matching nested structure for step3 across locales", () => {
            const enStep3Keys = JSON.stringify(
                Object.keys(locales.en.completeAccount.step3).sort()
            )

            Object.entries(locales).forEach(([locale, translations]) => {
                const step3Keys = JSON.stringify(
                    Object.keys(translations.completeAccount.step3).sort()
                )
                expect(step3Keys).toBe(enStep3Keys)
            })
        })

        it("should have matching nested structure for passwordRequirements across locales", () => {
            const enPasswordRequirementsKeys = JSON.stringify(
                Object.keys(
                    locales.en.completeAccount.passwordRequirements
                ).sort()
            )

            Object.entries(locales).forEach(([locale, translations]) => {
                const passwordRequirementsKeys = JSON.stringify(
                    Object.keys(
                        translations.completeAccount.passwordRequirements
                    ).sort()
                )
                expect(passwordRequirementsKeys).toBe(
                    enPasswordRequirementsKeys
                )
            })
        })

        it("should have matching nested structure for errors across locales", () => {
            const enErrorKeys = JSON.stringify(
                Object.keys(locales.en.completeAccount.errors).sort()
            )

            Object.entries(locales).forEach(([locale, translations]) => {
                const errorKeys = JSON.stringify(
                    Object.keys(translations.completeAccount.errors).sort()
                )
                expect(errorKeys).toBe(enErrorKeys)
            })
        })
    })

    describe("English Locale Specific Tests", () => {
        it("should have proper English translations for step1", () => {
            const step1 = locales.en.completeAccount.step1
            expect(step1.title).toBe("Review Your Information")
            expect(step1.email).toBe("Email")
            expect(step1.name).toBe("Full Name")
            expect(step1.picture).toBe("Profile Picture")
        })

        it("should have proper English translations for step2", () => {
            const step2 = locales.en.completeAccount.step2
            expect(step2.title).toBe("Add Required Information")
            expect(step2.password).toBe("Password")
            expect(step2.phone).toBe("Phone Number")
            expect(step2.birthDate).toBe("Birth Date")
        })

        it("should have proper English translations for step3", () => {
            const step3 = locales.en.completeAccount.step3
            expect(step3.title).toBe("Verify Your Information")
            expect(step3.complete).toBe("Complete Account Setup")
            expect(step3.success).toBe("Account setup completed successfully!")
        })

        it("should have proper English error messages", () => {
            const errors = locales.en.completeAccount.errors
            expect(errors.invalidEmail).toBe(
                "Please enter a valid email address"
            )
            expect(errors.emailAlreadyRegistered).toBe(
                "This email is already in use"
            )
            expect(errors.invalidPassword).toBe(
                "Password does not meet security requirements"
            )
            expect(errors.userTooYoung).toBe(
                "You must be at least 13 years old"
            )
        })
    })

    describe("Portuguese Locale Specific Tests", () => {
        it("should have proper Portuguese translations for step1", () => {
            const step1 = locales["pt-BR"].completeAccount.step1
            expect(step1.title).toBe("Revise Suas Informações")
            expect(step1.email).toBe("E-mail")
            expect(step1.name).toBe("Nome Completo")
            expect(step1.picture).toBe("Foto de Perfil")
        })

        it("should have proper Portuguese translations for step2", () => {
            const step2 = locales["pt-BR"].completeAccount.step2
            expect(step2.title).toBe("Adicione Informações Obrigatórias")
            expect(step2.password).toBe("Senha")
            expect(step2.phone).toBe("Número de Telefone")
            expect(step2.birthDate).toBe("Data de Nascimento")
        })

        it("should have proper Portuguese translations for step3", () => {
            const step3 = locales["pt-BR"].completeAccount.step3
            expect(step3.title).toBe("Verifique Suas Informações")
            expect(step3.complete).toBe("Completar Configuração da Conta")
            expect(step3.success).toBe(
                "Configuração da conta concluída com sucesso!"
            )
        })

        it("should have proper Portuguese error messages", () => {
            const errors = locales["pt-BR"].completeAccount.errors
            expect(errors.invalidEmail).toBe(
                "Por favor, digite um endereço de e-mail válido"
            )
            expect(errors.emailAlreadyRegistered).toBe(
                "Este e-mail já está em uso"
            )
            expect(errors.invalidPassword).toBe(
                "A senha não atende aos requisitos de segurança"
            )
            expect(errors.userTooYoung).toBe("Você deve ter pelo menos 13 anos")
        })
    })

    describe("Spanish Locale Specific Tests", () => {
        it("should have proper Spanish translations for step1", () => {
            const step1 = locales.es.completeAccount.step1
            expect(step1.title).toBe("Revisa Tu Información")
            expect(step1.email).toBe("Correo Electrónico")
            expect(step1.name).toBe("Nombre Completo")
            expect(step1.picture).toBe("Foto de Perfil")
        })

        it("should have proper Spanish translations for step2", () => {
            const step2 = locales.es.completeAccount.step2
            expect(step2.title).toBe("Agrega Información Requerida")
            expect(step2.password).toBe("Contraseña")
            expect(step2.phone).toBe("Número de Teléfono")
            expect(step2.birthDate).toBe("Fecha de Nacimiento")
        })

        it("should have proper Spanish translations for step3", () => {
            const step3 = locales.es.completeAccount.step3
            expect(step3.title).toBe("Verifica Tu Información")
            expect(step3.complete).toBe("Completar Configuración de Cuenta")
            expect(step3.success).toBe(
                "¡Configuración de cuenta completada exitosamente!"
            )
        })

        it("should have proper Spanish error messages", () => {
            const errors = locales.es.completeAccount.errors
            expect(errors.invalidEmail).toBe(
                "Por favor, ingresa una dirección de correo válida"
            )
            expect(errors.emailAlreadyRegistered).toBe(
                "Este correo ya está en uso"
            )
            expect(errors.invalidPassword).toBe(
                "La contraseña no cumple con los requisitos de seguridad"
            )
            expect(errors.userTooYoung).toBe("Debes tener al menos 13 años")
        })
    })

    describe("German Locale Specific Tests", () => {
        it("should have proper German translations for step1", () => {
            const step1 = locales.de.completeAccount.step1
            expect(step1.title).toBe("Überprüfen Sie Ihre Informationen")
            expect(step1.email).toBe("E-Mail")
            expect(step1.name).toBe("Vollständiger Name")
            expect(step1.picture).toBe("Profilbild")
        })

        it("should have proper German translations for step2", () => {
            const step2 = locales.de.completeAccount.step2
            expect(step2.title).toBe("Erforderliche Informationen Hinzufügen")
            expect(step2.password).toBe("Passwort")
            expect(step2.phone).toBe("Telefonnummer")
            expect(step2.birthDate).toBe("Geburtsdatum")
        })

        it("should have proper German translations for step3", () => {
            const step3 = locales.de.completeAccount.step3
            expect(step3.title).toBe("Überprüfen Sie Ihre Informationen")
            expect(step3.complete).toBe("Kontoeinrichtung Abschließen")
            expect(step3.success).toBe(
                "Kontoeinrichtung erfolgreich abgeschlossen!"
            )
        })

        it("should have proper German error messages", () => {
            const errors = locales.de.completeAccount.errors
            expect(errors.invalidEmail).toBe(
                "Bitte geben Sie eine gültige E-Mail-Adresse ein"
            )
            expect(errors.emailAlreadyRegistered).toBe(
                "Diese E-Mail wird bereits verwendet"
            )
            expect(errors.invalidPassword).toBe(
                "Passwort erfüllt nicht die Sicherheitsanforderungen"
            )
            expect(errors.userTooYoung).toBe(
                "Sie müssen mindestens 13 Jahre alt sein"
            )
        })
    })

    describe("Locale Switching", () => {
        it("should support switching between all locales", () => {
            const localeList = ["en", "pt-BR", "es", "de"] as const
            localeList.forEach(locale => {
                expect(locales[locale]).toBeDefined()
                expect(locales[locale].completeAccount).toBeDefined()
            })
        })

        it("should have consistent key structure when switching locales", () => {
            const localeList = ["en", "pt-BR", "es", "de"] as const
            const referenceKeys = Object.keys(locales.en.completeAccount).sort()

            localeList.forEach(locale => {
                const currentKeys = Object.keys(
                    locales[locale].completeAccount
                ).sort()
                expect(currentKeys).toEqual(referenceKeys)
            })
        })

        it("should have all locales available for complete account flow", () => {
            const localeList = ["en", "pt-BR", "es", "de"] as const
            localeList.forEach(locale => {
                const completeAccount = locales[locale].completeAccount
                expect(completeAccount.step).toBeDefined()
                expect(completeAccount.of).toBeDefined()
                expect(completeAccount.step1).toBeDefined()
                expect(completeAccount.step2).toBeDefined()
                expect(completeAccount.step3).toBeDefined()
            })
        })
    })

    describe("Password Requirements Translations", () => {
        it("should have all password requirement keys in all locales", () => {
            const requirementKeys = [
                "minLength",
                "uppercase",
                "lowercase",
                "number",
                "special",
                "strong",
                "weak",
            ]

            Object.entries(locales).forEach(([locale, translations]) => {
                const requirements =
                    translations.completeAccount.passwordRequirements
                requirementKeys.forEach(key => {
                    expect(
                        requirements[key as keyof typeof requirements]
                    ).toBeDefined()
                    expect(
                        typeof requirements[key as keyof typeof requirements]
                    ).toBe("string")
                })
            })
        })

        it("should have meaningful password requirement messages in English", () => {
            const requirements = locales.en.completeAccount.passwordRequirements
            expect(requirements.minLength).toContain("8")
            expect(requirements.uppercase).toContain("uppercase")
            expect(requirements.lowercase).toContain("lowercase")
            expect(requirements.number).toContain("number")
            expect(requirements.special).toContain("special")
        })
    })

    describe("Error Messages Translations", () => {
        it("should have all error message keys in all locales", () => {
            const errorKeys = [
                "invalidEmail",
                "emailAlreadyRegistered",
                "invalidPassword",
                "invalidPhone",
                "invalidBirthDate",
                "userTooYoung",
                "futureDate",
                "invalidToken",
                "serverError",
                "validationFailed",
            ]

            Object.entries(locales).forEach(([locale, translations]) => {
                const errors = translations.completeAccount.errors
                errorKeys.forEach(key => {
                    expect(errors[key as keyof typeof errors]).toBeDefined()
                    expect(typeof errors[key as keyof typeof errors]).toBe(
                        "string"
                    )
                })
            })
        })

        it("should have meaningful error messages in English", () => {
            const errors = locales.en.completeAccount.errors
            expect(errors.invalidEmail.toLowerCase()).toContain("email")
            expect(errors.emailAlreadyRegistered.toLowerCase()).toContain(
                "email"
            )
            expect(errors.invalidPassword.toLowerCase()).toContain("password")
            expect(errors.invalidPhone.toLowerCase()).toContain("phone")
            expect(errors.invalidBirthDate.toLowerCase()).toContain("birth")
            expect(errors.userTooYoung).toContain("13")
        })
    })
})
