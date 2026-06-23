#!/usr/bin/env node

/**
 * Token Killer CLI Entry Point
 * Executable script for token-killer command-line tool
 */

import { createTokenKillerCLI } from "../visualization/cli"
import { initializeDatabase } from "../storage/initialize"
import { createLogger } from "../../lib/logger"

const logger = createLogger("TokenKillerBin")

/**
 * Main entry point
 */
async function main(): Promise<void> {
    try {
        // Initialize database
        logger.info("Initializing Token Killer database")
        const pool = await initializeDatabase()

        // Create and run CLI
        const program = createTokenKillerCLI(pool)
        await program.parseAsync(process.argv)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`Fatal error: ${message}`)
        logger.error("Fatal error in CLI", error as Error)
        process.exit(1)
    }
}

// Run main
main().catch(error => {
    console.error("Unexpected error:", error)
    process.exit(1)
})
