"use client"

import { Home, Mail } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function ServerError() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-8xl font-bold text-red-600 dark:text-red-400 mb-4">
                        500
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Loading...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center px-4">
            <div className="max-w-2xl mx-auto text-center">
                {/* Error Section */}
                <div className="mb-12">
                    <h1 className="text-8xl font-bold text-red-600 dark:text-red-400 mb-4">
                        500
                    </h1>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Internal Server Error
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                        We're sorry, but something went wrong on our server. Our
                        team has been notified and is working to fix the issue.
                        Please try again later.
                    </p>
                </div>

                {/* Navigation Options */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        <Home className="mr-2" size={20} />
                        Return to Home
                    </Link>
                    <Link
                        href="mailto:support@example.com"
                        className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Mail className="mr-2" size={20} />
                        Contact Support
                    </Link>
                </div>

                {/* Help Text */}
                <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
                    <p>Error ID: {Math.random().toString(36).substring(7)}</p>
                    <p className="mt-2">
                        If you continue to experience issues, please reach out
                        to our support team.
                    </p>
                </div>
            </div>
        </div>
    )
}
