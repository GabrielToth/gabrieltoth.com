import "@testing-library/jest-dom/vitest"
import fs from "fs"
import path from "path"
import React from "react"

function loadEnvFile(fileName: string): void {
    const filePath = path.resolve(process.cwd(), fileName)
    if (!fs.existsSync(filePath)) {
        return
    }
    const content = fs.readFileSync(filePath, "utf8")
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim()
        if (!line || line.startsWith("#")) {
            continue
        }
        const eqIndex = line.indexOf("=")
        if (eqIndex === -1) {
            continue
        }
        const key = line.slice(0, eqIndex).trim()
        let value = line.slice(eqIndex + 1).trim()
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1)
        }
        if (process.env[key] === undefined) {
            process.env[key] = value
        }
    }
}

// Load environment variables for tests (supports Next.js style .env.local)
loadEnvFile(".env.local")
loadEnvFile(".env")
;(globalThis as any).React = React
