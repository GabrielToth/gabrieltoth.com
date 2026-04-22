"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface SuccessMessageProps {
    message?: string
    redirectUrl?: string
    redirectDelay?: number
}

export function SuccessMessage({
    message = "Account created successfully!",
    redirectUrl = "/login",
    redirectDelay = 2000,
}: SuccessMessageProps) {
    const router = useRouter()
    const [countdown, setCountdown] = useState(redirectDelay / 1000)

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    router.push(redirectUrl)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [redirectUrl, router])

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 text-center">
                <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-green-600 dark:text-green-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Success!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {message}
                </p>

                <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                        Redirecting to login in{" "}
                        <span className="font-bold">{countdown}</span>{" "}
                        seconds...
                    </p>
                </div>

                <button
                    onClick={() => router.push(redirectUrl)}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors min-h-[44px]"
                >
                    Go to Login Now
                </button>
            </div>
        </div>
    )
}
