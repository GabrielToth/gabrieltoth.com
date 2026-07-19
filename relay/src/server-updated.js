import { createServer } from "node:http"
import { WebSocketServer } from "ws"
import { config } from "dotenv"
import { createLogger } from "./lib/logger.js"
import { TwitchIrcClient } from "./lib/twitch-irc.js"
import { KickChatClient } from "./lib/kick-chat.js"
import { YouTubeStreamListRelay } from "./lib/youtube-relay.js"
import { getCachedImage, getContentType, cleanExpired } from "./lib/image-cache.js"
import { verifyJwt } from "./lib/jwt-verify.js"

config()

const logger = createLogger("WSServer")

const PORT = parseInt(process.env.WS_PORT || "3100", 10)
const PING_INTERVAL = 30000
const CACHE_CLEAN_INTERVAL = 24 * 60 * 60 * 1000

const ALLOWED_ORIGINS = [
  "https://gabrieltoth.com",
  "https://ws.gabrieltoth.com",
  "http://localhost:3000",
  "http://localhost:3100",
]

function isLanAddress(ip) {
  const parts = ip.split(".").map(Number)
  if (parts.length !== 4) return false
  const first = parts[0]
  if (first === 10 || first === 127) return true
  if (first === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  if (first === 192 && parts[1] === 168) return true
  return false
}

function isLocalRequest(info) {
  const remote = (info.req.socket.remoteAddress || "").replace(/^::ffff:/, "")
  const cfIp = info.req.headers["cf-connecting-ip"] || ""
  if (isLanAddress(remote)) return true
  if (cfIp && isLanAddress(cfIp)) return true
  return false
}

const STARTED_AT = Date.now()

function getStatus(connections) {
  const values = Array.from(connections.values())
  const twitchStatus = values.some(c => c.twitchConnected) ? "connected" : "disconnected"
  const kickStatus = values.some(c => c.kickConnected) ? "connected" : "disconnected"
  const youtubeStatus = values.some(c => c.youtubeConnected) ? "connected" : "disconnected"
  return {
    status: "online",
    uptime: Math.floor((Date.now() - STARTED_AT) / 1000),
    clients: connections.size,
    twitch: twitchStatus,
    kick: kickStatus,
    youtube: youtubeStatus,
    timestamp: new Date().toISOString(),
  }
}

async function serveCachedImage(res, platform, name, type) {
  const fetcherMap = {
    "twitch:avatar": async () => {
      const r = await fetch(`https://api.twitch.tv/helix/users?login=${name}`, {
        headers: { "Client-Id": process.env.TWITCH_CLIENT_ID || "", Authorization: `Bearer ${process.env.TWITCH_APP_TOKEN || ""}` },
      })
      if (!r.ok) throw new Error(`Twitch API ${r.status}`)
      const d = await r.json()
      if (!d.data?.[0]?.profile_image_url) throw new Error("no avatar")
      const img = await fetch(d.data[0].profile_image_url)
      return Buffer.from(await img.arrayBuffer())
    },
    "kick:avatar": async () => {
      const r = await fetch(`https://kick.com/api/v2/channels/${name}`, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      })
      if (!r.ok) throw new Error(`Kick API ${r.status}`)
      const d = await r.json()
      const url = d.user?.profile_picture || d.banner_picture || ""
      if (!url) throw new Error("no avatar")
      const img = await fetch(url)
      return Buffer.from(await img.arrayBuffer())
    },
    "twitch:thumbnail": async () => {
      const r = await fetch(`https://api.twitch.tv/helix/streams?user_login=${name}`, {
        headers: { "Client-Id": process.env.TWITCH_CLIENT_ID || "", Authorization: `Bearer ${process.env.TWITCH_APP_TOKEN || ""}` },
      })
      if (!r.ok) throw new Error(`Twitch API ${r.status}`)
      const d = await r.json()
      const tmpl = d.data?.[0]?.thumbnail_url
      if (!tmpl) throw new Error("offline")
      const url = tmpl.replace("{width}", "640").replace("{height}", "360")
      const img = await fetch(url)
      return Buffer.from(await img.arrayBuffer())
    },
    "kick:thumbnail": async () => {
      const r = await fetch(`https://kick.com/api/v2/channels/${name}`, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      })
      if (!r.ok) throw new Error(`Kick API ${r.status}`)
      const d = await r.json()
      const url = d.livestream?.thumbnail?.url || d.banner_picture || ""
      if (!url) throw new Error("no thumbnail")
      const img = await fetch(url)
      return Buffer.from(await img.arrayBuffer())
    },
  }

  const key = `${platform}:${type}`
  const fetcher = fetcherMap[key]
  if (!fetcher) {
    res.writeHead(400)
    res.end()
    return
  }

  const result = await getCachedImage(platform, name, type, fetcher)
  if (!result) {
    res.writeHead(404)
    res.end()
    return
  }

  if (result instanceof Buffer) {
    res.writeHead(200, {
      "Content-Type": getContentType(result),
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    })
    res.end(result)
  } else {
    res.writeHead(200, {
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    })
    result.pipe(res)
  }
}

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost")

  if (url.pathname === "/health" || url.pathname === "/") {
    const data = getStatus(connections)
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    })
    res.end(JSON.stringify(data, null, 2))
    return
  }

  const cacheMatch = url.pathname.match(/^\/cache\/(avatars|thumbnails)\/(twitch|kick)\/(.+)$/)
  if (cacheMatch) {
    const [, type, platform, name] = cacheMatch
    serveCachedImage(res, platform, name, type === "thumbnails" ? "thumbnail" : "avatar")
    return
  }

  res.writeHead(404)
  res.end()
})

