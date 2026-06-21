export type EnvMode = "local_only" | "local_preferred" | "cloud_preferred" | "cloud_only"

export interface LocalEnvEntry {
    key: string
    value: string
    label: string
}

export interface ServiceEnvs {
    serviceId: string
    serviceName: string
    icon: string
    mode: EnvMode
    envs: LocalEnvEntry[]
}

export interface LocalEnvsData {
    version: 1
    services: ServiceEnvs[]
}

export interface ServiceDefinition {
    id: string
    name: string
    icon: string
    envVars: { key: string; label: string; secret?: boolean }[]
}

export const KNOWN_SERVICES: ServiceDefinition[] = [
    {
        id: "google",
        name: "Google (YouTube, OAuth)",
        icon: "globe",
        envVars: [
            { key: "GOOGLE_CLIENT_ID", label: "Google Client ID", secret: true },
            { key: "GOOGLE_CLIENT_SECRET", label: "Google Client Secret", secret: true },
            { key: "YOUTUBE_CLIENT_ID", label: "YouTube Client ID", secret: true },
            { key: "YOUTUBE_CLIENT_SECRET", label: "YouTube Client Secret", secret: true },
        ],
    },
    {
        id: "meta",
        name: "Meta (Facebook, Instagram)",
        icon: "facebook",
        envVars: [
            { key: "META_ACCESS_TOKEN", label: "Meta Access Token", secret: true },
            { key: "META_APP_ID", label: "Meta App ID", secret: true },
            { key: "META_APP_SECRET", label: "Meta App Secret", secret: true },
            { key: "FACEBOOK_PAGE_ID", label: "Facebook Page ID" },
            { key: "INSTAGRAM_BUSINESS_ID", label: "Instagram Business ID" },
        ],
    },
    {
        id: "tiktok",
        name: "TikTok",
        icon: "music",
        envVars: [
            { key: "TIKTOK_ACCESS_TOKEN", label: "TikTok Access Token", secret: true },
            { key: "TIKTOK_CLIENT_KEY", label: "TikTok Client Key", secret: true },
            { key: "TIKTOK_CLIENT_SECRET", label: "TikTok Client Secret", secret: true },
        ],
    },
    {
        id: "twitter",
        name: "Twitter / X",
        icon: "twitter",
        envVars: [
            { key: "TWITTER_API_KEY", label: "Twitter API Key", secret: true },
            { key: "TWITTER_API_SECRET", label: "Twitter API Secret", secret: true },
            { key: "TWITTER_ACCESS_TOKEN", label: "Twitter Access Token", secret: true },
            { key: "TWITTER_ACCESS_SECRET", label: "Twitter Access Token Secret", secret: true },
            { key: "TWITTER_BEARER_TOKEN", label: "Twitter Bearer Token", secret: true },
        ],
    },
    {
        id: "linkedin",
        name: "LinkedIn",
        icon: "linkedin",
        envVars: [
            { key: "LINKEDIN_CLIENT_ID", label: "LinkedIn Client ID", secret: true },
            { key: "LINKEDIN_CLIENT_SECRET", label: "LinkedIn Client Secret", secret: true },
            { key: "LINKEDIN_ACCESS_TOKEN", label: "LinkedIn Access Token", secret: true },
        ],
    },
    {
        id: "openai",
        name: "OpenAI",
        icon: "sparkles",
        envVars: [
            { key: "OPENAI_API_KEY", label: "OpenAI API Key", secret: true },
            { key: "OPENAI_ORG_ID", label: "OpenAI Organization ID" },
        ],
    },
    {
        id: "resend",
        name: "Resend (Email)",
        icon: "mail",
        envVars: [
            { key: "RESEND_API_KEY", label: "Resend API Key", secret: true },
        ],
    },
    {
        id: "discord",
        name: "Discord",
        icon: "message-circle",
        envVars: [
            { key: "DISCORD_WEBHOOK_URL", label: "Discord Webhook URL", secret: true },
        ],
    },
]

export const STORAGE_KEY = "gabrieltoth_local_envs"

export const MODE_LABELS: Record<EnvMode, string> = {
    local_only: "Exclusivamente Local",
    local_preferred: "Preferencialmente Local",
    cloud_preferred: "Preferencialmente Cloud",
    cloud_only: "Exclusivamente Cloud",
}

export const MODE_DESCRIPTIONS: Record<EnvMode, string> = {
    local_only: "Nunca usar nossas APIs na nuvem. Apenas suas chaves locais.",
    local_preferred: "Usar suas chaves locais primeiro. Fallback para nuvem quando atingir limites.",
    cloud_preferred: "Usar créditos da nuvem primeiro. Fallback para suas chaves locais quando acabar.",
    cloud_only: "Usar apenas nossas APIs na nuvem. Ignorar chaves locais.",
}
