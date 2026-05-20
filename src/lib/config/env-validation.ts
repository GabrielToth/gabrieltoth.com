/**
 * Strict runtime environment validation.
 * No hardcoded production URLs — missing or placeholder values fail fast.
 */

export class EnvValidationError extends Error {
    constructor(
        public readonly variable: string,
        message: string
    ) {
        super(message)
        this.name = "EnvValidationError"
    }
}

const PLACEHOLDER_SUBSTRINGS = [
    "your-production-",
    "your-",
    "-here",
    "changeme",
    "change-me",
    "example.com",
    "yourdomain.com",
    "your-domain.com",
    "placeholder",
    "xxx",
    "todo",
]

/** Legacy template domain — replace with your own site URL. */
const TEMPLATE_DOMAIN = "gabrieltoth.com"

function isTruthy(value: string | undefined): boolean {
    if (!value) return false
    const v = value.trim().toLowerCase()
    return v === "1" || v === "true" || v === "yes"
}

export function isDebugEnabled(): boolean {
    return isTruthy(process.env.DEBUG)
}

export function deriveApiUrl(appUrl: string): string {
    const base = appUrl.replace(/\/$/, "")
    return `${base}/api`
}

function looksLikePlaceholder(name: string, value: string): boolean {
    const lower = value.toLowerCase()
    if (PLACEHOLDER_SUBSTRINGS.some(p => lower.includes(p))) {
        return true
    }
    if (name === "NEXT_PUBLIC_APP_URL" && lower.includes(TEMPLATE_DOMAIN)) {
        return true
    }
    if (name.includes("SECRET") || name.includes("KEY") || name.includes("TOKEN")) {
        if (
            lower.includes("dev-") &&
            (lower.includes("test") || lower.includes("only"))
        ) {
            return true
        }
        if (lower === "test" || lower === "secret" || lower.length < 16) {
            return true
        }
    }
    return false
}

export function requireEnv(name: string): string {
    const value = process.env[name]?.trim()
    if (!value) {
        throw new EnvValidationError(
            name,
            `Missing required environment variable: ${name}\n` +
                `Copy .env.local.example to .env.local (or .env.production.example to .env.production) and set a real value.`
        )
    }
    if (looksLikePlaceholder(name, value)) {
        throw new EnvValidationError(
            name,
            `Environment variable ${name} still has a template/placeholder value.\n` +
                `Update ${name} to your real value (e.g. your own domain URL, not ${TEMPLATE_DOMAIN}).`
        )
    }
    return value
}

export function requireEnvWhen(condition: boolean, name: string): string | undefined {
    if (!condition) return undefined
    return requireEnv(name)
}

export function getAppUrl(): string {
    return requireEnv("NEXT_PUBLIC_APP_URL").replace(/\/$/, "")
}

export function getApiUrl(): string {
    return deriveApiUrl(getAppUrl())
}

/**
 * Validate env on server startup (skipped in Vitest unless ENFORCE_ENV_VALIDATION=true).
 */
export function validateRuntimeEnv(): void {
    if (process.env.VITEST === "true" && process.env.ENFORCE_ENV_VALIDATION !== "true") {
        return
    }

    const isProduction = process.env.NODE_ENV === "production"
    const errors: EnvValidationError[] = []

    const check = (name: string) => {
        try {
            requireEnv(name)
        } catch (e) {
            if (e instanceof EnvValidationError) errors.push(e)
            else throw e
        }
    }

    check("NEXT_PUBLIC_APP_URL")

    if (isProduction) {
        check("NEXT_PUBLIC_SUPABASE_URL")
        check("SUPABASE_SERVICE_ROLE_KEY")
    } else if (process.env.SKIP_DATABASE !== "true") {
        try {
            check("DATABASE_URL")
        } catch {
            /* optional when using Supabase-only local */
        }
    }

    if (errors.length === 1) {
        throw errors[0]
    }
    if (errors.length > 1) {
        throw new Error(
            `Multiple environment variables need configuration:\n${errors.map(e => `  - ${e.variable}: ${e.message.split("\n")[0]}`).join("\n")}\nFix one variable at a time and restart.`
        )
    }
}
