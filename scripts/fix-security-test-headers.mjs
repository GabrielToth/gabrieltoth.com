import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

const dir = "src/__tests__/security"
const files = [
    "bug-condition-login-attempts-rls.test.ts",
    "bug-condition-security-definer.test.ts",
    "bug-condition-audit-logs-rls.test.ts",
    "preservation-database-functions.test.ts",
    "preservation-rls-policies.test.ts",
    "../database-constraints.test.ts",
]

const headerBlock = /^[\s\S]*?vi\.unmock\("@supabase\/supabase-js"\)\n/

const replacement = `import { isSupabaseAvailable } from "@/test-utils/skip-without-supabase"
import { createClient } from "@supabase/supabase-js"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

vi.unmock("@supabase/supabase-js")
`

for (const file of files) {
    const path = join(dir, file)
    let content = readFileSync(path, "utf8")
    content = content.replace(headerBlock, replacement)
    content = content.replace(
        /import \{ createClient \} from "@supabase\/supabase-js"\n\ndescribe\(/,
        `describe(`
    )
    if (!content.includes("let isDbRunning = true")) {
        content = content.replace(
            /describe\("([^"]+)", \(\) => \{/,
            `describe("$1", () => {
    let isDbRunning = true

    beforeAll(async () => {
        isDbRunning = await isSupabaseAvailable()
    })
`
        )
    }
    content = content.replace(
        /if \(!isDbRunning\) return ctx\.skip\(\)\n    if \(!isDbRunning\) return ctx\.skip\(\)/g,
        "if (!isDbRunning) return ctx.skip()"
    )
    writeFileSync(path, content)
    console.log("fixed", file)
}
