import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import fs from "fs"
import path from "path"
import React from "react"
import { createDbModuleMock } from "./src/test-utils/db-mock"
import { afterEach, vi } from "vitest"

process.env.VITEST = "true"
process.env.DEBUG = "false"
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"

// Supabase environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://test.supabase.co"
process.env.SUPABASE_SERVICE_ROLE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "test-service-role-key-with-minimum-length-required-for-validation"

// Token encryption key for tests (must be minimum 32 characters)
process.env.TOKEN_ENCRYPTION_KEY =
    process.env.TOKEN_ENCRYPTION_KEY || "a".repeat(64) // 64-character hex string (32 bytes)

vi.mock("@/lib/config/env-validation", async importOriginal => {
    const actual =
        await importOriginal<typeof import("@/lib/config/env-validation")>()
    return {
        ...actual,
        validateRuntimeEnv: () => {},
    }
})
process.env.SUPPRESS_SECURITY_CONFIG_LOGS = "true"
process.env.SUPPRESS_AUTH_SECURITY_STDERR = "true"

const noop = () => {}

const allowedStderrPatterns = [
    /GoTrueClient@.*Multiple GoTrueClient instances/,
    /It is not an error, but this should be avoided/,
]

const originalConsoleError = console.error
const originalConsoleWarn = console.warn

console.error = (...args: unknown[]) => {
    const msg = args.map(a => String(a)).join(" ")
    if (allowedStderrPatterns.some(p => p.test(msg))) return
    originalConsoleError(...args)
}

console.warn = (...args: unknown[]) => {
    const msg = args.map(a => String(a)).join(" ")
    if (allowedStderrPatterns.some(p => p.test(msg))) return
    originalConsoleWarn(...args)
}

const mockLogger = {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    fatal: noop,
}

vi.mock("@/lib/logger", () => ({
    logger: mockLogger,
    createLogger: () => mockLogger,
    default: mockLogger,
}))

// Default DB mock so unit tests never hit a real PostgreSQL instance.
// Per-file vi.mock("@/lib/db", ...) overrides this when needed.
vi.mock("@/lib/db", () => createDbModuleMock())

// Set UTF-8 encoding for test environment
process.env.LANG = "en_US.UTF-8"
process.env.LC_ALL = "en_US.UTF-8"

function loadEnvFile(fileName: string, overwrite: boolean = false): void {
    const filePath = path.resolve(process.cwd(), fileName)
    if (!fs.existsSync(filePath)) {
        return
    }
    const content = fs.readFileSync(filePath, "utf8")
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim()
        if (!line || line.startsWith("#")) {
            continue
        }
        const eqIndex = line.indexOf("=")
        if (eqIndex === -1) {
            continue
        }
        const key = line.slice(0, eqIndex).trim()
        let value = line.slice(eqIndex + 1).trim()
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1)
        }
        if (overwrite || process.env[key] === undefined) {
            process.env[key] = value
        }
    }
}

// Load environment variables for tests
// Vitest auto-loads .env.local, so we must OVERWRITE with test variables
loadEnvFile(".env.test", true)
loadEnvFile(".env.local", false)
loadEnvFile(".env", false)

// Set test environment variables
process.env.NEXT_PUBLIC_SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
process.env.DATABASE_URL =
    process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test"
process.env.NEXTAUTH_SECRET =
    process.env.NEXTAUTH_SECRET || "test-secret-key-for-testing-only"
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000"
process.env.PEPPER_SECRET =
    process.env.PEPPER_SECRET ||
    "dev-pepper-test-very-long-string-32chars-minimum-required!"

// Cleanup after each test
afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        pathname: "/",
        query: {},
    }),
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    redirect: vi.fn(),
    notFound: vi.fn(),
}))

// Load translations for next-intl mock
const flatTranslations: Record<string, string> = {}
function flattenObj(obj: any, prefix = "") {
    for (const k in obj) {
        const pre = prefix.length ? prefix + "." : ""
        if (typeof obj[k] === "object" && obj[k] !== null) {
            flattenObj(obj[k], pre + k)
        } else {
            flatTranslations[pre + k] = String(obj[k])
            flatTranslations[k] = String(obj[k])
        }
    }
}

try {
    const i18nDir = path.resolve(process.cwd(), "src/i18n/en")
    if (fs.existsSync(i18nDir)) {
        const files = fs.readdirSync(i18nDir)
        for (const file of files) {
            if (file.endsWith(".json")) {
                const ns = file.replace(".json", "")
                const content = JSON.parse(
                    fs.readFileSync(path.join(i18nDir, file), "utf8")
                )
                flattenObj(content, ns)
            }
        }
    }
} catch (e) {
    console.error("Failed to load mock translations", e)
}

