"use client"

import { useEffect, useState } from "react"
import { ThemeToggle } from "./theme-toggle"

export function ThemeToggleClient() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Don't render during SSR
    if (!mounted) {
        return (
            <div className="w-9 h-9 p-0 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"></div>
        )
    }

    return <ThemeToggle />
}
