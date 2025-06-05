import { locales, type Locale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Geist, Geist_Mono } from "next/font/google"
import "../globals.css"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

interface LocaleLayoutProps {
    children: React.ReactNode
    params: Promise<{ locale: Locale }>
}

export async function generateStaticParams() {
    return locales.map(locale => ({ locale }))
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: Locale }>
}) {
    const { locale } = await params
    const isPortuguese = locale === "pt-BR"

    return {
        title: isPortuguese
            ? "Gabriel Toth - Desenvolvedor Full Stack"
            : "Gabriel Toth - Full Stack Developer",
        description: isPortuguese
            ? "Portfólio de Gabriel Toth Gonçalves - Desenvolvedor Full Stack especializado em React, Next.js, TypeScript e Node.js"
            : "Gabriel Toth Gonçalves Portfolio - Full Stack Developer specialized in React, Next.js, TypeScript and Node.js",
        keywords: isPortuguese
            ? "desenvolvedor, full stack, react, nextjs, typescript, nodejs, web development, gabriel toth"
            : "developer, full stack, react, nextjs, typescript, nodejs, web development, gabriel toth",
        authors: [{ name: "Gabriel Toth Gonçalves" }],
        openGraph: {
            title: isPortuguese
                ? "Gabriel Toth - Desenvolvedor Full Stack"
                : "Gabriel Toth - Full Stack Developer",
            description: isPortuguese
                ? "Portfólio de Gabriel Toth Gonçalves - Desenvolvedor Full Stack"
                : "Gabriel Toth Gonçalves Portfolio - Full Stack Developer",
            url: "https://gabrieltoth.com",
            siteName: "Gabriel Toth Portfolio",
            locale: locale,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: isPortuguese
                ? "Gabriel Toth - Desenvolvedor Full Stack"
                : "Gabriel Toth - Full Stack Developer",
            description: isPortuguese
                ? "Portfólio de Gabriel Toth Gonçalves - Desenvolvedor Full Stack"
                : "Gabriel Toth Gonçalves Portfolio - Full Stack Developer",
        },
        alternates: {
            canonical: "https://gabrieltoth.com",
            languages: {
                en: "https://gabrieltoth.com",
                "pt-BR": "https://gabrieltoth.com/pt-BR",
            },
        },
    }
}

export default async function LocaleLayout({
    children,
    params,
}: LocaleLayoutProps) {
    const { locale } = await params
    return (
        <html lang={locale} suppressHydrationWarning>
            <body
                className={cn(
                    geistSans.variable,
                    geistMono.variable,
                    "antialiased font-sans"
                )}
            >
                {children}
            </body>
        </html>
    )
}
