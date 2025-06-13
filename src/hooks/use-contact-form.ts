"use client"

import { useState } from "react"

interface ContactFormData {
    name: string
    email: string
    subject: string
    message: string
    honeypot?: string // Anti-spam field
}

interface FormStatus {
    status: "idle" | "loading" | "success" | "error"
    message?: string
}

// Lista de domínios de email aceitos
const ALLOWED_EMAIL_DOMAINS = [
    "gmail.com",
    "outlook.com",
    "hotmail.com",
    "yahoo.com",
    "icloud.com",
    "proton.me",
    "protonmail.com",
    "company.com", // Emails corporativos genéricos
    "empresa.com.br",
    "uol.com.br",
    "bol.com.br",
    "terra.com.br",
    "ig.com.br",
]

export function useContactForm(locale: "en" | "pt-BR") {
    const [formData, setFormData] = useState<ContactFormData>({
        name: "",
        email: "",
        subject: "",
        message: "",
        honeypot: "",
    })

    const [status, setStatus] = useState<FormStatus>({ status: "idle" })

    const isPortuguese = locale === "pt-BR"

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) return false

        const domain = email.split("@")[1]?.toLowerCase()
        return ALLOWED_EMAIL_DOMAINS.some(
            allowedDomain =>
                domain === allowedDomain ||
                domain?.endsWith(`.${allowedDomain}`)
        )
    }

    const validateName = (name: string): string | null => {
        if (!name.trim()) {
            return isPortuguese ? "Nome é obrigatório" : "Name is required"
        }

        if (name.length < 2) {
            return isPortuguese
                ? "Nome deve ter pelo menos 2 caracteres"
                : "Name must be at least 2 characters"
        }

        // Check for numbers in name
        if (/\d/.test(name)) {
            return isPortuguese
                ? "Nome não deve conter números"
                : "Name should not contain numbers"
        }

        return null
    }

    const validateEmailField = (email: string): string | null => {
        if (!email.trim()) {
            return isPortuguese ? "Email é obrigatório" : "Email is required"
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return isPortuguese
                ? "Formato de email inválido"
                : "Invalid email format"
        }

        if (!validateEmail(email)) {
            return isPortuguese
                ? "Email deve ser de um provedor confiável (Gmail, Outlook, Yahoo, etc.)"
                : "Email must be from a trusted provider (Gmail, Outlook, Yahoo, etc.)"
        }

        return null
    }

    const validateSubject = (subject: string): string | null => {
        if (!subject.trim()) {
            return isPortuguese
                ? "Assunto é obrigatório"
                : "Subject is required"
        }

        if (subject.length < 3) {
            return isPortuguese
                ? "Assunto deve ter pelo menos 3 caracteres"
                : "Subject must be at least 3 characters"
        }

        if (subject.length > 100) {
            return isPortuguese
                ? "Assunto deve ter no máximo 100 caracteres"
                : "Subject must be at most 100 characters"
        }

        return null
    }

    const validateMessage = (message: string): string | null => {
        if (!message.trim()) {
            return isPortuguese
                ? "Mensagem é obrigatória"
                : "Message is required"
        }

        if (message.length < 10) {
            return isPortuguese
                ? "Mensagem deve ter pelo menos 10 caracteres"
                : "Message must be at least 10 characters"
        }

        if (message.length > 1000) {
            return isPortuguese
                ? "Mensagem deve ter no máximo 1000 caracteres"
                : "Message must be at most 1000 characters"
        }

        return null
    }

    const validateForm = (): string | null => {
        const nameError = validateName(formData.name)
        if (nameError) return nameError

        const emailError = validateEmailField(formData.email)
        if (emailError) return emailError

        const subjectError = validateSubject(formData.subject)
        if (subjectError) return subjectError

        const messageError = validateMessage(formData.message)
        if (messageError) return messageError

        // Anti-spam: honeypot field should be empty
        if (formData.honeypot && formData.honeypot.trim()) {
            return "Spam detected"
        }

        return null
    }

    const submitForm = async () => {
        const validationError = validateForm()
        if (validationError) {
            setStatus({ status: "error", message: validationError })
            return
        }

        setStatus({ status: "loading" })

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.trim().toLowerCase(),
                    subject: formData.subject.trim(),
                    message: formData.message.trim(),
                    locale,
                }),
            })

            if (response.ok) {
                setStatus({
                    status: "success",
                    message: isPortuguese
                        ? "Mensagem enviada com sucesso! Retornarei em breve."
                        : "Message sent successfully! I'll get back to you soon.",
                })
                setFormData({
                    name: "",
                    email: "",
                    subject: "",
                    message: "",
                    honeypot: "",
                })
            } else {
                const errorData = await response.json()
                setStatus({
                    status: "error",
                    message:
                        errorData.message ||
                        (isPortuguese
                            ? "Erro ao enviar mensagem. Tente novamente."
                            : "Error sending message. Please try again."),
                })
            }
        } catch {
            setStatus({
                status: "error",
                message: isPortuguese
                    ? "Erro de conexão. Verifique sua internet e tente novamente."
                    : "Connection error. Check your internet and try again.",
            })
        }
    }

    const updateField = (field: keyof ContactFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (status.status === "error") {
            setStatus({ status: "idle" })
        }
    }

    return {
        formData,
        status,
        updateField,
        submitForm,
        isValid: validateForm() === null,
        validateName,
        validateEmailField,
        validateSubject,
        validateMessage,
    }
}
