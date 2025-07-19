import { generateRobotsContent } from "@/lib/seo"

export async function GET() {
    const robotsContent = generateRobotsContent()

    return new Response(robotsContent, {
        status: 200,
        headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "public, max-age=86400, s-max-age=86400", // Cache for 24 hours
        },
    })
}
