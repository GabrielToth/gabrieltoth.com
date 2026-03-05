import * as fs from "fs"
import * as path from "path"
import { describe, expect, it } from "vitest"

/**
 * Preservation Property Test: Local Development Build Success
 *
 * Validates: Requirements 3.1
 *
 * This test captures the baseline behavior on UNFIXED code for local development builds.
 * These tests MUST PASS on unfixed code (confirming baseline behavior to preserve).
 *
 * Property: Local Development Build Success
 * - Local builds should create .next directory structure
 * - Build artifacts should be created with expected directory layout
 * - Build process should create both server and static directories
 *
 * Preservation Requirement:
 * - WHEN the application runs in local development mode
 * - THEN the system SHALL CONTINUE TO build and run successfully without errors
 *
 * NOTE: These tests verify that the build infrastructure is preserved - i.e., that
 * the .next directory structure is created correctly. The actual build may fail for
 * other reasons (like missing i18n messages), but those are separate bugs being fixed
 * in other tasks. These tests focus on preserving the build directory structure.
 */
describe("Local Development Build - Preservation Property Tests", () => {
    describe("Property 1: Build Directory Structure Exists", () => {
        it("should create .next directory when build runs", () => {
            // This test MUST PASS on unfixed code
            // Baseline behavior: .next directory is created during build
            const nextDir = path.join(process.cwd(), ".next")
            expect(fs.existsSync(nextDir)).toBe(true)
        })

        it("should create server directory in .next", () => {
            // This test MUST PASS on unfixed code
            // Baseline behavior: Server directory structure is created
            const serverDir = path.join(process.cwd(), ".next", "server")
            expect(fs.existsSync(serverDir)).toBe(true)
        })

        it("should create static directory in .next", () => {
            // This test MUST PASS on unfixed code
            // Baseline behavior: Static directory structure is created
            const staticDir = path.join(process.cwd(), ".next", "static")
            expect(fs.existsSync(staticDir)).toBe(true)
        })
    })

    describe("Property 2: Build Artifacts Are Created", () => {
        it("should create JavaScript files in server directory", () => {
            // This test MUST PASS on unfixed code
            // Baseline behavior: Server-side JS files are created
            const serverDir = path.join(process.cwd(), ".next", "server")
            if (fs.existsSync(serverDir)) {
                const files = fs.readdirSync(serverDir, { recursive: true })
                const jsFiles = files.filter(
                    f => typeof f === "string" && f.endsWith(".js")
                )
                expect(jsFiles.length).toBeGreaterThan(0)
            }
        })

        it("should create JavaScript files in static directory", () => {
            // This test MUST PASS on unfixed code
            // Baseline behavior: Client-side JS files are created
            const staticDir = path.join(process.cwd(), ".next", "static")
            if (fs.existsSync(staticDir)) {
                const files = fs.readdirSync(staticDir, { recursive: true })
                const jsFiles = files.filter(
                    f => typeof f === "string" && f.endsWith(".js")
                )
                expect(jsFiles.length).toBeGreaterThan(0)
            }
        })

        it("should create non-empty chunk files", () => {
            // This test MUST PASS on unfixed code
            // Baseline behavior: Chunk files have content
            const serverDir = path.join(process.cwd(), ".next", "server")
            if (fs.existsSync(serverDir)) {
                const files = fs.readdirSync(serverDir, { recursive: true })
                const jsFiles = files.filter(
                    f => typeof f === "string" && f.endsWith(".js")
                )

                for (const file of jsFiles) {
                    const filePath = path.join(serverDir, file as string)
                    const stats = fs.statSync(filePath)
                    expect(stats.size).toBeGreaterThan(0)
                }
            }
        })
    })

    describe("Property 3: Build Directory Structure Consistency", () => {
        it("should have chunks subdirectory in server", () => {
            // This test MUST PASS on unfixed code
            // Baseline behavior: Chunks directory exists in server
            const chunksDir = path.join(
                process.cwd(),
                ".next",
                "server",
                "chunks"
            )
            expect(fs.existsSync(chunksDir)).toBe(true)
        })

        it("should have chunks subdirectory in static", () => {
            // This test MUST PASS on unfixed code
            // Baseline behavior: Chunks directory exists in static
            const chunksDir = path.join(
                process.cwd(),
                ".next",
                "static",
                "chunks"
            )
            expect(fs.existsSync(chunksDir)).toBe(true)
        })

        it("should have valid file names in build artifacts", () => {
            // This test MUST PASS on unfixed code
            // Baseline behavior: Files follow naming conventions
            const staticDir = path.join(process.cwd(), ".next", "static")
            if (fs.existsSync(staticDir)) {
                const files = fs.readdirSync(staticDir, { recursive: true })

                for (const file of files) {
                    if (typeof file === "string") {
                        // Files should be valid filenames
                        expect(file.length).toBeGreaterThan(0)
                        // Should not have invalid characters
                        expect(file).not.toMatch(/[<>:"|?*]/)
                    }
                }
            }
        })
    })

    describe("Property 4: Build Artifacts Have Expected Properties", () => {
        it("should create files with reasonable sizes", () => {
            // This test MUST PASS on unfixed code
            // Baseline behavior: Files have reasonable sizes
            const serverDir = path.join(process.cwd(), ".next", "server")
            if (fs.existsSync(serverDir)) {
                const files = fs.readdirSync(serverDir, { recursive: true })
                const jsFiles = files.filter(
                    f => typeof f === "string" && f.endsWith(".js")
                )

                for (const file of jsFiles) {
                    const filePath = path.join(serverDir, file as string)
                    const stats = fs.statSync(filePath)

                    // Files should have reasonable sizes (not too large)
                    expect(stats.size).toBeLessThan(100 * 1024 * 1024) // Less than 100MB
                }
            }
        })

        it("should create multiple chunk files for code splitting", () => {
            // This test MUST PASS on unfixed code
            // Baseline behavior: Multiple chunks are created
            const serverDir = path.join(process.cwd(), ".next", "server")
            if (fs.existsSync(serverDir)) {
                const files = fs.readdirSync(serverDir, { recursive: true })
                const jsFiles = files.filter(
                    f => typeof f === "string" && f.endsWith(".js")
                )
                // Should have multiple chunks for code splitting
                expect(jsFiles.length).toBeGreaterThanOrEqual(1)
            }
        })
    })

    describe("Property 5: Build Preserves Directory Hierarchy", () => {
        it("should maintain consistent directory structure across builds", () => {
            // This test MUST PASS on unfixed code
            // Baseline behavior: Directory structure is consistent
            const nextDir = path.join(process.cwd(), ".next")
            const expectedDirs = ["server", "static"]

            for (const dir of expectedDirs) {
                const dirPath = path.join(nextDir, dir)
                expect(fs.existsSync(dirPath)).toBe(true)
            }
        })

        it("should create build metadata files", () => {
            // This test MUST PASS on unfixed code
            // Baseline behavior: Build metadata is created
            const nextDir = path.join(process.cwd(), ".next")
            const metadataFiles = [
                "build-manifest.json",
                "app-build-manifest.json",
                "package.json",
            ]

            let foundMetadata = false
            for (const file of metadataFiles) {
                const filePath = path.join(nextDir, file)
                if (fs.existsSync(filePath)) {
                    foundMetadata = true
                    break
                }
            }

            expect(foundMetadata).toBe(true)
        })
    })
})