const wss = new WebSocketServer({
  server,
  verifyClient: (info, cb) => {
    const origin = info.origin || info.req.headers.origin || ""
    if (ALLOWED_ORIGINS.includes(origin)) return cb(true)
    if (isLocalRequest(info)) return cb(true)
    logger.warn("Connection rejected by origin", { origin, remote: info.req.socket.remoteAddress })
    cb(false, 403, "Forbidden")
  },
})

const connections = new Map()
const youtubeRelays = new Map()

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, "http://localhost")
  const tokenParam = url.searchParams.get("token") || ""

  let twitchToken = ""
  let kickToken = ""
  let twitchUsername = ""
  let kickUsername = ""
  let userId = ""

  if (tokenParam) {
    try {
      const secret = process.env.OAUTH_STATE_SECRET
      if (secret) {
        const decoded = verifyJwt(tokenParam, secret)
        userId = decoded.sub || ""
        if (decoded.twitch?.accessToken) {
          twitchToken = decoded.twitch.accessToken
          twitchUsername = decoded.twitch.username || ""
        }
        if (decoded.kick?.accessToken) {
          kickToken = decoded.kick.accessToken
          kickUsername = decoded.kick.username || ""
        }
        logger.info("JWT verified for user", { userId, platforms: Object.keys(decoded).filter(k => k !== "sub" && k !== "iat" && k !== "exp") })
      }
    } catch (err) {
      logger.warn("JWT verification failed", { error: err.message })
      ws.send(JSON.stringify({ type: "error", platform: "auth", error: "Invalid token" }))
    }
  }

  const connInfo = {
    userId,
    twitchToken,
    kickToken,
    twitchUsername,
    kickUsername,
    connectedAt: Date.now(),
    twitchConnected: false,
    kickConnected: false,
    youtubeConnected: false,
  }

  connections.set(ws, connInfo)

  const channels = []
  if (twitchUsername) channels.push(twitchUsername.toLowerCase())
  if (kickUsername) channels.push(kickUsername.toLowerCase())

  ws.send(JSON.stringify({
    type: "connected",
    data: { server: "gabrieltoth-ws", userId, channels },
  }))

  const twitch = new TwitchIrcClient()
  const kick = new KickChatClient()

  if (twitchToken && twitchUsername) {
    twitch.connect([twitchUsername.toLowerCase()], twitchToken)
    twitch.on("message", (msg) => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(msg))
      }
    })
    twitch.on("connected", () => {
      connInfo.twitchConnected = true
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: "status", platform: "twitch", connected: true }))
      }
    })
    twitch.on("disconnected", () => {
      connInfo.twitchConnected = false
    })
  }

  if (kickToken && kickUsername) {
    kick.connect([kickUsername.toLowerCase()], kickToken)
    kick.on("message", (msg) => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(msg))
      }
    })
    kick.on("connected", () => {
      connInfo.kickConnected = true
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type: "status", platform: "kick", connected: true }))
      }
    })
    kick.on("disconnected", () => {
      connInfo.kickConnected = false
    })
  }

  ws.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString())

      if (msg.type === "send") {
        const platform = msg.platform || ""
        const text = msg.text || ""
        const channel = msg.channel || ""
        if (platform === "twitch" && twitchToken && channel) {
          twitch.send(channel, text, twitchToken)
        }
        if (platform === "kick" && kickToken && channel) {
          kick.send(channel, text, kickToken)
        }
        return
      }

      if (msg.type === "connect" && msg.platform === "youtube") {
        await handleYouTubeConnect(ws, connInfo, msg.token, msg.liveChatId)
        return
      }

      if (msg.type === "disconnect" && msg.platform === "youtube") {
        handleYouTubeDisconnect(ws, connInfo)
        return
      }
    } catch { /* ignore bad messages */ }
  })

  ws.on("close", () => {
    handleYouTubeDisconnect(ws, connInfo)
    connections.delete(ws)
    twitch.disconnect()
    kick.disconnect()
  })

  ws.on("error", () => {
    handleYouTubeDisconnect(ws, connInfo)
    connections.delete(ws)
    twitch.disconnect()
    kick.disconnect()
  })
})

