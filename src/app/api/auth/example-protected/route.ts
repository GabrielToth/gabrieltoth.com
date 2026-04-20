/**
 * Example Protected API Endpoint
 * Demonstrates how to use CSRF protection in API routes
 *
 * This is an example implementation showing the pattern for:
 * - GET requests: Generate/retrieve CSRF token
 * - POST requests: Validate CSRF token and regenerate after success
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { logger } from "@/lib/logger"
import {
    addCsrfTokenToResponse,
    createCsrfErrorResponse,
    getOrGenerateCsrfToken,
    regenerateCsrfToken,
    validateCsrfFromRequest,
} from "@/lib/middleware/api-csrf-middleware"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/auth/example-protected
 * Example GET endpoint that provides CSRF token
 */
export async function GET(request: NextRequest) {
    try {
        // Get or generate CSRF token for the session
        const csrfToken = getOrGenerateCsrfToken(request)

        if (!csrfToken) {
            return NextResponse.json(
                {
                    success: false,
                    error: "No active session",
                },
                { status: 401 }
            )
        }

        // Create response with data
        const response = NextResponse.json({
            success: true,
            message: "Data retrieved successfully",
            data: {
                csrfToken, // Include CSRF token in response
                exampleData: "This is example data",
            },
        })

        // Add CSRF token to response header
        return addCsrfTokenToResponse(response, csrfToken)
    } catch (error) {
        logger.error("Failed to process GET request", {
            context: "API",
            error,
        })

        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
            },
            { status: 500 }
        )
    }
}

/**
 * POST /api/auth/example-protected
 * Example POST endpoint that validates CSRF token
 */
export async function POST(request: NextRequest) {
    try {
        // Step 1: Validate CSRF token
        const { valid } = await validateCsrfFromRequest(request)

        if (!valid) {
            return createCsrfErrorResponse()
        }

        // Step 2: Parse request body
        const body = await request.json()
        const { data } = body

        // Step 3: Process the request (your business logic here)
        logger.info("Processing protected POST request", {
            context: "API",
            data: { hasData: !!data },
        })

        // Simulate some processing
        const result = {
            processed: true,
            receivedData: data,
        }

        // Step 4: Create success response
        const response = NextResponse.json({
            success: true,
            message: "Data processed successfully",
            data: result,
        })

        // Step 5: Regenerate CSRF token after successful operation
        const newCsrfToken = regenerateCsrfToken(request)

        if (newCsrfToken) {
            return addCsrfTokenToResponse(response, newCsrfToken)
        }

        return response
    } catch (error) {
        logger.error("Failed to process POST request", {
            context: "API",
            error,
        })

        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
            },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/auth/example-protected
 * Example PUT endpoint that validates CSRF token
 */
export async function PUT(request: NextRequest) {
    try {
        // Validate CSRF token
        const { valid } = await validateCsrfFromRequest(request)

        if (!valid) {
            return createCsrfErrorResponse()
        }

        // Parse request body
        const body = await request.json()

        // Process the update
        logger.info("Processing protected PUT request", {
            context: "API",
        })

        // Create success response
        const response = NextResponse.json({
            success: true,
            message: "Data updated successfully",
        })

        // Regenerate CSRF token
        const newCsrfToken = regenerateCsrfToken(request)

        if (newCsrfToken) {
            return addCsrfTokenToResponse(response, newCsrfToken)
        }

        return response
    } catch (error) {
        logger.error("Failed to process PUT request", {
            context: "API",
            error,
        })

        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
            },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/auth/example-protected
 * Example DELETE endpoint that validates CSRF token
 */
export async function DELETE(request: NextRequest) {
    try {
        // Validate CSRF token
        const { valid } = await validateCsrfFromRequest(request)

        if (!valid) {
            return createCsrfErrorResponse()
        }

        // Process the deletion
        logger.info("Processing protected DELETE request", {
            context: "API",
        })

        // Create success response
        const response = NextResponse.json({
            success: true,
            message: "Data deleted successfully",
        })

        // Regenerate CSRF token
        const newCsrfToken = regenerateCsrfToken(request)

        if (newCsrfToken) {
            return addCsrfTokenToResponse(response, newCsrfToken)
        }

        return response
    } catch (error) {
        logger.error("Failed to process DELETE request", {
            context: "API",
            error,
        })

        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
            },
            { status: 500 }
        )
    }
}
