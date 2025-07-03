import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function PCOptimizationRedirect() {
    const headersList = await headers()
    const acceptLanguage = headersList.get("accept-language") || ""

    // Detecta se o usuário prefere inglês
    const preferredLocale =
        acceptLanguage.includes("en") && !acceptLanguage.includes("pt")
            ? "en"
            : "pt-BR"

    redirect(`/${preferredLocale}/pc-optimization`)
}
