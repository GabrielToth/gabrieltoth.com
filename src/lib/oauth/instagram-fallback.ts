export interface InstagramBypassConfig {
    hasPageAccessToken: boolean
    tokenLength?: number
    isValid: boolean
}

export function validateInstagramBypassConfig(): InstagramBypassConfig {
    const token = process.env.INSTAGRAM_PAGE_ACCESS_TOKEN
    if (!token) {
        return { hasPageAccessToken: false, isValid: false }
    }
    return {
        hasPageAccessToken: true,
        tokenLength: token.length,
        isValid: token.length > 20,
    }
}
