import path from "path"
import { defineConfig } from "vitest/config"

// Simplified Vitest config without Storybook integration for compatibility with Next.js 15
// Add your own unit tests under src/**/*.test.ts(x) or src/**/*.spec.ts(x)
export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    test: {
        environment: "jsdom",
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        globals: true,
        reporters: [["default", { summary: true }]],
        silent: true,
        setupFiles: ["./vitest.setup.ts"],
        exclude: [
            "node_modules",
            "src/lib/logger/pino-logger.test.ts",
            // Live Supabase / DB — run manually with infra up (not part of default CI)
            "src/__tests__/database/**",
            "src/__tests__/database-constraints.test.ts",
            "src/__tests__/helpers/database.test.ts",
            "src/__tests__/helpers/database-usage-example.test.ts",
            "src/__tests__/integration/youtube-channel-linking-schema.test.ts",
            "src/__tests__/integration/environment-parity.test.ts",
            "src/__tests__/security/bug-condition-*.test.ts",
            "src/__tests__/security/preservation-*.test.ts",
            "src/lib/db/migrations/**/*.test.ts",
            "src/lib/db/schema.test.ts",
            "src/backend/integration.test.ts",
            "src/lib/credits/credit-system.test.ts",
            "src/lib/metering/metering-system.test.ts",
        ],
        // Add UTF-8 encoding support
        environmentOptions: {
            jsdom: {
                resources: "usable",
                runScripts: "outside-only",
                url: "http://localhost:3000",
            },
        },
        // Increase timeout for property-based tests
        testTimeout: 10000,
        hookTimeout: 10000,
        coverage: {
            provider: "v8",
            reportsDirectory: "./coverage",
            reporter: ["text", "html", "lcov", "json-summary"],
            include: ["src/**/*.{ts,tsx}"],
            exclude: [
                "src/**/__tests__/**",
                "**/*.d.ts",
                "**/*-types.ts",
                "**/*section-types.ts",
            ],
        },
    },
})
