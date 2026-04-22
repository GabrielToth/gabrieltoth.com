import { RegistrationFlow } from "@/components/registration/RegistrationFlow"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Create Account",
    description: "Sign up for a new account",
}

export default function RegisterPage() {
    return <RegistrationFlow />
}