async function handleYouTubeConnect(ws, connInfo, token, preferredLiveChatId) {
  const existing = youtubeRelays.get(ws)
  if (existing) {
    existing.stop()
    youtubeRelays.delete(ws)
  }

  if (!token) {
    ws.send(JSON.stringify({
      type: "error",
      platform: "youtube",
      error: "No YouTube OAuth token provided",
    }))
    return
  }

  const relay = new YouTubeStreamListRelay(token)

  relay.on("connected", (liveChatId) => {
    logger.info("YouTube gRPC stream connected", { liveChatId, userId: connInfo.userId })
    youtubeRelays.set(ws, relay)
    connInfo.youtubeConnected = true
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: "status",
        platform: "youtube",
        connected: true,
        liveChatId,
      }))
    }
  })

  relay.on("message", (msg) => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        event: "youtube:message",
        platform: "youtube",
        id: msg.id,
        channelId: msg.channelId,
        user: msg.user,
        content: msg.content,
        msgType: msg.type,
        timestamp: msg.timestamp,
      }))
    }
  })

  relay.on("disconnected", (reason) => {
    logger.info("YouTube gRPC stream disconnected", { reason, userId: connInfo.userId })
    connInfo.youtubeConnected = false
    youtubeRelays.delete(ws)
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: "status",
        platform: "youtube",
        connected: false,
        reason,
      }))
    }
  })

  relay.on("reconnecting", (attempt, delay) => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: "reconnecting",
        platform: "youtube",
        attempt,
        delay,
      }))
    }
  })

  relay.on("error", (error) => {
    logger.error("YouTube gRPC error", { error: error.message, userId: connInfo.userId })
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: "error",
        platform: "youtube",
        error: error.message,
      }))
    }
  })

  try {
    await relay.start()
  } catch (error) {
    logger.error("YouTube relay start failed", { error: error.message, userId: connInfo.userId })
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: "error",
        platform: "youtube",
        error: error.message,
      }))
    }
  }
}

function handleYouTubeDisconnect(ws, connInfo) {
  const relay = youtubeRelays.get(ws)
  if (relay) {
    relay.stop()
    youtubeRelays.delete(ws)
  }
  connInfo.youtubeConnected = false
  if (ws.readyState === 1) {
    ws.send(JSON.stringify({
      type: "status",
      platform: "youtube",
      connected: false,
    }))
  }
}

const interval = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.readyState === 1) {
      ws.ping()
    }
  }
}, PING_INTERVAL)

const cacheClean = setInterval(cleanExpired, CACHE_CLEAN_INTERVAL)

wss.on("close", () => {
  clearInterval(interval)
  clearInterval(cacheClean)
})

server.listen(PORT, "0.0.0.0", () => {
  logger.info(`WebSocket server listening on 0.0.0.0:${PORT}`)
})
