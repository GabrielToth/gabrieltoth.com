import { NextResponse } from "next/server"

/**
 * User Dashboard Metric Aggregation
 * Shows the creator their own consumption and credit history
 */
export async function GET(request: Request) {
    // In a real app, get userId from session
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // Mock data for now - in production, query actual database
        const mockData = {
            balance: 1000,
            usageStats: [
                {
                    resource_type: "bandwidth",
                    total_amount: 5120,
                    total_credits: 51.2,
                },
                {
                    resource_type: "storage",
                    total_amount: 2048,
                    total_credits: 20.48,
                },
            ],
            recentTransactions: [
                {
                    id: "tx-1",
                    user_id: userId,
                    amount: 100,
                    type: "credit",
                    created_at: new Date().toISOString(),
                },
            ],
        }

        return NextResponse.json(mockData)
    } catch (error) {
        console.error("Analytics GET error:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
