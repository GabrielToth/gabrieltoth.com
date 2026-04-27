import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * External trigger endpoint for queue processing
 * Can be called by external services like:
 * - UptimeRobot (free monitoring service)
 * - Pingdom
 * - Custom webhook services
 * - Manual curl commands
 */
export async function GET(request: NextRequest) {
    try {
        // Verify secret token to prevent abuse
        const authHeader = request.headers.get("authorization")
        const expectedToken = process.env.QUEUE_TRIGGER_SECRET

        if (!expectedToken) {
            return NextResponse.json(
                { error: "Queue trigger not configured" },
                { status: 500 }
            )
        }

        if (authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Process queue for all users
        const { PublicationQueue } =
            await import("@/lib/queue/publication-queue")
        const queue = new PublicationQueue()

        const duePublications = await queue.getAllDuePublications()

        if (duePublications.length === 0) {
            return NextResponse.json({
                processed: 0,
                message: "No publications due",
            })
        }

        const results = []

        for (const publication of duePublications) {
            try {
                await queue.markAsProcessing(publication.id)

                // Process publication
                const publishResults = await processPublication(publication)

                const allSucceeded = publishResults.every(r => r.success)
                const allFailed = publishResults.every(r => !r.success)

                if (allSucceeded) {
                    await queue.markAsPublished(publication.id)
                } else if (allFailed) {
                    await queue.markAsFailed(
                        publication.id,
                        "All networks failed"
                    )
                } else {
                    await queue.markAsPartiallyPublished(
                        publication.id,
                        publishResults
                    )
                }

                results.push({
                    publicationId: publication.id,
                    userId: publication.userId,
                    status: allSucceeded
                        ? "success"
                        : allFailed
                          ? "failed"
                          : "partial",
                })
            } catch (error) {
                console.error(
                    `Failed to process publication ${publication.id}:`,
                    error
                )
                results.push({
                    publicationId: publication.id,
                    status: "error",
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                })
            }
        }

        return NextResponse.json({
            processed: results.length,
            results,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error("Error in queue trigger:", error)
        return NextResponse.json(
            {
                error: "Failed to process queue",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        )
    }
}

async function processPublication(publication: any) {
    // Implementation similar to the POST endpoint above
    // This is a placeholder
    return []
}
