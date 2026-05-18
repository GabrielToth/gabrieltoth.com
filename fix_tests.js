const fs = require("fs")
const glob = require("glob")
const path = require("path")

// 1. Find all integration tests and make them skip if DB is offline
const dbCheckCode = `
import { createClient } from '@supabase/supabase-js';
const isDbRunning = async () => {
    try {
        const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321', process.env.SUPABASE_SERVICE_ROLE_KEY || 'test');
        const { error } = await client.from('users').select('id').limit(1);
        return !error || !error.message.includes('fetch');
    } catch { return false; }
};
`

const integrationFiles = glob.sync("src/__tests__/**/*.{test,spec}.ts", { ignore: "node_modules/**" })
for (const file of integrationFiles) {
    let content = fs.readFileSync(file, "utf8")
    
    // Unmock supabase if it's an integration test that needs it
    if (content.includes("setupTestDatabase") || content.includes("createClient(supabaseUrl")) {
        if (!content.includes("vi.unmock(\"@supabase/supabase-js\")")) {
            content = "import { vi } from \"vitest\";\nvi.unmock(\"@supabase/supabase-js\");\n" + content
            fs.writeFileSync(file, content)
            console.log("Unmocked supabase in", file)
        }
    }
}

// 2. Fix the getCAPTCHAErrorResponse mock in login/route.test.ts
const loginRouteTest = "src/app/api/auth/login/route.test.ts"
if (fs.existsSync(loginRouteTest)) {
    let content = fs.readFileSync(loginRouteTest, "utf8")
    if (!content.includes("getCAPTCHAErrorResponse")) {
        content = content.replace("vi.mock(\"@/lib/auth/captcha-error-handler\", () => ({", "vi.mock(\"@/lib/auth/captcha-error-handler\", () => ({\n    getCAPTCHAErrorResponse: vi.fn(),")
        fs.writeFileSync(loginRouteTest, content)
        console.log("Fixed getCAPTCHAErrorResponse mock in", loginRouteTest)
    }
}

// 3. Fix register-form.test.tsx error
const registerFormTest = "src/components/auth/register-form.test.tsx"
if (fs.existsSync(registerFormTest)) {
    let content = fs.readFileSync(registerFormTest, "utf8")
    if (content.includes("getCAPTCHAErrorResponse") && !content.includes("getCAPTCHAErrorResponse: vi.fn()")) {
        content = content.replace("vi.mock(\"@/lib/auth/captcha-error-handler\", () => ({", "vi.mock(\"@/lib/auth/captcha-error-handler\", () => ({\n    getCAPTCHAErrorResponse: vi.fn(),")
        fs.writeFileSync(registerFormTest, content)
        console.log("Fixed register-form mock in", registerFormTest)
    }
}

console.log("Applied automated fixes.")
