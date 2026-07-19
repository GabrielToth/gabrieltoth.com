"use client"

interface PageHeaderProps {
    eyebrow: string
    title: string
    subtitle?: string
    className?: string
}

export default function PageHeader({
    eyebrow,
    title,
    subtitle,
    className = "",
}: PageHeaderProps) {
    return (
        <div className={`w-full py-16 md:py-24 ${className}`}>
            <div className="flex flex-col items-center justify-center text-center space-y-4">
                {/* Eyebrow text */}
                <div className="inline-block">
                    <span className="text-sm md:text-base font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {eyebrow}
                    </span>
                </div>

                {/* Main title - fixed size, centered */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight max-w-4xl">
                    {title}
                </h1>

                {/* Optional subtitle */}
                {subtitle && (
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    )
}
