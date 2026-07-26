const Database = require("better-sqlite3")
const db = new Database("C:/Users/User/.omniroute/storage.sqlite", { readonly: true })

try {
    const settings = db.prepare("SELECT key, value FROM settings").all()
    console.log("=== SETTINGS ===")
    for (const row of settings) {
        console.log(`${row.key}: ${row.value}`)
    }
} catch (e) {
    console.error("Settings error:", e.message)
}

try {
    const apiKeys = db.prepare("SELECT id, key_prefix, name FROM api_keys LIMIT 10").all()
    console.log("\n=== API KEYS ===")
    if (apiKeys.length === 0) {
        console.log("No API keys found")
    } else {
        for (const row of apiKeys) {
            console.log(`${row.id}: ${row.key_prefix}... - ${row.name}`)
        }
    }
} catch (e) {
    console.error("API keys error:", e.message)
}

db.close()
