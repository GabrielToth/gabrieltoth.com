import { BugHunter } from "./bug-hunter"
import { createLogger } from "@/lib/logger"

const logger = createLogger("BugHunterService")

async function main() {
    logger.info("🚀 Starting Bug Hunter Service")

    const baseUrl = process.env.BASE_URL || "http://localhost:3000"
    const hunter = new BugHunter(baseUrl)

    process.on("SIGINT", async () => {
        logger.info("Received SIGINT, shutting down...")
        await hunter.stop()
        process.exit(0)
    })

    process.on("SIGTERM", async () => {
        logger.info("Received SIGTERM, shutting down...")
        await hunter.stop()
        process.exit(0)
    })

    await hunter.start()

    logger.info("✅ Bug Hunter Service running 24/7")
}

main().catch(error => {
    logger.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
})
