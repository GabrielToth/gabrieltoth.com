import { createServer } from "node:http"
import { WebSocketServer, WebSocket } from "ws"
import { config } from "dotenv"
import jwt from "jsonwebtoken"
import { YouTubeRelay } from "./youtube-relay.js"
import { TwitchIrcRelay } from "./twitch-relay.js"
import { KickPusherRelay } from "./kick-relay.js"
import { executeModeration, cleanupAllTimeouts } from "./moderation-handler.js"

config()

const PORT = parseInt(process.env.WS_PORT || "3100", 10)
const PING_INTERVAL = 30000
const JWT_SECRET =
    process.env.OAUTH_STATE_SECRET || process.env.JWT_SECRET || ""

const ALLOWED_ORIGINS = [
    "https://gabrieltoth.com",
    "https://ws.gabrieltoth.com",
    "http://localhost:3000",
    "http://localhost:3100",
]

function isLanAddress(ip: string): boolean {
    const parts = ip.split(".").map(Number)
    if (parts.length !== 4) return false
    const first = parts[0]
    if (first === 10 || first === 127) return true
    if (first === 172 && parts[1] >= 16 && parts[1] <= 31) return true
    if (first === 192 && parts[1] === 168) return true
    return false
}

function isLocalRequest(info: {
    req: {
        socket: { remoteAddress?: string }
        headers: Record<string, string | string[] | undefined>
    }
}): boolean {
    const remote = (info.req.socket.remoteAddress || "").replace(/^::ffff:/, "")
    const cfIp = (info.req.headers["cf-connecting-ip"] || "") as string
    if (isLanAddress(remote)) return true
    if (cfIp && isLanAddress(cfIp)) return true
    return false
}

const STARTED_AT = Date.now()

function log(...args: unknown[]): void {
    console.log(`[${new Date().toISOString()}]`, ...args)
}

interface PlatformConnection {
    platform: "twitch" | "kick" | "youtube"
    connected: boolean
    connectedAt: number
    cleanup: () => void
}

interface ClientInfo {
    userId: string
    ws: WebSocket
    platforms: Map<string, PlatformConnection>
    connectedAt: number
}

const server = createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
        const data = {
            status: "online",
            uptime: Math.floor((Date.now() - STARTED_AT) / 1000),
            clients: clients.size,
            timestamp: new Date().toISOString(),
        }
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        })
        res.end(JSON.stringify(data, null, 2))
        return
    }
    res.writeHead(404)
    res.end()
})

const wss = new WebSocketServer({
    server,
    verifyClient: (
        info: {
            origin?: string
            req: {
                socket: { remoteAddress?: string }
                headers: Record<string, string | string[] | undefined>
            }
        },
        cb: (result: boolean, code?: number, message?: string) => void
    ) => {
        const origin = (info.origin || info.req.headers.origin || "") as string
        if (ALLOWED_ORIGINS.includes(origin)) return cb(true)
        if (isLocalRequest(info)) return cb(true)
        log("Connection rejected by origin", origin)
        cb(false, 403, "Forbidden")
    },
})

const clients = new Map<WebSocket, ClientInfo>()

// Relay instances per user
const youtubeRelays = new Map<string, YouTubeRelay>()
const twitchRelays = new Map<string, TwitchIrcRelay>()
const kickRelays = new Map<string, KickPusherRelay>()

wss.on("connection", (ws: WebSocket, req) => {
    const url = new URL(req.url || "", "http://localhost")
    const tokenParam = url.searchParams.get("token") || ""

    let userId = ""
    let decoded: any = null

    if (tokenParam && JWT_SECRET) {
        try {
            decoded = jwt.verify(tokenParam, JWT_SECRET)
            userId = decoded.sub || ""
            log("Client authenticated", { userId })
        } catch (err: any) {
            log("JWT verification failed", err.message)
            ws.send(
                JSON.stringify({
                    type: "error",
                    platform: "auth",
                    error: "Invalid token",
                })
            )
        }
    }

    const clientInfo: ClientInfo = {
        userId,
        ws,
        platforms: new Map(),
        connectedAt: Date.now(),
    }
    clients.set(ws, clientInfo)

    ws.send(
        JSON.stringify({
            type: "connected",
            data: { server: "gabrieltoth-relay", userId },
        })
    )

    ws.on("message", async (raw: Buffer) => {
        try {
            const msg = JSON.parse(raw.toString())

            if (msg.type === "connect") {
                const platform = msg.platform
                if (platform === "twitch") {
                    await handleTwitchConnect(clientInfo, msg.token, msg.channelName)
                } else if (platform === "kick") {
                    await handleKickConnect(clientInfo, msg.token, msg.channelName)
                } else if (platform === "youtube") {
                    await handleYouTubeConnect(
                        clientInfo,
                        msg.token,
                        msg.liveChatId
                    )
                } else {
                    if (clientInfo.ws.readyState === WebSocket.OPEN) {
                        clientInfo.ws.send(
                            JSON.stringify({
                                type: "error",
                                platform,
                                error: `Unsupported platform: ${platform}`,
                            })
                        )
                    }
                }
                return
            }

            if (msg.type === "disconnect") {
                const platform = msg.platform
                if (platform === "twitch") {
                    handleTwitchDisconnect(clientInfo)
                } else if (platform === "kick") {
                    handleKickDisconnect(clientInfo)
                } else if (platform === "youtube") {
                    handleYouTubeDisconnect(clientInfo)
                }
                return
            }

            if (msg.type === "moderate") {
                const tRelay = twitchRelays.get(clientInfo.userId)
                const kRelay = kickRelays.get(clientInfo.userId)
                await executeModeration(
                    clientInfo.ws,
                    clientInfo.userId,
                    msg.action,
                    msg.targetUserId,
                    msg.targetUsername,
                    msg.platform,
                    msg.duration,
                    msg.reason,
                    tRelay,
                    kRelay
                )
                return
            }
        } catch {
            // ignore malformed messages
        }
    })

    ws.on("close", () => {
        cleanupClient(clientInfo)
        clients.delete(ws)
        log("Client disconnected", { userId })
    })

    ws.on("error", () => {
        cleanupClient(clientInfo)
        clients.delete(ws)
    })
})

