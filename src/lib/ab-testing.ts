export type ABVariant = "control" | "variant_a" | "variant_b"

export function getABVariant(experimentId: string): ABVariant {
    if (typeof window === "undefined") return "control"

    const storageKey = `ab_exp_${experimentId}`
    const existing = localStorage.getItem(storageKey) as ABVariant | null
    if (existing) return existing

    // Simple deterministic random assignment (50% control, 50% variant_a)
    const assigned: ABVariant = Math.random() < 0.5 ? "control" : "variant_a"
    try {
        localStorage.setItem(storageKey, assigned)
    } catch {
        // Ignore quota/storage errors
    }
    return assigned
}
