import { GET as authorizeGET, POST as authorizePOST } from "../../authorize/twitch/route"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest): Promise<NextResponse> {
    return authorizeGET(request)
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    return authorizePOST(request)
}
