import {
    GET as authorizeGET,
    POST as authorizePOST,
} from "../../authorize/[platform]/route"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest): Promise<NextResponse> {
    return authorizeGET(request, {
        params: Promise.resolve({ platform: "instagram" }),
    })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    return authorizePOST(request, {
        params: Promise.resolve({ platform: "instagram" }),
    })
}
