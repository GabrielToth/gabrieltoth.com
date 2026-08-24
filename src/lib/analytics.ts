export function trackCustomEvent(
    eventName: string,
    properties?: Record<string, unknown>
): void {
    if (typeof window === "undefined") return

    // Vercel Analytics custom event track
    if (window.gtag) {
        window.gtag("event", eventName, properties)
    }

    // Console debug logging in development mode
    if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log(`[Analytics Event] ${eventName}:`, properties)
    }
}

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void
    }
}
