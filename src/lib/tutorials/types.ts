/**
 * Tutorial domain types
 * Onboarding & per-category guided tutorials for the dashboard.
 *
 * A tutorial is an ordered list of steps. Each step targets an element in the
 * DOM via a CSS selector, highlights it with a spotlight, and shows an
 * instructional card with progress (step X of Y). The user can advance,
 * go back, or skip the whole tutorial at any time.
 */

export type TutorialPlacement =
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "auto"

export interface TutorialStep {
    /** index of the step (0-based) */
    index: number
    /** CSS selector for the DOM element to highlight */
    target: string
    /** Title key under dashboard.tutorials.stepTitles (or literal fallback) */
    title: string
    /** Description key under dashboard.tutorials.stepDescriptions */
    description: string
    /** preferred tooltip placement */
    placement?: TutorialPlacement
    /** a data-attribute hint used by the discover page step logic */
    actionHint?: string
}

export interface Tutorial {
    /** stable id, e.g. "onboarding", "publish", "channels" */
    id: string
    /** category this tutorial belongs to (nav tab id, or "onboarding") */
    category: DashboardCategory | "onboarding"
    /** title translation key under dashboard.tutorials.titles */
    titleKey: string
    steps: TutorialStep[]
    /** whether this is the first-run onboarding flow */
    isOnboarding?: boolean
}

export type DashboardCategory =
    | "publish"
    | "live"
    | "insights"
    | "channels"
    | "settings"
    | "discover"
    | "repost"
    | "cloner"

export const DASHBOARD_CATEGORIES: DashboardCategory[] = [
    "discover",
    "publish",
    "live",
    "insights",
    "channels",
    "repost",
    "cloner",
    "settings",
]

export interface TutorialStepState {
    step: number
    total: number
    tutorial: Tutorial
}