// Hardcoded fallbacks for commonly used mock translation keys not present in JSON files
const mockTranslationFallbacks: Record<string, string> = {
    saveChanges: "Save changes",
    languageEnglish: "English",
    languagePortuguese: "Portuguese",
    languageSpanish: "Spanish",
    languageFrench: "French",
    planValue: "{plan} Plan",
    plan: "Plan",
    on: "On",
    off: "Off",
}

// Mock next-intl
vi.mock("next-intl", () => ({
    useTranslations: (namespace?: string) => {
        const t = (key: string, params?: Record<string, string | number>) => {
            const fullKey = namespace ? `${namespace}.${key}` : key
            let value: string | undefined

            if (flatTranslations[fullKey]) value = flatTranslations[fullKey]
            else if (flatTranslations[key]) value = flatTranslations[key]
            else if (mockTranslationFallbacks[key])
                value = mockTranslationFallbacks[key]

            // If value is found, interpolate params
            if (value !== undefined && params) {
                for (const [k, v] of Object.entries(params)) {
                    value = value.replace(`{${k}}`, String(v))
                }
            }

            if (value !== undefined) return value

            // Fallback: Expand camelCase for testing queries fallback (preserves existing behavior)
            return key
                .replace(/([A-Z])/g, " $1")
                .trim()
                .replace(/^./, str => str.toUpperCase())
        }
        t.raw = (key: string) => []
        t.rich = (key: string, values?: any) => {
            const fullKey = namespace ? `${namespace}.${key}` : key
            if (flatTranslations[fullKey]) return flatTranslations[fullKey]
            if (flatTranslations[key]) return flatTranslations[key]
            return key
        }
        return t
    },
    useLocale: () => "en",
    useMessages: () => ({}),
    useFormatter: () => ({
        dateTime: (date: Date) => date.toISOString(),
        number: (num: number) => num.toString(),
    }),
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
        children,
}))

// Mock custom theme provider
vi.mock("@/components/theme/theme-provider", () => ({
    useTheme: () => ({
        theme: "light",
        toggleTheme: vi.fn(),
    }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock next-themes just in case
vi.mock("next-themes", () => ({
    useTheme: () => ({
        theme: "light",
        setTheme: vi.fn(),
        systemTheme: "light",
    }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock window.matchMedia (jsdom only)
if (typeof window !== "undefined") {
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    })
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
        return []
    }
    unobserve() {}
} as any

// Mock hasPointerCapture for Radix UI components
if (typeof Element !== "undefined") {
    Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false)
    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.releasePointerCapture = vi.fn()
    Element.prototype.scrollIntoView = vi.fn()
}

;(globalThis as any).React = React

// Mock Supabase client
vi.mock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => ({
        from: vi.fn((table: string) => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn(() =>
                            Promise.resolve({ data: null, error: null })
                        ),
                    })),
                    single: vi.fn(() =>
                        Promise.resolve({ data: null, error: null })
                    ),
                })),
                single: vi.fn(() =>
                    Promise.resolve({ data: null, error: null })
                ),
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(() =>
                        Promise.resolve({
                            data: {
                                id: "test-id",
                                user_id: "user_123",
                                platform: "youtube",
                                encrypted_token: "encrypted",
                                created_at: new Date(),
                                updated_at: new Date(),
                                linked_at: new Date(),
                            },
                            error: null,
                        })
                    ),
                })),
            })),
            update: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        select: vi.fn(() => ({
                            single: vi.fn(() =>
                                Promise.resolve({
                                    data: {
                                        id: "test-id",
                                        user_id: "user_123",
                                        platform: "youtube",
                                        encrypted_token: "encrypted",
                                        created_at: new Date(),
                                        updated_at: new Date(),
                                        linked_at: new Date(),
                                    },
                                    error: null,
                                })
                            ),
                        })),
                    })),
                })),
            })),
            delete: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn(() =>
                        Promise.resolve({ data: null, error: null })
                    ),
                })),
            })),
        })),
        auth: {
            getUser: vi.fn(() =>
                Promise.resolve({ data: { user: null }, error: null })
            ),
            signInWithPassword: vi.fn(() =>
                Promise.resolve({
                    data: { user: null, session: null },
                    error: null,
                })
            ),
            signUp: vi.fn(() =>
                Promise.resolve({
                    data: { user: null, session: null },
                    error: null,
                })
            ),
            signOut: vi.fn(() => Promise.resolve({ error: null })),
        },
    })),
}))

// Mock Cloudflare Turnstile (jsdom only)
if (typeof window !== "undefined") {
    Object.defineProperty(window, "turnstile", {
        writable: true,
        value: {
            render: vi.fn().mockImplementation((_containerId, options) => {
                if (options && options.callback) {
                    setTimeout(
                        () => options.callback("test-turnstile-token"),
                        0
                    )
                }
                return "test-widget-id"
            }),
            reset: vi.fn(),
            remove: vi.fn(),
            getResponse: vi.fn().mockReturnValue("test-turnstile-token"),
        },
    })
}
