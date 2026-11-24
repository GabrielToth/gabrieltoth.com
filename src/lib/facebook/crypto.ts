import crypto from "crypto"

/**
 * Generates an HMAC-SHA256 appsecret_proof for Meta Graph API calls.
 */
export function generateAppSecretProof(
    accessToken: string,
    appSecret: string
): string {
    if (!accessToken || !appSecret) {
        return ""
    }
    return crypto
        .createHmac("sha256", appSecret)
        .update(accessToken)
        .digest("hex")
}

export interface MetaSignedRequestPayload {
    algorithm?: string
    user_id?: string
    issued_at?: number
    expires?: number
    oauth_token?: string
    [key: string]: unknown
}

export interface ParsedSignedRequest {
    valid: boolean
    payload?: MetaSignedRequestPayload
    error?: string
}

function base64UrlDecode(input: string): Buffer {
    let base64 = input.replace(/-/g, "+").replace(/_/g, "/")
    while (base64.length % 4 !== 0) {
        base64 += "="
    }
    return Buffer.from(base64, "base64")
}

/**
 * Parses and verifies a Meta signed_request (HMAC-SHA256).
 */
export function parseMetaSignedRequest(
    signedRequest: string,
    appSecret: string
): ParsedSignedRequest {
    if (!signedRequest || typeof signedRequest !== "string") {
        return { valid: false, error: "MISSING_SIGNED_REQUEST" }
    }
    if (!appSecret || typeof appSecret !== "string") {
        return { valid: false, error: "MISSING_APP_SECRET" }
    }

    const parts = signedRequest.split(".")
    if (parts.length !== 2) {
        return { valid: false, error: "MALFORMED_SIGNED_REQUEST" }
    }

    const [encodedSig, encodedPayload] = parts
    if (!encodedSig || !encodedPayload) {
        return { valid: false, error: "EMPTY_PARTS" }
    }

    let sigBuffer: Buffer
    let payloadBuffer: Buffer
    try {
        sigBuffer = base64UrlDecode(encodedSig)
        payloadBuffer = base64UrlDecode(encodedPayload)
    } catch {
        return { valid: false, error: "BASE64_DECODE_FAILED" }
    }

    let payload: MetaSignedRequestPayload
    try {
        payload = JSON.parse(payloadBuffer.toString("utf8"))
    } catch {
        return { valid: false, error: "INVALID_JSON_PAYLOAD" }
    }

    if (!payload || typeof payload !== "object") {
        return { valid: false, error: "INVALID_PAYLOAD_STRUCTURE" }
    }

    if (
        payload.algorithm &&
        payload.algorithm.toUpperCase() !== "HMAC-SHA256"
    ) {
        return { valid: false, error: "UNSUPPORTED_ALGORITHM" }
    }

    const expectedSig = crypto
        .createHmac("sha256", appSecret)
        .update(encodedPayload)
        .digest()

    if (
        sigBuffer.length !== expectedSig.length ||
        !crypto.timingSafeEqual(sigBuffer, expectedSig)
    ) {
        return { valid: false, error: "SIGNATURE_MISMATCH" }
    }

    return {
        valid: true,
        payload,
    }
}
