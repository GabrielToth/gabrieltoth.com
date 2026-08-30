"use client"

import { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslations } from "next-intl"
import { useTutorial } from "./tutorial-provider"
import type { TutorialStep } from "@/lib/tutorials/types"

const SPOTLIGHT_ID = "gt-spotlight-overlay"

function getElementRect(selector: string): DOMRect | null {
    const el = document.querySelector(selector)
    if (!el) return null
    return el.getBoundingClientRect()
}

function computePlacement(
    step: TutorialStep,
    rect: DOMRect,
    viewport: { w: number; h: number }
): "top" | "bottom" | "left" | "right" {
    if (step.placement && step.placement !== "auto") return step.placement
    const spaceTop = rect.top
    const spaceBottom = viewport.h - rect.bottom
    const spaceLeft = rect.left
    const spaceRight = viewport.w - rect.right
    const max = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight)
    if (max === spaceBottom) return "bottom"
    if (max === spaceTop) return "top"
    if (max === spaceRight) return "right"
    return "left"
}

export function TutorialOverlay() {
    const t = useTranslations("dashboard.tutorials")
    const { active, step, total, progressLabel, next, back, skip, close } =
        useTutorial()
    const [mounted, setMounted] = useState(false)
    const [rect, setRect] = useState<DOMRect | null>(null)
    const [viewport, setViewport] = useState({ w: 0, h: 0 })

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        function update() {
            if (!active) return
            const currentStep = active.steps[step]
            if (!currentStep) return
            setRect(getElementRect(currentStep.target))
            setViewport({ w: window.innerWidth, h: window.innerHeight })
        }
        update()
        window.addEventListener("resize", update)
        // Re-measure shortly after activation to let layout settle
        const timers = [400, 700].map(ms => window.setTimeout(update, ms))
        return () => {
            window.removeEventListener("resize", update)
            timers.forEach(clearTimeout)
        }
    }, [active, step])

    // Lock body scroll while the tutorial is active
    useEffect(() => {
        if (!active) {
            document.body.style.overflow = ""
            return
        }
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = ""
        }
    }, [active])

    const currentStep: TutorialStep | null = active?.steps[step] ?? null

    // Build the cutout mask so everything except the target is dimmed.
    const overlayStyle = useMemo(() => {
        if (!currentStep || !rect || viewport.w === 0) return null
        const cutout = {
            top: Math.max(0, rect.top - 6),
            left: Math.max(0, rect.left - 6),
            width: rect.width + 12,
            height: rect.height + 12,
        }
        return {
            clipPath: `polygon(
                0 0, 100% 0, 100% 100%, 0 100%,
                0 0,
                ${cutout.left}px 0,
                ${cutout.left}px ${cutout.top}px,
                ${cutout.left + cutout.width}px ${cutout.top}px,
                ${cutout.left + cutout.width}px ${cutout.top + cutout.height}px,
                ${cutout.left}px ${cutout.top + cutout.height}px,
                ${cutout.left}px 0,
                0 0
            )`,
        }
    }, [currentStep, rect, viewport.w])

    useLayoutEffect(() => {
        const el = mounted ? document.getElementById(SPOTLIGHT_ID) : null
        if (el && overlayStyle) {
            el.style.clipPath = overlayStyle.clipPath
        }
    })

    if (!mounted || !active || !currentStep || !overlayStyle) return null

    let tooltip: { left: number; top: number; arrow?: string } | null = null
    if (rect) {
        const placement = computePlacement(currentStep, rect, viewport)
        const gap = 14
        const TOOLTIP_W = 320
        if (placement === "bottom") {
            tooltip = {
                left: Math.min(
                    Math.max(12, rect.left + rect.width / 2 - TOOLTIP_W / 2),
                    viewport.w - TOOLTIP_W - 12
                ),
                top: rect.bottom + gap,
            }
        } else if (placement === "top") {
            tooltip = {
                left: Math.min(
                    Math.max(12, rect.left + rect.width / 2 - TOOLTIP_W / 2),
                    viewport.w - TOOLTIP_W - 12
                ),
                top: Math.max(12, rect.top - gap),
            }
        } else if (placement === "left") {
            tooltip = {
                left: Math.max(12, rect.left - TOOLTIP_W - gap),
                top: Math.max(12, rect.top + rect.height / 2 - 80),
            }
        } else {
            tooltip = {
                left: Math.min(viewport.w - TOOLTIP_W - 12, rect.right + gap),
                top: Math.max(12, rect.top + rect.height / 2 - 80),
            }
        }
    }

    return createPortal(
        <div
            id={SPOTLIGHT_ID}
            aria-label={t("ariaOverlay")}
            className="fixed inset-0 z-[9999]"
            style={{
                background: "rgba(0,0,0,0.65)",
                clipPath: overlayStyle.clipPath,
            }}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
        >
            {/* Focus trap backdrop that intercepts clicks on the dimmed area */}
            <div className="fixed inset-0" aria-hidden />
            {/* Highlight ring around the target */}
            {rect && (
                <div
                    className="fixed rounded-lg border-2 border-white/90 pointer-events-none"
                    style={{
                        left: Math.max(0, rect.left - 7),
                        top: Math.max(0, rect.top - 7),
                        width: rect.width + 14,
                        height: rect.height + 14,
                    }}
                />
            )}

            {/* Tooltip card */}
            <div
                className="fixed z-[10000] w-[320px] max-w-[calc(100vw-24px)] rounded-xl bg-background p-4 shadow-2xl ring-1 ring-border"
                style={{
                    left: tooltip?.left ?? 12,
                    top: tooltip?.top ?? 12,
                }}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {active.isOnboarding
                            ? t("onboardingLabel")
                            : t("tutorialLabel")}
                    </span>
                    <button
                        type="button"
                        onClick={close}
                        aria-label={t("close")}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        ✕
                    </button>
                </div>

                <h3 className="mt-2 text-sm font-semibold text-foreground">
                    {t(`stepTitles.${currentStep.title}`, {
                        defaultValue: currentStep.title,
                    })}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    {t(`stepDescriptions.${currentStep.description}`, {
                        defaultValue: currentStep.description,
                    })}
                </p>

                <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        {t("stepXofY", {
                            current: String(step + 1),
                            total: String(total),
                        })}
                        <span className="ml-2 text-primary">
                            {progressLabel}
                        </span>
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={skip}
                            className="rounded-md px-2 py-1 text-xs text-muted-foreground underline hover:text-foreground"
                        >
                            {t("skip")}
                        </button>
                        {step > 0 && (
                            <button
                                type="button"
                                onClick={back}
                                className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
                            >
                                {t("back")}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={next}
                            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            {step + 1 < total ? t("next") : t("finish")}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
