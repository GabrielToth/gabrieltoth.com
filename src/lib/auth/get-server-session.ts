import { getSessionFromCookie } from "./session"
import { NextRequest } from "next/server"

export async function getServerSession(request: NextRequest) {
    const session = await getSessionFromCookie(request)
    if (!session) return null
    return { user: { id: session.user_id } }
}
