import {
    APIGatewayProxyEvent,
    APIGatewayProxyHandler,
    APIGatewayProxyResult,
} from "aws-lambda"
import serverlessHttp from "serverless-http"
import app from "./app"

// Middleware para adicionar headers de segurança
const addSecurityHeaders = (
    result: APIGatewayProxyResult
): APIGatewayProxyResult => {
    return {
        ...result,
        headers: {
            ...result.headers,
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'",
        },
    }
}

// Converter Express para Lambda
const httpHandler = serverlessHttp(app, {
    basePath: "/prod",
})

export const handler: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        // Log da requisição
        console.log("Incoming request:", {
            method: event.httpMethod,
            path: event.path,
            timestamp: new Date().toISOString(),
        })

        // Chamar handler Express
        const result = await httpHandler(event, {} as any)

        // Adicionar headers de segurança
        const secureResult = addSecurityHeaders(result as APIGatewayProxyResult)

        // Log da resposta
        console.log("Response:", {
            statusCode: secureResult.statusCode,
            timestamp: new Date().toISOString(),
        })

        return secureResult
    } catch (error) {
        console.error("Lambda error:", error)

        return addSecurityHeaders({
            statusCode: 500,
            body: JSON.stringify({
                error: "Internal Server Error",
                message:
                    process.env.NODE_ENV === "development"
                        ? String(error)
                        : undefined,
            }),
            headers: {
                "Content-Type": "application/json",
            },
        })
    }
}

// Warm up function para evitar cold starts
export const warmup: APIGatewayProxyHandler =
    async (): Promise<APIGatewayProxyResult> => {
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Lambda warmed up" }),
        }
    }
