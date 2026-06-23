"use client"

import { LocalEnvsProvider } from "@/lib/local-envs"
import dynamic from "next/dynamic"

const SettingsContainer = dynamic(
    () =>
        import("@/components/settings/SettingsContainer").then(
            m => m.SettingsContainer
        ),
    { ssr: false }
)

export default function SettingsPage() {
    return (
        <LocalEnvsProvider>
            <SettingsContainer />
        </LocalEnvsProvider>
    )
}
