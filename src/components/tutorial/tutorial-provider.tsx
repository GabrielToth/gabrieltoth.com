"use client"

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react"
import {
    getTutorialById,
    ONBOARDING_TUTORIAL,
} from "@/lib/tutorials/definitions"
import type { Tutorial, TutorialStepState } from "@/lib/tutorials/types"

/** localStorage key remembering that onboarding has been shown/completed */
const ONBOARDING_SEEN_KEY = "gt_onboarding_seen"
/** localStorage key for users who explicitly skip onboarding */
const ONBOARDING_SKIPPED_KEY = "gt_onboarding_skipped"

export interface TutorialContextValue {
    active: Tutorial | null
    /** 0-based current step */
    step: number
    total: number
    /** progress text helper, e.g. "3 / 5" */
    progressLabel: string
    start: (id: string) => void
    next: () => void
    back: () => void
    skip: () => void
    close: () => void
    /** run the first-run onboarding flow (no-op if seen/skipped) */
    maybeRunOnboarding: () => void
}

const TutorialContext = createContext<TutorialContextValue | null>(null)

// Safe no-op fallback used when a component reads the context without a
// TutorialProvider ancestor (e.g. in isolated component tests). At runtime the
// dashboard layout always wraps pages in the provider.
const NOOP_CONTEXT: TutorialContextValue = {
    active: null,
    step: 0,
    total: 0,
    progressLabel: "",
    start: () => {},
    next: () => {},
    back: () => {},
    skip: () => {},
    close: () => {},
    maybeRunOnboarding: () => {},
}

function isBrowser() {
    return typeof window !== "undefined"
}

function getLS(key: string): string | null {
    if (!isBrowser()) return null
    try {
        return window.localStorage.getItem(key)
    } catch {
        return null
    }
}

function setLS(key: string, value: string) {
    if (!isBrowser()) return
    try {
        window.localStorage.setItem(key, value)
    } catch {
        // storage unavailable — ignore
    }
}

export function TutorialProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const [active, setActive] = useState<Tutorial | null>(null)
    const [step, setStep] = useState(0)
    const total = active?.steps.length ?? 0
    const pendingStart = useRef<string | null>(null)

    const start = useCallback((id: string) => {
        const tutorial = getTutorialById(id)
        if (!tutorial) return
        pendingStart.current = id
        setStep(0)
        setActive(tutorial)
    }, [])

    // After the tutorial becomes active, wait a tick for the target to
    // render/scroll into view.
    useEffect(() => {
        if (!active) return
        const id = pendingStart.current
        if (!id) return
        pendingStart.current = null
        const t = getTutorialById(id)
        if (!t) return
        const firstTarget = t.steps[0]?.target
        if (firstTarget) {
            requestAnimationFrame(() => {
                document.querySelector(firstTarget)?.scrollIntoView({
                    block: "center",
                    behavior: "smooth",
                })
            })
        }
    }, [active])

    const next = useCallback(() => {
        const total2 = active?.steps.length ?? 0
        if (step + 1 >= total2) {
            // finished / on last step → close
            if (active?.isOnboarding) setLS(ONBOARDING_SEEN_KEY, "1")
            setActive(null)
            return
        }
        setStep(s => s + 1)
    }, [step, active])

    const back = useCallback(() => {
        setStep(s => Math.max(0, s - 1))
    }, [])

    const close = useCallback(() => {
        setActive(null)
    }, [])

    const skip = useCallback(() => {
        if (active?.isOnboarding) setLS(ONBOARDING_SKIPPED_KEY, "1")
        setActive(null)
        setStep(0)
    }, [active])

    const maybeRunOnboarding = useCallback(() => {
        if (getLS(ONBOARDING_SKIPPED_KEY) === "1") return
        if (getLS(ONBOARDING_SEEN_KEY) === "1") return
        start(ONBOARDING_TUTORIAL.id)
    }, [start])

    const progressLabel = total > 0 ? `${step + 1} / ${total}` : ""

    const value: TutorialContextValue = {
        active,
        step,
        total,
        progressLabel,
        start,
        next,
        back,
        skip,
        close,
        maybeRunOnboarding,
    }

    return (
        <TutorialContext.Provider value={value}>
            {children}
        </TutorialContext.Provider>
    )
}

export function useTutorial(): TutorialContextValue {
    return useContext(TutorialContext) ?? NOOP_CONTEXT
}

export type { TutorialStepState }
