import PerformanceMonitor from "@/components/analytics/performance-monitor"
import WebVitalsReport from "@/components/analytics/web-vitals"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { type Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: "swap",
    preload: true,
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
    preload: true,
})

export const metadata: Metadata = {
    title: "Gabriel Toth - Full Stack Developer and Data Scientist",
    description:
        "Full Stack Developer and Data Scientist with expertise in React, Next.js, Angular, Node.js, and TypeScript. I'm also a passionate about AI and Machine Learning using Python, Power BI, and SQL.",
    verification: {
        google: "fVicNNO_4aWcDq42OHAegho77k6dkOLqmzZg1afnwFU",
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const isProd = process.env.NODE_ENV === "production"

    return (
        <html suppressHydrationWarning className="dark">
            <body>
                <ThemeProvider>
                    <div
                        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
                    >
                        {children}
                    </div>
                    {isProd && (
                        <>
                            <WebVitalsReport />
                            <PerformanceMonitor />
                            <Analytics />
                            <SpeedInsights />
                        </>
                    )}
                </ThemeProvider>
            </body>
        </html>
    )
}
