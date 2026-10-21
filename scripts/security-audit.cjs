#!/usr/bin/env node
/**
 * security-audit.cjs — Audits every API route for auth/CSRF/rate-limit/idempotency.
 * Flags:
 *  - NO_AUTH     : no session/user check in handler
 *  - NO_CSRF     : mutating handler without Origin/Host validation
 *  - NO_RATE     : no rate-limit helper import or per-route limiter
 *  - ADMIN_INSECURE: admin routes without role check
 */
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const ROOT = path.resolve(__dirname, "..")
const routes = execSync("find src/app/api -name route.ts", {
    cwd: ROOT,
    encoding: "utf8",
})
    .trim()
    .split("\n")

const findings = []

for (const r of routes) {
    const text = fs.readFileSync(path.join(ROOT, r), "utf8")

    const hasAuth =
        /getServerSession|getUser|requireAuth|auth_session|session\.user|getCurrentUser|verifySession/.test(
            text
        )
    const hasCSRF =
        /validateOrigin|checkOrigin|sameOrigin|verifyOrigin|origin.*host|csrf/i.test(
            text
        )
    const hasRate =
        /rateLimit|rate-limit|RateLimit|throttle|tooManyRequests|429/.test(text)
    const isAdmin = /admin/i.test(r)
    const hasAdminCheck =
        /role\s*===?\s*["']admin["']|isAdmin|requireAdmin/.test(text)

    const mutators = (
        text.match(/export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)/g) || []
    ).map(m => m.split(" ").pop())

    const isPublic =
        /\/(health|webhooks|whatsapp\/webhook|test-email|contact)\//.test(r) ||
        /\/(health|contact)$/.test(r) ||
        r.endsWith("/api/health/route.ts")

    const issues = []
    if (!hasAuth && !isPublic) issues.push("NO_AUTH")
    if (mutators.length && !hasCSRF && !isPublic) issues.push("NO_CSRF")
    if (!hasRate) issues.push("NO_RATE")
    if (isAdmin && !hasAdminCheck) issues.push("ADMIN_INSECURE")

    if (issues.length) findings.push({ route: r, issues, mutators })
}

console.log(`Audited ${routes.length} routes. ${findings.length} flagged.`)
for (const f of findings)
    console.log(
        `  ${f.route}  [${f.issues.join(",")}]  ${f.mutators.join("/")}`
    )
