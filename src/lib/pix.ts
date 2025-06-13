import QRCode from "qrcode"

// PIX Key configuration
const PIX_KEY = process.env.PIX_KEY || "your_pix_key_here"
const PIX_MERCHANT_NAME =
    process.env.PIX_MERCHANT_NAME || "Gabriel Toth Goncalves"
const PIX_MERCHANT_CITY = process.env.PIX_MERCHANT_CITY || "Sao Paulo"

export interface PixPaymentData {
    amount: number
    description: string
    orderId: string
    pixKey?: string
}

export interface PixResponse {
    qrCode: string
    copyPasteCode: string
    pixKey: string
    amount: number
    orderId: string
}

// Generate tracking code
export function generateTrackingCode(): string {
    const prefix = "TRACK"
    const segments = Array(3)
        .fill(0)
        .map(() => Math.random().toString(36).substr(2, 4).toUpperCase())
    return `${prefix}-${segments.join("-")}`
}

// Generate PIX static QR code (simplified)
export async function generatePixQR(
    data: PixPaymentData
): Promise<PixResponse> {
    const pixKey = data.pixKey || PIX_KEY

    // Create PIX payload (simplified version)
    const pixPayload = createPixPayload({
        pixKey,
        merchantName: PIX_MERCHANT_NAME,
        merchantCity: PIX_MERCHANT_CITY,
        amount: data.amount,

        txId: data.orderId,
    })

    // Generate QR Code
    const qrCodeDataURL = await QRCode.toDataURL(pixPayload, {
        width: 300,
        margin: 2,
        color: {
            dark: "#000000",
            light: "#FFFFFF",
        },
    })

    return {
        qrCode: qrCodeDataURL,
        copyPasteCode: pixPayload,
        pixKey,
        amount: data.amount,
        orderId: data.orderId,
    }
}

// Create PIX payload (EMV format simplified)
function createPixPayload({
    pixKey,
    merchantName,
    merchantCity,
    amount,
    txId,
}: {
    pixKey: string
    merchantName: string
    merchantCity: string
    amount: number
    txId: string
}): string {
    // This is a simplified PIX payload
    // In production, use a proper PIX library like @bacen/pix-utils

    const formatField = (id: string, value: string) => {
        const length = value.length.toString().padStart(2, "0")
        return `${id}${length}${value}`
    }

    // PIX static structure (simplified)
    let payload = ""

    // Payload Format Indicator
    payload += formatField("00", "01")

    // Point of Initiation Method (static)
    payload += formatField("01", "11")

    // Merchant Account Information
    let merchantAccountInfo = ""
    merchantAccountInfo += formatField("00", "BR.GOV.BCB.PIX")
    merchantAccountInfo += formatField("01", pixKey)
    payload += formatField("26", merchantAccountInfo)

    // Merchant Category Code
    payload += formatField("52", "0000")

    // Transaction Currency (BRL)
    payload += formatField("53", "986")

    // Transaction Amount
    if (amount > 0) {
        payload += formatField("54", amount.toFixed(2))
    }

    // Country Code
    payload += formatField("58", "BR")

    // Merchant Name
    payload += formatField("59", merchantName.substring(0, 25))

    // Merchant City
    payload += formatField("60", merchantCity.substring(0, 15))

    // Additional Data Field Template
    let additionalData = ""
    additionalData += formatField("05", txId.substring(0, 25)) // Reference Label
    payload += formatField("62", additionalData)

    // CRC16 (simplified - just append for demo)
    payload += "6304"
    const crc = calculateCRC16(payload)
    payload += crc

    return payload
}

// Simplified CRC16 calculation
function calculateCRC16(payload: string): string {
    // This is a simplified version
    // In production, use proper CRC16-CCITT implementation
    let crc = 0xffff

    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021
            } else {
                crc = crc << 1
            }
        }
    }

    crc = crc & 0xffff
    return crc.toString(16).toUpperCase().padStart(4, "0")
}

// PIX payment verification (manual process)
export interface PixVerificationRequest {
    orderId: string
    amount: number
    dateTime: string
    reference?: string
}

export function validatePixPayment(
    verification: PixVerificationRequest
): boolean {
    // In a real implementation, this would:
    // 1. Connect to bank API
    // 2. Verify transaction exists
    // 3. Check amount matches
    // 4. Verify it's for the correct PIX key

    // For now, return true if data looks valid
    return !!(
        verification.orderId &&
        verification.amount > 0 &&
        verification.dateTime &&
        new Date(verification.dateTime).getTime() > 0
    )
}

// Generate PIX QR for specific services
export async function generateServicePixQR(
    serviceType: string,
    amount: number
): Promise<PixResponse> {
    const trackingCode = generateTrackingCode()

    const pixData: PixPaymentData = {
        amount,
        description: `${serviceType} - ${trackingCode}`,
        orderId: trackingCode,
    }

    return generatePixQR(pixData)
}

// PIX payment status checking
export enum PixPaymentStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    FAILED = "failed",
}

export interface PixStatusCheck {
    orderId: string
    status: PixPaymentStatus
    amount?: number
    paidAt?: string
    reference?: string
}

// Mock PIX status check (replace with real bank API)
export async function checkPixPaymentStatus(
    orderId: string
): Promise<PixStatusCheck> {
    // In production, this would call your bank's API
    // For demo purposes, randomly return status

    const statuses = [
        PixPaymentStatus.PENDING,
        PixPaymentStatus.CONFIRMED,
        PixPaymentStatus.FAILED,
    ]
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

    return {
        orderId,
        status: randomStatus,
        amount: randomStatus === PixPaymentStatus.CONFIRMED ? 100 : undefined,
        paidAt:
            randomStatus === PixPaymentStatus.CONFIRMED
                ? new Date().toISOString()
                : undefined,
        reference: orderId,
    }
}