async function handleTwitchConnect(
    client: ClientInfo,
    token: string,
    channelName: string
): Promise<void> {
    if (!token) {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "error",
                    platform: "twitch",
                    error: "No Twitch OAuth token provided",
                })
            )
        }
        return
    }

    if (!channelName) {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "error",
                    platform: "twitch",
                    error: "No channel name provided",
                })
            )
        }
        return
    }

    const relay = new TwitchIrcRelay()

    relay.on("connected", (roomId: string) => {
        log("Twitch IRC connected", { roomId, userId: client.userId })
        client.platforms.set("twitch", {
            platform: "twitch",
            connected: true,
            connectedAt: Date.now(),
            cleanup: () => relay.disconnect(roomId),
        })
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "status",
                    platform: "twitch",
                    connected: true,
                    channelName: roomId,
                })
            )
        }
    })

    relay.on("disconnected", (roomId: string, reason: string) => {
        log("Twitch IRC disconnected", { roomId, reason, userId: client.userId })
        client.platforms.set("twitch", {
            platform: "twitch",
            connected: false,
            connectedAt: Date.now(),
            cleanup: () => relay.disconnect(roomId),
        })
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "status",
                    platform: "twitch",
                    connected: false,
                    reason,
                })
            )
        }
    })

    relay.onMessage(channelName, (msg) => {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    event: "twitch:message",
                    platform: "twitch",
                    id: msg.id,
                    channelId: msg.channelId,
                    user: msg.user,
                    content: msg.content,
                    msgType: msg.type,
                    timestamp: msg.timestamp,
                    isAction: msg.isAction,
                })
            )
        }
    })

    relay.onError((err: Error) => {
        log("Twitch IRC error", {
            error: err.message,
            userId: client.userId,
        })
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "error",
                    platform: "twitch",
                    error: err.message,
                })
            )
        }
    })

    twitchRelays.set(client.userId, relay)

    try {
        await relay.connect(channelName, token)
    } catch (error: any) {
        log("Twitch relay connect failed", {
            error: error.message,
            userId: client.userId,
        })
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "error",
                    platform: "twitch",
                    error: error.message,
                })
            )
        }
    }
}

function handleTwitchDisconnect(client: ClientInfo): void {
    for (const [, platformConn] of client.platforms) {
        if (platformConn.platform === "twitch") {
            try { platformConn.cleanup() } catch {}
            client.platforms.delete("twitch")
            break
        }
    }
    twitchRelays.delete(client.userId)
    if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(
            JSON.stringify({
                type: "status",
                platform: "twitch",
                connected: false,
            })
        )
    }
}

