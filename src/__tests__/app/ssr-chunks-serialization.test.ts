import { execSync } from "child_process"
import * as fs from "fs"
import * as path from "path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

/**
 * Bug Condition Exploration Test: SSR Chunks Serialization Error
 *
 * Validates: Requirements 1.1, 2.1
 *
 * This test demonstrates the SSR serialization bug exists on unfixed code.
 * The test MUST FAIL on unfixed code (this proves the bug exists).
 *
 * Bug Condition:
 * - buildOutput.chunks CONTAINS nonIterableValue
 * - buildOutput.environment = "vercel"
 * - buildOutput.buildPhase IN ["ssr", "runtime"]
 *
 * Expected Behavior:
 * - buildOutput.chunks ARE iterable
 * - buildSucceeds without TypeError
 *
 * Counterexamples on unfixed code:
 * - Build fails with "MISSING_MESSAGE: auth" errors during SSR processing
 * - Error occurs in chunk files like `_d49b6e04._.js` and `src_81a800ca._.js`
 * - The error indicates missing i18n messages during SSR serialization
 * - This is related to non-iterable intermediate values in the build output
 */
describe("SSR Chunks Serialization - Bug Condition Exploration", () => {
    let buildOutput: string = ""
    let buildError: string = ""
    let buildSucceeded: boolean = false

    beforeAll(() => {
        // Run the build process to trigger the SSR serialization error
        try {
            buildOutput = execSync("npm run build", {
                encoding: "utf-8",
                stdio: ["pipe", "pipe", "pipe"],
                cwd: process.cwd(),
                maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large output
            })
            buildSucceeded = true
        } catch (error: unknown) {
            if (error instanceof Error) {
                buildError = error.message || ""
                // Also capture stderr if available
                if ("stderr" in error && error.stderr) {
                    buildError += "\n" + String(error.stderr)
                }
            }
            buildSucceeded = false
        }
    }, 300000) // 5 minute timeout for build

    afterAll(() => {
        // Cleanup: remove .next directory if it was created
        const nextDir = path.join(process.cwd(), ".next")
        if (fs.existsSync(nextDir)) {
            // Keep the build artifacts for inspection if needed
            // fs.rmSync(nextDir, { recursive: true, force: true })
        }
    })

    it("should complete build successfully without serialization errors", () => {
        // This test MUST FAIL on unfixed code
        // Expected counterexample: Build fails with TypeError about non-iterable values
        if (!buildSucceeded) {
            console.log("Build Error Output:", buildError)
        }
        expect(buildSucceeded).toBe(true)
    })

    it("should not contain TypeError about non-iterable intermediate values", () => {
        // This test MUST FAIL on unfixed code
        // Expected counterexample: Error message contains "is not iterable"
        const hasIterableError =
            buildError.includes("is not iterable") ||
            buildError.includes("TypeError") ||
            buildError.includes("intermediate value")

        expect(hasIterableError).toBe(false)
    })

    it("should not contain MISSING_MESSAGE errors during SSR", () => {
        // This test MUST FAIL on unfixed code
        // Expected counterexample: Build fails with MISSING_MESSAGE errors
        const hasMissingMessageError = buildError.includes("MISSING_MESSAGE")

        expect(hasMissingMessageError).toBe(false)
    })

    it("should generate .next directory with build artifacts", () => {
        // This test MUST FAIL on unfixed code
        // Expected counterexample: .next directory not created due to build failure
        const nextDir = path.join(process.cwd(), ".next")
        expect(fs.existsSync(nextDir)).toBe(true)
    })

    it("should have valid build output without errors", () => {
        // This test MUST FAIL on unfixed code
        // Expected counterexample: buildOutput contains error messages
        const hasErrors =
            buildOutput.includes("error") ||
            buildOutput.includes("Error") ||
            buildOutput.includes("failed")

        // Note: Some warnings are acceptable, but errors should not be present
        expect(hasErrors).toBe(false)
    })
})
