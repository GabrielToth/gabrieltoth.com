/**
 * Manual Queue Processing Endpoint
 *
 * Triggers the background publication queue to process due posts.
 * Useful for Vercel serverless environments where setInterval doesn't run.
 * Can be called via cron job (e.g. cron-job.org) every minute.
 */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth/session"
import { getPublicationQueue } from "@/lib/queue/publication-queue"
import { BackgroundProcessor } from "@/lib/queue/background-processor"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(request)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const processor = new BackgroundProcessor()
        // Process only the current user's due publications
        const queue = getPublicationQueue()
        const duePublications = await queue.getDuePublications(session.user.id)

        if (duePublications.length === 0) {
            return NextResponse.json({
                processed: 0,
                message: "No due publications found",
            })
        }

        const results: Array<{
            id: string
            status: string
            error?: string
        }> = []

        for (const publication of duePublications) {
            try {
                await queue.markAsProcessing(publication.id)
                // Use the background processor to publish to networks
                await processor["processPublication"](publication)
                results.push({
                    id: publication.id,
                    status: "processed",
                })
            } catch (error) {
                results.push({
                    id: publication.id,
                    status: "failed",
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
        })
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to process publications",
            },
            { status: 500 }
        )
    }
}
