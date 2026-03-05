#!/usr/bin/env node
// Wrapper to run tsx with proper Node.js options
const { spawn } = require("child_process")
const path = require("path")

const tsx = require.resolve("tsx/dist/cli.mjs")
const args = [tsx, "src/backend/server.ts"]

const child = spawn(
    "node",
    ["--max-old-space-size=512", "--expose-gc", ...args],
    {
        stdio: "inherit",
        cwd: path.join(__dirname, "../.."),
    }
)

process.on("SIGTERM", () => child.kill("SIGTERM"))
process.on("SIGINT", () => child.kill("SIGINT"))

child.on("exit", code => process.exit(code))
