/**
 * meta-publisher worker
 *
 * Polls Supabase meta_publish_tasks table for pending tasks,
 * executes publish-meta.js against the real Chrome, and updates
 * the task status.
 *
 * Usage:
 *   node index.js
 */

const { createClient } = require("@supabase/supabase-js")
const { execSync } = require("child_process")
const path = require("path")
const fs = require("fs")

require("dotenv").config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL, 10) || 10000
const CHROME_PORT = parseInt(process.env.CHROME_PORT, 10) || 9222
const PUBLISH_SCRIPT = process.env.PUBLISH_SCRIPT || path.join(__dirname, "publish-meta.js")
const UPLOAD_DIR = process.env.UPLOAD_DIR || "C:\\meta-pub\\uploads"
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, "logs")

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    process.exit(1)
}

fs.mkdirSync(LOG_DIR, { recursive: true })

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
})

function log(level, message, data) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...data,
    }
    const line = JSON.stringify(entry)
    console.log(line)
    fs.appendFileSync(
        path.join(LOG_DIR, `worker-${new Date().toISOString().slice(0, 10)}.log`),
        line + "\n"
    )
}

async function poll() {
    try {
        const { data: tasks, error } = await supabase
            .from("meta_publish_tasks")
            .select("*")
            .in("status", ["pending"])
            .order("created_at", { ascending: true })
            .limit(5)

        if (error) {
            log("error", "Failed to poll tasks", { error: error.message })
            return
        }

        for (const task of tasks || []) {
            await processTask(task)
        }
    } catch (err) {
        log("error", "Poll iteration failed", { error: err.message })
    }
}

async function processTask(task) {
    log("info", "Processing task", { taskId: task.id, type: task.task_type })

    await supabase
        .from("meta_publish_tasks")
        .update({ status: "processing" })
        .eq("id", task.id)

    const taskFile = path.join(LOG_DIR, `task-${task.id}.json`)
    fs.writeFileSync(taskFile, JSON.stringify(task, null, 2))

    try {
        const scriptPath = PUBLISH_SCRIPT
        const cmd = `node "${scriptPath}" --task-file "${taskFile}" --chrome-port ${CHROME_PORT}`

        log("info", "Executing publish script", { cmd })

        const output = execSync(cmd, {
            cwd: path.dirname(scriptPath),
            timeout: 600000,
            encoding: "utf-8",
            maxBuffer: 10 * 1024 * 1024,
        })

        const resultMatch = output.match(/---RESULT---\n([\s\S]*?)\n---END RESULT---/)
        if (!resultMatch) {
            throw new Error("Could not parse script output")
        }

        const result = JSON.parse(resultMatch[1])

        if (result.success) {
            log("info", "Task completed successfully", {
                taskId: task.id,
                result: result.result,
            })

            await supabase
                .from("meta_publish_tasks")
                .update({
                    status: "completed",
                    result: result.result,
                    completed_at: new Date().toISOString(),
                })
                .eq("id", task.id)

            cleanupVideo(task)
        } else {
            throw new Error(result.error || "Unknown error")
        }
    } catch (err) {
        log("error", "Task failed", { taskId: task.id, error: err.message })

        await supabase
            .from("meta_publish_tasks")
            .update({
                status: "failed",
                error_message: err.message,
            })
            .eq("id", task.id)
    } finally {
        try {
            fs.unlinkSync(taskFile)
        } catch {}
    }
}

function cleanupVideo(task) {
    if (task.video_path && task.video_source === "upload") {
        try {
            fs.unlinkSync(task.video_path)
            log("info", "Cleaned up uploaded video", { path: task.video_path })
        } catch (err) {
            log("warn", "Failed to cleanup video", {
                path: task.video_path,
                error: err.message,
            })
        }
    }
}

console.log(`Meta Publisher Worker starting...`)
console.log(`Supabase URL: ${SUPABASE_URL}`)
console.log(`Chrome port: ${CHROME_PORT}`)
console.log(`Poll interval: ${POLL_INTERVAL}ms`)
console.log(`Publish script: ${PUBLISH_SCRIPT}`)
console.log(`Log dir: ${LOG_DIR}`)

poll()
setInterval(poll, POLL_INTERVAL)