async function handleKickConnect(
    client: ClientInfo,
    token: string,
    channelName: string
): Promise<void> {
    if (!token) {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "error",
                    platform: "kick",
                    error: "No Kick OAuth token provided",
                })
            )
        }
        return
    }

    if (!channelName) {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "error",
                    platform: "kick",
                    error: "No channel name provided",
                })
            )
        }
        return
    }

    const relay = new KickPusherRelay()

    relay.on("connected", (roomId: string, chatroomId: number | null) => {
        log("Kick Pusher connected", { roomId, chatroomId, userId: client.userId })
        client.platforms.set("kick", {
            platform: "kick",
            connected: true,
            connectedAt: Date.now(),
            cleanup: () => relay.disconnect(roomId),
        })
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "status",
                    platform: "kick",
                    connected: true,
                    channelName: roomId,
                })
            )
        }
    })

    relay.on("disconnected", (roomId: string, reason: string) => {
        log("Kick Pusher disconnected", { roomId, reason, userId: client.userId })
        client.platforms.set("kick", {
            platform: "kick",
            connected: false,
            connectedAt: Date.now(),
            cleanup: () => relay.disconnect(roomId),
        })
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "status",
                    platform: "kick",
                    connected: false,
                    reason,
                })
            )
        }
    })

    relay.onMessage(channelName, (msg) => {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    event: "kick:message",
                    platform: "kick",
                    id: msg.id,
                    channelId: msg.channelId,
                    user: msg.user,
                    content: msg.content,
                    msgType: msg.type,
                    timestamp: msg.timestamp,
                    isAction: msg.isAction,
                })
            )
        }
    })

    relay.onError((err: Error) => {
        log("Kick Pusher error", {
            error: err.message,
            userId: client.userId,
        })
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "error",
                    platform: "kick",
                    error: err.message,
                })
            )
        }
    })

    kickRelays.set(client.userId, relay)

    try {
        await relay.connect(channelName, token)
    } catch (error: any) {
        log("Kick relay connect failed", {
            error: error.message,
            userId: client.userId,
        })
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "error",
                    platform: "kick",
                    error: error.message,
                })
            )
        }
    }
}

function handleKickDisconnect(client: ClientInfo): void {
    for (const [, platformConn] of client.platforms) {
        if (platformConn.platform === "kick") {
            try { platformConn.cleanup() } catch {}
            client.platforms.delete("kick")
            break
        }
    }
    kickRelays.delete(client.userId)
    if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(
            JSON.stringify({
                type: "status",
                platform: "kick",
                connected: false,
            })
        )
    }
}

async function handleYouTubeConnect(
    client: ClientInfo,
    token: string,
    preferredLiveChatId?: string
): Promise<void> {
    const existing = youtubeRelays.get(client.userId)
    if (existing) {
        existing.stop()
        youtubeRelays.delete(client.userId)
    }

    if (!token) {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "error",
                    platform: "youtube",
                    error: "No YouTube OAuth token provided",
                })
            )
        }
        return
    }

    const relay = new YouTubeRelay(token)

    relay.on("connected", (liveChatId: string) => {
        log("YouTube stream connected", {
            liveChatId,
            userId: client.userId,
        })
        youtubeRelays.set(client.userId, relay)
        client.platforms.set("youtube", {
            platform: "youtube",
            connected: true,
            connectedAt: Date.now(),
            cleanup: () => relay.stop(),
        })
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "status",
                    platform: "youtube",
                    connected: true,
                    liveChatId,
                })
            )
        }
    })

    relay.on("message", msg => {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    event: "youtube:message",
                    platform: "youtube",
                    id: msg.id,
                    channelId: msg.channelId,
                     user: msg.user,
                     content: msg.content,
                     msgType: msg.type,
                     timestamp: msg.timestamp,
                 })
             )
         }
     })

    relay.on("disconnected", (reason: string) => {
        log("YouTube stream disconnected", {
            reason,
            userId: client.userId,
        })
        client.platforms.set("youtube", {
            platform: "youtube",
            connected: false,
            connectedAt: Date.now(),
            cleanup: () => relay.stop(),
        })
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "status",
                    platform: "youtube",
                    connected: false,
                    reason,
                })
            )
        }
    })

    relay.on("reconnecting", (attempt: number, delay: number) => {
        log("YouTube reconnecting", {
            attempt,
            delay,
            userId: client.userId,
        })
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "reconnecting",
                    platform: "youtube",
                    attempt,
                    delay,
                })
            )
        }
    })

    relay.on("error", (error: Error) => {
        log("YouTube stream error", {
            error: error.message,
            userId: client.userId,
        })
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "error",
                    platform: "youtube",
                    error: error.message,
                })
            )
        }
    })

    try {
        await relay.start()
    } catch (error: any) {
        log("YouTube relay start failed", {
            error: error.message,
            userId: client.userId,
        })
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
                JSON.stringify({
                    type: "error",
                    platform: "youtube",
                    error: error.message,
                })
            )
        }
    }
}

function handleYouTubeDisconnect(client: ClientInfo): void {
    const relay = youtubeRelays.get(client.userId)
    if (relay) {
        relay.stop()
        youtubeRelays.delete(client.userId)
    }
    client.platforms.delete("youtube")
    if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(
            JSON.stringify({
                type: "status",
                platform: "youtube",
                connected: false,
            })
        )
    }
}


function cleanupClient(client: ClientInfo): void {
    for (const [, platform] of client.platforms) {
        try {
            platform.cleanup()
        } catch {}
    }
    client.platforms.clear()
    twitchRelays.delete(client.userId)
    kickRelays.delete(client.userId)
    youtubeRelays.delete(client.userId)
    cleanupAllTimeouts()
}

setInterval(() => {
    for (const ws of wss.clients) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping()
        }
    }
}, PING_INTERVAL)

server.listen(PORT, "0.0.0.0", () => {
    log(`Relay server listening on 0.0.0.0:${PORT}`)
})