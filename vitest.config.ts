import { defineConfig } from "vitest/config"

// Simplified Vitest config without Storybook integration for compatibility with Next.js 15
// Add your own unit tests under src/**/*.test.ts(x) or src/**/*.spec.ts(x)
export default defineConfig({
    test: {
        environment: "jsdom",
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        globals: true,
        reporters: "default",
    },
})
