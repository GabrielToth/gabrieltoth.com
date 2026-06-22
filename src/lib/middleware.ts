import { validateSession } from "@/lib/auth/session"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
    const sessionToken = request.cookies.get("auth_session")?.value
    let user: { user_id: string } | null = null

    if (sessionToken) {
        try {
            const session = await validateSession(sessionToken)
            if (session) {
                user = { user_id: session.user_id }
            }
        } catch {
            // Session validation failed — treat as unauthenticated
        }
    }

    const response = NextResponse.next({ request })

    if (
        !user &&
        !request.nextUrl.pathname.startsWith("/login") &&
        !request.nextUrl.pathname.startsWith("/auth")
    ) {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/login"
        return NextResponse.redirect(url)
    }

    return response
}
