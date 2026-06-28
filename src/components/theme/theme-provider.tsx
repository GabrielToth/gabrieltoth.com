"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark")
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)

        // Sync React state with the class already set by ThemeScript.
        // If no class is set (SSR render, tests), fall back to default.
        const isDark = document.documentElement.classList.contains("dark")
        const isLight = document.documentElement.classList.contains("light")
        const resolved: Theme = isDark ? "dark" : isLight ? "light" : "dark"

        setTheme(resolved)

        if (typeof document !== "undefined") {
            document.documentElement.classList.remove("light", "dark")
            document.documentElement.classList.add(resolved)
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light"
        setTheme(newTheme)

        if (typeof window !== "undefined") {
            localStorage.setItem("theme", newTheme)
        }

        if (typeof document !== "undefined") {
            document.documentElement.classList.remove("light", "dark")
            document.documentElement.classList.add(newTheme)
        }
    }

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
