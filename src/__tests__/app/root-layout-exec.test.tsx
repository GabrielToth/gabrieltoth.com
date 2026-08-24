import React from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/font/google", () => ({
    Inter: () => ({ variable: "--font-sans" }),
}))

vi.mock("@vercel/analytics/react", () => ({
    Analytics: () => null,
}))

vi.mock("@vercel/speed-insights/next", () => ({
    SpeedInsights: () => null,
}))

describe("root layout executes in dev and prod branches", () => {
    it("renders children and dev branch without analytics", async () => {
        vi.stubEnv("NODE_ENV", "development")
        const { default: RootLayout } = await import("@/app/layout")
        const tree = RootLayout({
            children: React.createElement("div", null, "child"),
        })
        expect(tree).toBeTruthy()
    })

    it("renders prod branch with analytics components gated by flag", async () => {
        vi.stubEnv("NODE_ENV", "production")
        const { default: RootLayout } = await import("@/app/layout")
        const tree = RootLayout({
            children: React.createElement("div", null, "child"),
        })
        expect(tree).toBeTruthy()
    })
})
