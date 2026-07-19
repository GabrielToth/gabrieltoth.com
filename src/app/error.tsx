"use client"

import { Home } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Log error for monitoring
        console.error("Root error:", error)
    }, [error])

    if (!mounted) {
        return (
            <div className="min-h-screen bg-linear-to-br from-gray-50 to-primary/5 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-8xl font-bold text-red-600 dark:text-red-400 mb-4">
                        Error
                    </h1>
                    <p className="text-lg text-muted-foreground dark:text-foreground">
                        Loading...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-primary/5 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center px-4">
            <div className="max-w-2xl mx-auto text-center">
                {/* Error Section */}
                <div className="mb-12">
                    <h1 className="text-8xl font-bold text-red-600 dark:text-red-400 mb-4">
                        Error
                    </h1>
                    <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
                        Something went wrong
                    </h2>
                    <p className="text-lg text-muted-foreground dark:text-foreground mb-8">
                        We encountered an unexpected error. Please try again or
                        return to the home page.
                    </p>
                    {error.message && (
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4 font-mono bg-muted dark:bg-card p-4 rounded">
                            {error.message}
                        </p>
                    )}
                </div>

                {/* Navigation Options */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary transition-colors"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 border border-input dark:border-input text-foreground dark:text-foreground rounded-lg font-medium hover:bg-muted dark:hover:bg-accent transition-colors"
                    >
                        <Home className="mr-2" size={20} />
                        Home Page
                    </Link>
                </div>

                {/* Help Text */}
                <div className="mt-8 text-sm text-muted-foreground dark:text-muted-foreground">
                    <p>
                        If this problem persists, please contact us for support.
                    </p>
                </div>
            </div>
        </div>
    )
}
