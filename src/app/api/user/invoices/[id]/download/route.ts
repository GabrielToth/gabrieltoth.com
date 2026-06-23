/**
 * GET /api/user/invoices/[id]/download
 * Download invoice PDF (not available - Stripe integration not yet implemented)
 */

import { NextResponse } from "next/server"

export async function GET() {
    return NextResponse.json(
        { error: "Invoices not available" },
        { status: 404 }
    )
}
