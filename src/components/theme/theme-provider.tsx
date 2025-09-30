"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark") // Default to dark
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)

        // Check if there's a saved theme preference (only on client)
        const savedTheme =
            typeof window !== "undefined"
                ? (localStorage.getItem("theme") as Theme | null)
                : null

        // Use saved theme or default to dark
        const initialTheme = savedTheme || "dark"
        setTheme(initialTheme)

        // Apply theme to document (only on client)
        if (typeof document !== "undefined") {
            document.documentElement.classList.remove("light", "dark")
            document.documentElement.classList.add(initialTheme)
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light"
        setTheme(newTheme)

        // Save theme preference (only on client)
        if (typeof window !== "undefined") {
            localStorage.setItem("theme", newTheme)
        }

        // Apply theme to document (only on client)
        if (typeof document !== "undefined") {
            document.documentElement.classList.remove("light", "dark")
            document.documentElement.classList.add(newTheme)
        }
    }

    // Always provide context; use fallback class before mount to avoid mismatch
    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <div className={mounted ? theme : "dark"}>{children}</div>
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context
}
