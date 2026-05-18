/**
 * Auth security logging — suppresses expected validation errors during Vitest
 * so stderr stays clean while production still logs real failures.
 */

export function shouldSuppressAuthSecurityStderr(): boolean {
    return process.env.SUPPRESS_AUTH_SECURITY_STDERR === "true"
}

export function logAuthConfigLoadError(error: unknown): void {
    if (shouldSuppressAuthSecurityStderr()) return
    console.error("❌ Failed to load security configuration:", error)
}

export function logPasswordHashingError(
    message: string,
    detail?: Record<string, unknown>
): void {
    if (shouldSuppressAuthSecurityStderr()) return
    console.error(message, detail ?? {})
}

export function logPepperConfigurationError(message: string): void {
    if (shouldSuppressAuthSecurityStderr()) return
    console.error("❌ Pepper configuration error:", message)
}
