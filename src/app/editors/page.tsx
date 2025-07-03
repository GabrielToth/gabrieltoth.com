import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function EditorsRedirect() {
    const headersList = await headers()
    const acceptLanguage = headersList.get("accept-language") || ""

    // Detect if user prefers English - redirect to "editores" in locale structure
    const preferredLocale =
        acceptLanguage.includes("en") && !acceptLanguage.includes("pt")
            ? "en"
            : "pt-BR"

    redirect(`/${preferredLocale}/editors`)
}
