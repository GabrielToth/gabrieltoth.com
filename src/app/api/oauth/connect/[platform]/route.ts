/**
 * Dynamic OAuth Connect Route Handler (Fallback / Proxy)
 * Supports GET and POST /api/oauth/connect/:platform?locale=...
 */

import { GET as authorizeGET, POST as authorizePOST } from "../../authorize/[platform]/route"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ platform: string }> }
): Promise<NextResponse> {
    return authorizeGET(request, context)
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ platform: string }> }
): Promise<NextResponse> {
    return authorizePOST(request, context)
}
