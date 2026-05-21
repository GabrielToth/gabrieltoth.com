import { sendDiscordNotification } from "@/lib/discord"

export type UserAuditEvent =
    | "user_registered"
    | "user_login"
    | "platform_linked"

export interface UserAuditPayload {
    email?: string
    userId?: string
    provider?: string
    platform?: string
    locale?: string
    ip?: string
    environment?: string
}

const EVENT_COLORS: Record<UserAuditEvent, number> = {
    user_registered: 0x57f287,
    user_login: 0x5865f2,
    platform_linked: 0xfee75c,
}

const EVENT_TITLES: Record<UserAuditEvent, string> = {
    user_registered: "Novo usuário registrado",
    user_login: "Usuário entrou",
    platform_linked: "Plataforma vinculada",
}

/**
 * Sends a Discord audit embed for user lifecycle events (registration, login, linking).
 * No-op when DISCORD_WEBHOOK_URL is unset.
 */
export async function notifyUserAuditDiscord(
    event: UserAuditEvent,
    payload: UserAuditPayload
): Promise<void> {
    const fields: Array<{ name: string; value: string; inline?: boolean }> = []

    if (payload.email) {
        fields.push({ name: "E-mail", value: payload.email, inline: true })
    }
    if (payload.userId) {
        fields.push({ name: "User ID", value: payload.userId, inline: true })
    }
    if (payload.provider) {
        fields.push({ name: "Provedor", value: payload.provider, inline: true })
    }
    if (payload.platform) {
        fields.push({
            name: "Plataforma",
            value: payload.platform,
            inline: true,
        })
    }
    if (payload.locale) {
        fields.push({ name: "Locale", value: payload.locale, inline: true })
    }
    if (payload.ip) {
        fields.push({ name: "IP", value: payload.ip, inline: true })
    }
    if (payload.environment) {
        fields.push({
            name: "Ambiente",
            value: payload.environment,
            inline: true,
        })
    }

    await sendDiscordNotification({
        title: EVENT_TITLES[event],
        description: `Evento: \`${event}\``,
        color: EVENT_COLORS[event],
        fields,
    })
}

export function getAuditEnvironment(): string {
    if (process.env.VERCEL_ENV) {
        return process.env.VERCEL_ENV
    }
    return process.env.NODE_ENV ?? "development"
}
