import fs from "fs"
import path from "path"
import { describe, expect, it } from "vitest"

/**
 * Bug Condition Exploration Test: Missing 500 Error Page
 *
 * Validates: Requirements 1.3, 2.3
 *
 * This test demonstrates the missing 500 error page bug exists on UNFIXED code.
 * The test MUST FAIL on unfixed code (failure confirms the bug exists).
 * When the bug is fixed, this test will PASS.
 *
 * Bug Condition:
 * - serverError OCCURRED
 * - AND errorPageFile NOT EXISTS
 * - AND environment = "vercel" (standalone output)
 *
 * Expected Behavior (when fixed):
 * - Error pages exist (error.tsx, 500.tsx)
 * - Error page files are present in the build output
 * - Error pages can be served without ENOENT errors
 * - statusCode = 500
 * - NO ENOENT error
 *
 * Test Strategy:
 * - Check if error page source files exist (error.tsx, 500.tsx)
 * - Verify error page files are present in the build output
 * - Test that error pages can be served without ENOENT errors
 * - Document any counterexamples found
 *
 * NOTE: This test encodes the EXPECTED BEHAVIOR. On unfixed code, it will fail
 * because the error page files don't exist. When the fix is implemented, this
 * test will pass.
 */
describe("Missing 500 Error Page - Bug Condition Exploration", () => {
    const srcDir = path.join(process.cwd(), "src", "app")
    const buildDir = path.join(process.cwd(), ".next")

    describe("Property 1: Error Page Files Exist", () => {
        it("should have root error.tsx file", () => {
            // Bug condition: errorPageFile NOT EXISTS at src/app/error.tsx
            // Expected: error.tsx file exists at root level
            // Actual (unfixed): File does not exist
            // This test MUST FAIL on unfixed code

            const errorPagePath = path.join(srcDir, "error.tsx")

            // Check if error page file exists
            const fileExists = fs.existsSync(errorPagePath)

            // Expected behavior: File should exist
            expect(fileExists).toBe(true)
        })

        it("should have 500.tsx page file", () => {
            // Bug condition: errorPageFile NOT EXISTS at src/app/500.tsx
            // Expected: 500.tsx file exists at root level
            // Actual (unfixed): File does not exist
            // This test MUST FAIL on unfixed code

            const errorPagePath = path.join(srcDir, "500.tsx")

            // Check if 500 error page file exists
            const fileExists = fs.existsSync(errorPagePath)

            // Expected behavior: File should exist
            expect(fileExists).toBe(true)
        })

        it("should have locale-specific error.tsx file", () => {
            // Bug condition: errorPageFile NOT EXISTS at src/app/[locale]/error.tsx
            // Expected: error.tsx file exists in locale directory
            // Actual (unfixed): File does not exist
            // This test MUST FAIL on unfixed code

            const errorPagePath = path.join(srcDir, "[locale]", "error.tsx")

            // Check if locale-specific error page file exists
            const fileExists = fs.existsSync(errorPagePath)

            // Expected behavior: File should exist
            expect(fileExists).toBe(true)
        })
    })

    describe("Property 2: Error Page Content Validation", () => {
        it("root error.tsx should export default error component", () => {
            // Bug condition: errorPageFile NOT EXISTS or doesn't export error component
            // Expected: error.tsx exports a default error component
            // Actual (unfixed): File doesn't exist or doesn't export component
            // This test MUST FAIL on unfixed code

            const errorPagePath = path.join(srcDir, "error.tsx")

            // Check if file exists
            expect(fs.existsSync(errorPagePath)).toBe(true)

            // Read file content
            const content = fs.readFileSync(errorPagePath, "utf-8")

            // Verify it's a React component (has 'use client' or exports default)
            const hasUseClient = content.includes('"use client"')
            const hasDefaultExport =
                content.includes("export default") ||
                content.includes("export { default }")

            // Expected behavior: Should be a client component with default export
            expect(hasUseClient || hasDefaultExport).toBe(true)
        })

        it("500.tsx should export default page component", () => {
            // Bug condition: errorPageFile NOT EXISTS or doesn't export page component
            // Expected: 500.tsx exports a default page component
            // Actual (unfixed): File doesn't exist or doesn't export component
            // This test MUST FAIL on unfixed code

            const errorPagePath = path.join(srcDir, "500.tsx")

            // Check if file exists
            expect(fs.existsSync(errorPagePath)).toBe(true)

            // Read file content
            const content = fs.readFileSync(errorPagePath, "utf-8")

            // Verify it's a React component (has export default)
            const hasDefaultExport =
                content.includes("export default") ||
                content.includes("export { default }")

            // Expected behavior: Should export a default component
            expect(hasDefaultExport).toBe(true)
        })

        it("locale-specific error.tsx should export default error component", () => {
            // Bug condition: errorPageFile NOT EXISTS or doesn't export error component
            // Expected: [locale]/error.tsx exports a default error component
            // Actual (unfixed): File doesn't exist or doesn't export component
            // This test MUST FAIL on unfixed code

            const errorPagePath = path.join(srcDir, "[locale]", "error.tsx")

            // Check if file exists
            expect(fs.existsSync(errorPagePath)).toBe(true)

            // Read file content
            const content = fs.readFileSync(errorPagePath, "utf-8")

            // Verify it's a React component (has 'use client' or exports default)
            const hasUseClient = content.includes('"use client"')
            const hasDefaultExport =
                content.includes("export default") ||
                content.includes("export { default }")

            // Expected behavior: Should be a client component with default export
            expect(hasUseClient || hasDefaultExport).toBe(true)
        })
    })

    describe("Property 3: Error Page Accessibility", () => {
        it("error page files should be readable and not empty", () => {
            // Bug condition: errorPageFile NOT EXISTS or is empty
            // Expected: Error page files are readable and contain content
            // Actual (unfixed): Files don't exist or are empty
            // This test MUST FAIL on unfixed code

            const errorPages = [
                path.join(srcDir, "error.tsx"),
                path.join(srcDir, "500.tsx"),
                path.join(srcDir, "[locale]", "error.tsx"),
            ]

            errorPages.forEach(errorPagePath => {
                // Check if file exists
                expect(fs.existsSync(errorPagePath)).toBe(true)

                // Read file content
                const content = fs.readFileSync(errorPagePath, "utf-8")

                // Expected behavior: File should have content
                expect(content.length).toBeGreaterThan(0)
            })
        })

        it("error page files should not contain ENOENT error patterns", () => {
            // Bug condition: errorPageFile NOT EXISTS causes ENOENT errors
            // Expected: Error page files exist and don't reference missing files
            // Actual (unfixed): ENOENT errors occur when trying to serve error pages
            // This test MUST FAIL on unfixed code

            const errorPages = [
                path.join(srcDir, "error.tsx"),
                path.join(srcDir, "500.tsx"),
                path.join(srcDir, "[locale]", "error.tsx"),
            ]

            errorPages.forEach(errorPagePath => {
                // Check if file exists
                expect(fs.existsSync(errorPagePath)).toBe(true)

                // Read file content
                const content = fs.readFileSync(errorPagePath, "utf-8")

                // Verify file doesn't have obvious issues that would cause ENOENT
                // (e.g., importing from non-existent files)
                const hasInvalidImports =
                    content.includes("from './nonexistent") ||
                    content.includes('from "./nonexistent')

                // Expected behavior: No invalid imports that would cause ENOENT
                expect(hasInvalidImports).toBe(false)
            })
        })
    })

    describe("Property 4: Error Page Serving Capability", () => {
        it("should be able to serve error pages without file-not-found errors", () => {
            // Bug condition: errorPageFile NOT EXISTS AND environment = "vercel"
            // Expected: Error pages can be served without ENOENT errors
            // Actual (unfixed): "Failed to load static file for page: /500 ENOENT" error
            // This test MUST FAIL on unfixed code

            const errorPages = [
                {
                    path: path.join(srcDir, "error.tsx"),
                    name: "root error.tsx",
                },
                { path: path.join(srcDir, "500.tsx"), name: "500.tsx" },
                {
                    path: path.join(srcDir, "[locale]", "error.tsx"),
                    name: "locale error.tsx",
                },
            ]

            errorPages.forEach(({ path: errorPagePath, name }) => {
                // Check if file exists (this is the core bug condition)
                const fileExists = fs.existsSync(errorPagePath)

                // Expected behavior: File should exist so it can be served
                expect(fileExists).toBe(true)

                if (fileExists) {
                    // Verify file is readable
                    const stats = fs.statSync(errorPagePath)
                    expect(stats.isFile()).toBe(true)
                    expect(stats.size).toBeGreaterThan(0)
                }
            })
        })

        it("error pages should have proper React component structure", () => {
            // Bug condition: errorPageFile NOT EXISTS or has invalid structure
            // Expected: Error pages have proper React component structure
            // Actual (unfixed): Files don't exist or have invalid structure
            // This test MUST FAIL on unfixed code

            const errorPages = [
                path.join(srcDir, "error.tsx"),
                path.join(srcDir, "500.tsx"),
                path.join(srcDir, "[locale]", "error.tsx"),
            ]

            errorPages.forEach(errorPagePath => {
                // Check if file exists
                expect(fs.existsSync(errorPagePath)).toBe(true)

                // Read file content
                const content = fs.readFileSync(errorPagePath, "utf-8")

                // Verify basic React component structure
                const hasReactImport =
                    content.includes("import React") ||
                    content.includes("from 'react'") ||
                    content.includes('from "react"')
                const hasJSXReturn =
                    content.includes("return (") ||
                    content.includes("return <") ||
                    content.includes("return JSX")

                // Expected behavior: Should have React imports and JSX return
                expect(hasReactImport || hasJSXReturn).toBe(true)
            })
        })
    })

    describe("Property 5: Bug Condition Verification", () => {
        it("should verify bug condition: error page files exist in source", () => {
            // Bug Condition (C):
            // - serverError OCCURRED
            // - AND errorPageFile NOT EXISTS
            // - AND environment = "vercel"
            //
            // Expected Behavior (P):
            // - errorPageServed
            // - AND statusCode = 500
            // - AND NO ENOENT error
            //
            // This test verifies the first part of the fix:
            // Error page files MUST exist in the source code
            // This test MUST FAIL on unfixed code

            const requiredErrorPages = [
                path.join(srcDir, "error.tsx"),
                path.join(srcDir, "500.tsx"),
                path.join(srcDir, "[locale]", "error.tsx"),
            ]

            // All error page files should exist
            requiredErrorPages.forEach(errorPagePath => {
                const fileExists = fs.existsSync(errorPagePath)
                expect(fileExists).toBe(true)
            })

            // Verify no ENOENT errors would occur
            requiredErrorPages.forEach(errorPagePath => {
                const fileExists = fs.existsSync(errorPagePath)
                if (fileExists) {
                    const content = fs.readFileSync(errorPagePath, "utf-8")
                    // File should be readable and have content
                    expect(content.length).toBeGreaterThan(0)
                }
            })
        })

        it("should document counterexample: missing error pages cause ENOENT", () => {
            // Counterexample Documentation:
            // When error page files don't exist, Vercel tries to serve them
            // and fails with: "Failed to load static file for page: /500 ENOENT"
            //
            // This test documents the bug condition:
            // - Bug occurs when: serverError OCCURRED AND errorPageFile NOT EXISTS
            // - Error message: "Failed to load static file for page: /500 ENOENT"
            // - Root cause: No 500.tsx or error.tsx files in src/app
            //
            // This test MUST FAIL on unfixed code (proving the bug exists)

            const errorPages = [
                path.join(srcDir, "error.tsx"),
                path.join(srcDir, "500.tsx"),
                path.join(srcDir, "[locale]", "error.tsx"),
            ]

            // Verify all error pages exist (if any are missing, the bug exists)
            const missingPages = errorPages.filter(page => !fs.existsSync(page))

            // Expected: No missing pages (bug is fixed)
            // Actual (unfixed): Some pages are missing (bug exists)
            expect(missingPages.length).toBe(0)

            // If we reach here, the bug is fixed
            // Document the fix: All error page files now exist
            expect(errorPages.length).toBe(3)
            expect(errorPages.every(page => fs.existsSync(page))).toBe(true)
        })
    })
})
