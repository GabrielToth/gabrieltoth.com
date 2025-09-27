import { permanentRedirect } from "next/navigation"

export default function PrivacyPolicyRedirect() {
    permanentRedirect("/en/privacy-policy")
}
