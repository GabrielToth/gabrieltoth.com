/**
 * Background Queue Processor
 *
 * This module provides a simple background processing solution
 * that runs in the Next.js server without requiring external cron jobs.
 *
 * It uses setInterval to check for due publications periodically.
 * This only works in long-running Node.js processes (not serverless).
 */

import { PublicationQueue } from "./publication-queue"

let processingInterval: NodeJS.Timeout | null = null
let isProcessing = false

export class BackgroundProcessor {
    private interval: number
    private queue: PublicationQueue

    constructor(intervalMs: number = 60000) {
        this.interval = intervalMs
        this.queue = new PublicationQueue()
    }

    /**
     * Start the background processor
     * Call this once when your server starts
     */
    start() {
        if (processingInterval) {
            console.log("Background processor already running")
            return
        }

        console.log(
            `Starting background processor (interval: ${this.interval}ms)`
        )

        // Process immediately on start
        this.processQueue()

        // Then process on interval
        processingInterval = setInterval(() => {
            this.processQueue()
        }, this.interval)
    }

    /**
     * Stop the background processor
     */
    stop() {
        if (processingInterval) {
            clearInterval(processingInterval)
            processingInterval = null
            console.log("Background processor stopped")
        }
    }

    /**
     * Process the queue
     */
    private async processQueue() {
        // Prevent concurrent processing
        if (isProcessing) {
            console.log("Queue processing already in progress, skipping...")
            return
        }

        isProcessing = true

        try {
            const duePublications = await this.queue.getAllDuePublications()

            if (duePublications.length === 0) {
                return
            }

            console.log(`Processing ${duePublications.length} due publications`)

            for (const publication of duePublications) {
                try {
                    await this.processPublication(publication)
                } catch (error) {
                    console.error(
                        `Failed to process publication ${publication.id}:`,
                        error
                    )
                }
            }

            console.log(
                `Finished processing ${duePublications.length} publications`
            )
        } catch (error) {
            console.error("Error in queue processing:", error)
        } finally {
            isProcessing = false
        }
    }

    /**
     * Process a single publication
     */
    private async processPublication(publication: any) {
        try {
            await this.queue.markAsProcessing(publication.id)

            // TODO: Implement actual publishing logic
            // This is a placeholder - integrate with your network adapters

            const results = await this.publishToNetworks(publication)

            const allSucceeded = results.every(r => r.success)
            const allFailed = results.every(r => !r.success)

            if (allSucceeded) {
                await this.queue.markAsPublished(publication.id)
            } else if (allFailed) {
                await this.queue.markAsFailed(
                    publication.id,
                    "All networks failed"
                )
            } else {
                await this.queue.markAsPartiallyPublished(
                    publication.id,
                    results
                )
            }
        } catch (error) {
            await this.queue.handleFailure(
                publication.id,
                error instanceof Error ? error.message : "Unknown error"
            )
            throw error
        }
    }

    /**
     * Publish to all networks
     */
    private async publishToNetworks(publication: any) {
        // TODO: Implement actual network publishing
        // This is a placeholder
        return publication.networks.map((network: string) => ({
            network,
            success: true,
            externalId: `mock_${Date.now()}`,
        }))
    }
}

// Singleton instance
let backgroundProcessor: BackgroundProcessor | null = null

/**
 * Get or create the background processor instance
 */
export function getBackgroundProcessor(
    intervalMs?: number
): BackgroundProcessor {
    if (!backgroundProcessor) {
        backgroundProcessor = new BackgroundProcessor(intervalMs)
    }
    return backgroundProcessor
}

/**
 * Start background processing
 * Call this in your server startup code
 */
export function startBackgroundProcessing(intervalMs: number = 60000) {
    const processor = getBackgroundProcessor(intervalMs)
    processor.start()
    return processor
}

/**
 * Stop background processing
 * Call this on server shutdown
 */
export function stopBackgroundProcessing() {
    if (backgroundProcessor) {
        backgroundProcessor.stop()
        backgroundProcessor = null
    }
}
