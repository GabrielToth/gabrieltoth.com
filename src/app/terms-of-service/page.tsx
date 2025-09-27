import { permanentRedirect } from "next/navigation"

export default function TermsOfServiceRedirect() {
    permanentRedirect("/en/terms-of-service")
}
