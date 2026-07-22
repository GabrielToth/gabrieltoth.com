const express = require("express")
const cors = require("cors")
const path = require("path")
const fs = require("fs")
const { Server } = require("@tus/server")
const { FileStore } = require("@tus/file-store")
require("dotenv").config()

const PORT = parseInt(process.env.PORT, 10) || 3001
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "uploads")
const SUPABASE_URL = process.env.SUPABASE_URL || ""
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

let supabase = null
if (SUPABASE_URL && SUPABASE_KEY) {
    const { createClient } = require("@supabase/supabase-js")
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
}

fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

function extractAuth(req) {
    const auth = req.headers.authorization || ""
    const parts = auth.split(" ")
    if (parts.length !== 2 || parts[0] !== "Bearer") return null
    return parts[1]
}

// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() })
})

// FileStore for tus
const fileStore = new FileStore({
    directory: UPLOAD_DIR,
})

// tus server
const tusServer = new Server(fileStore, {
    path: "/upload",
    async onIncomingRequest(req, res) {
        const taskId = extractAuth(req)
        if (!taskId) {
            res.statusCode = 401
            res.end(JSON.stringify({ error: "Missing or invalid Authorization header. Format: Bearer <taskId>" }))
            return { completed: true }
        }

        if (!supabase) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: "Server not configured" }))
            return { completed: true }
        }

        const { data: task, error } = await supabase
            .from("meta_publish_tasks")
            .select("id, status")
            .eq("id", taskId)
            .single()

        if (error || !task) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: "Task not found" }))
            return { completed: true }
        }

        if (task.status !== "uploading") {
            res.statusCode = 400
            res.end(JSON.stringify({ error: `Task is in '${task.status}' state, expected 'uploading'` }))
            return { completed: true }
        }

        req.metaTaskId = taskId
        return { completed: false }
    },
    async onUploadFinish(req, res, upload) {
        const taskId = req.metaTaskId
        const originalName = upload.metadata?.filename || "unknown"

        if (taskId && supabase) {
            const filePath = path.join(UPLOAD_DIR, upload.id)
            await supabase
                .from("meta_publish_tasks")
                .update({
                    status: "pending",
                    video_path: filePath,
                    video_original_name: originalName,
                    upload_bytes_received: upload.size,
                    upload_bytes_total: upload.size,
                })
                .eq("id", taskId)
        }
    },
})

app.all("/upload*", (req, res) => {
    tusServer.handle(req, res)
})

// List uploaded files (for recovery)
app.get("/files/:taskId", async (req, res) => {
    const { taskId } = req.params
    const dir = fs.readdirSync(UPLOAD_DIR)
    const file = dir.find(f => f.includes(taskId))
    if (!file) return res.status(404).json({ error: "File not found" })
    const stat = fs.statSync(path.join(UPLOAD_DIR, file))
    res.json({ filename: file, size: stat.size, created: stat.birthtime })
})

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Meta Publisher Server running on http://0.0.0.0:${PORT}`)
    console.log(`Upload dir: ${UPLOAD_DIR}`)
    console.log(`Allowed emails: ${ALLOWED_EMAILS.join(", ") || "(none)"}`)
})
