"use client"

import { ReactNode } from "react"

interface PageHeaderProps {
    eyebrow: string | ReactNode
    title: string | ReactNode
    subtitle?: string | ReactNode
    className?: string
    containerClassName?: string
    children?: ReactNode
}

export default function PageHeader({
    eyebrow,
    title,
    subtitle,
    className = "",
    containerClassName = "",
    children,
}: PageHeaderProps) {
    return (
        <section className={`w-full py-16 md:py-24 bg-muted dark:from-blue-900/20 dark:to-primary/10 ${className}`}>
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center ${containerClassName}`}>
                <div className="flex flex-col items-center justify-center space-y-4">
                    {/* Eyebrow text - small uppercase */}
                    <div className="inline-block">
                        <div className="bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary text-sm font-semibold px-4 py-2 rounded-full">
                            {eyebrow}
                        </div>
                    </div>

                    {/* Main title - fixed size, centered, consistent height */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground dark:text-foreground leading-tight max-w-5xl">
                        {title}
                    </h1>

                    {/* Optional subtitle */}
                    {subtitle && (
                        <p className="text-xl text-muted-foreground dark:text-foreground max-w-3xl leading-relaxed">
                            {subtitle}
                        </p>
                    )}

                    {/* Optional children (CTA buttons, etc) */}
                    {children}
                </div>
            </div>
        </section>
    )
}
