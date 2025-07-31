import { type Locale } from "@/lib/i18n"
import PCOptimizationView from "./pc-optimization-view"

interface PCOptimizationLandingProps {
    locale: Locale
}

export default function PCOptimizationLanding({
    locale,
}: PCOptimizationLandingProps) {
    return <PCOptimizationView locale={locale} />
}
