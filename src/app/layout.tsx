import { type Metadata } from "next"

export const metadata: Metadata = {
    title: "Gabriel Toth - Full Stack Developer",
    description: "Gabriel Toth Gonçalves Portfolio - Full Stack Developer",
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html>
            <body>{children}</body>
        </html>
    )
}
