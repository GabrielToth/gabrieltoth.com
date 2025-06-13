import { ThemeProvider } from "@/components/theme/theme-provider"
import { ThemeScript } from "@/components/theme/theme-script"
import { Analytics } from "@vercel/analytics/next"
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
    title: "Gabriel Toth Gonçalves - Full Stack Developer",
    description: "Gabriel Toth Gonçalves Portfolio - Full Stack Developer",
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
                <Analytics />
            </body>
        </html>
    )
}
