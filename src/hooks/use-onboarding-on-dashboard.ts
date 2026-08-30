"use client"

import { useEffect } from "react"
import { useTutorial } from "@/components/tutorial/tutorial-provider"

const ONBOARDING_RUN_KEY = "gt_onboarding_run"

/**
 * Runs the first-run onboarding tour once per session after the user lands
 * on the dashboard. The provider itself remembers skip/seen in localStorage,
 * so returning users are not shown the tour again.
 */
export function useOnboardingOnDashboard() {
    const { maybeRunOnboarding } = useTutorial()

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            maybeRunOnboarding()
        }, 600)
        return () => window.clearTimeout(timeout)
    }, [maybeRunOnboarding])
}
