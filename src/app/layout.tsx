import PerformanceMonitor from "@/components/analytics/performance-monitor"
import WebVitalsReport from "@/components/analytics/web-vitals"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { ThemeScript } from "@/components/theme/theme-script"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { type Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "Gabriel Toth - Full Stack Developer and Data Scientist",
    description:
        "Full Stack Developer and Data Scientist with expertise in React, Next.js, Angular, Node.js, and TypeScript. I'm also a passionate about AI and Machine Learning using Python, Power BI, and SQL.",
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning className="dark">
            <head>
                <ThemeScript />
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
                suppressHydrationWarning
            >
                <ThemeProvider>{children}</ThemeProvider>
                <WebVitalsReport />
                <PerformanceMonitor />
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    )
}
