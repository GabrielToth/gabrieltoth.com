import { type Locale } from "@/lib/i18n"

interface FooterProps {
    locale: Locale
}

export default function Footer({ locale }: FooterProps) {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="py-8 bg-background border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-muted-foreground">
                    © {currentYear} Gabriel Toth Gonçalves.{" "}
                    {locale === "pt-BR"
                        ? "Todos os direitos reservados."
                        : "All rights reserved."}
                </p>
            </div>
        </footer>
    )
}
