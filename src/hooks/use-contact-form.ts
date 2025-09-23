"use client"

import { useState } from "react"

export function useContactForm() {
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

    return { status, setStatus }
}
