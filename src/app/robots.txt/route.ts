import { generateRobotsContent } from "@/lib/seo"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
    const robotsContent = generateRobotsContent()

    return new Response(robotsContent, {
        status: 200,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
        },
    })
}

export async function HEAD() {
    return new Response(null, {
        status: 200,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
        },
    })
}
