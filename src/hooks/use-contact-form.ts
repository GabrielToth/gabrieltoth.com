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

export function useContactForm() {
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

    return { status, setStatus }
}
