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

        // Check if there's a saved theme preference
        const savedTheme = localStorage.getItem("theme") as Theme | null

        // Use saved theme or default to dark
        const initialTheme = savedTheme || "dark"
        setTheme(initialTheme)

        // Apply theme to document
        document.documentElement.classList.remove("light", "dark")
        document.documentElement.classList.add(initialTheme)
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light"
        setTheme(newTheme)
        localStorage.setItem("theme", newTheme)

        // Apply theme to document
        document.documentElement.classList.remove("light", "dark")
        document.documentElement.classList.add(newTheme)
    }

    // Prevent hydration mismatch
    if (!mounted) {
        return <div className="dark">{children}</div>
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <div className={theme}>{children}</div>
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
