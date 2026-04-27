import { auditLog } from "@/lib/audit/audit-logger"
import { authOptions } from "@/lib/auth/auth-options"
import { PublicationQueue } from "@/lib/queue/publication-queue"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Process publication queue endpoint
 * Called by client-side polling or manually
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const queue = new PublicationQueue()

        // Get publications due for this user
        const duePublications = await queue.getDuePublications(session.user.id)

        if (duePublications.length === 0) {
            return NextResponse.json({
                processed: 0,
                message: "No publications due",
            })
        }

        const results = []

        for (const publication of duePublications) {
            try {
                // Mark as processing
                await queue.markAsProcessing(publication.id)

                // Publish to all networks
                const publishResults = await publishToNetworks(
                    publication,
                    session.user.id
                )

                // Update status based on results
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
                    status: allSucceeded
                        ? "success"
                        : allFailed
                          ? "failed"
                          : "partial",
                    results: publishResults,
                })

                // Audit log
                await auditLog({
                    userId: session.user.id,
                    action: "publication_processed",
                    resource: "publication",
                    resourceId: publication.id,
                    metadata: {
                        networks: publication.networks,
                        status: allSucceeded
                            ? "success"
                            : allFailed
                              ? "failed"
                              : "partial",
                    },
                })
            } catch (error) {
                console.error(
                    `Failed to process publication ${publication.id}:`,
                    error
                )

                await queue.handleFailure(
                    publication.id,
                    error instanceof Error ? error.message : "Unknown error"
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
        })
    } catch (error) {
        console.error("Error processing queue:", error)
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

async function publishToNetworks(
    publication: any,
    userId: string
): Promise<Array<{ network: string; success: boolean; error?: string }>> {
    const results = []

    for (const network of publication.networks) {
        try {
            // Get network adapter
            const adapter = getNetworkAdapter(network)

            // Get OAuth token
            const token = await getNetworkToken(userId, network)

            if (!token) {
                results.push({
                    network,
                    success: false,
                    error: "No valid token found",
                })
                continue
            }

            // Publish to network
            const result = await adapter.publish({
                content: publication.content,
                images: publication.images,
                metadata: publication.metadata?.[network],
                token,
            })

            results.push({
                network,
                success: true,
                externalId: result.id,
                externalUrl: result.url,
            })
        } catch (error) {
            results.push({
                network,
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            })
        }
    }

    return results
}

function getNetworkAdapter(network: string) {
    // Import and return appropriate adapter
    // This is a placeholder - implement based on your adapters
    switch (network) {
        case "youtube":
            return require("@/lib/posting/adapters/youtube").default
        case "facebook":
            return require("@/lib/posting/adapters/facebook").default
        case "instagram":
            return require("@/lib/posting/adapters/instagram").default
        case "twitter":
            return require("@/lib/posting/adapters/twitter").default
        case "linkedin":
            return require("@/lib/posting/adapters/linkedin").default
        default:
            throw new Error(`Unsupported network: ${network}`)
    }
}

async function getNetworkToken(userId: string, network: string) {
    // Get token from token store
    // This is a placeholder - implement based on your token store
    const { TokenStore } = await import("@/lib/token-store/token-store")
    const tokenStore = new TokenStore()
    return tokenStore.getToken(userId, network)
}
