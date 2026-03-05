import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda"
import { Pool } from "pg"

let pool: Pool | null = null

const getPool = () => {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 1,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        })
    }
    return pool
}

export const handler: APIGatewayProxyHandler =
    async (): Promise<APIGatewayProxyResult> => {
        try {
            const startTime = Date.now()
            const health: Record<string, any> = {
                status: "healthy",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV,
            }

            // Verificar banco de dados
            try {
                const pool = getPool()
                const result = await pool.query("SELECT NOW()")
                health.database = {
                    status: "connected",
                    responseTime: `${Date.now() - startTime}ms`,
                }
            } catch (dbError) {
                health.database = {
                    status: "disconnected",
                    error: String(dbError),
                }
                health.status = "degraded"
            }

            // Verificar memória
            const memUsage = process.memoryUsage()
            health.memory = {
                heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
                external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
            }

            return {
                statusCode: health.status === "healthy" ? 200 : 503,
                body: JSON.stringify(health),
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache",
                },
            }
        } catch (error) {
            console.error("Health check error:", error)

            return {
                statusCode: 503,
                body: JSON.stringify({
                    status: "unhealthy",
                    error: String(error),
                    timestamp: new Date().toISOString(),
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            }
        }
    }
