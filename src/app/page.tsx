import { redirect } from "next/navigation"

export default function HomePage() {
    // This page should not be accessible due to middleware
    // Users should be redirected to the locale-specific pages
    // But in case they reach here, redirect to English version
    redirect("/en")
}
