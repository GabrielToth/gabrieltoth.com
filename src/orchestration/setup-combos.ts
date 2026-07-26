const OMNIROUTE = "http://localhost:20128/api/v1"

const combos = [
    {
        id: "cheap-decompose",
        name: "Cheap Decompose (Gemini Flash)",
        strategy: "fallback",
        targets: [
            { provider: "antigravity", model: "gemini-3.6-flash-low" },
            { provider: "kiro", model: "deepseek-3.2" },
        ],
    },
    {
        id: "cheap-docs",
        name: "Cheap Documentation (Gemini Flash)",
        strategy: "fallback",
        targets: [
            { provider: "antigravity", model: "gemini-3.6-flash-low" },
            { provider: "kiro", model: "deepseek-3.2" },
        ],
    },
    {
        id: "cheap-tests",
        name: "Cheap Tests (Gemini Flash)",
        strategy: "fallback",
        targets: [
            { provider: "antigravity", model: "gemini-3.6-flash-low" },
            { provider: "kiro", model: "deepseek-3.2" },
        ],
    },
    {
        id: "premium-code",
        name: "Premium Code (Claude Sonnet)",
        strategy: "fallback",
        targets: [
            { provider: "kiro", model: "claude-sonnet-4.5" },
            { provider: "kiro", model: "gpt-5.6-sol" },
        ],
    },
    {
        id: "premium-review",
        name: "Premium Review (Claude Sonnet)",
        strategy: "fallback",
        targets: [
            { provider: "kiro", model: "claude-sonnet-4.5" },
            { provider: "kiro", model: "gpt-5.6-sol" },
        ],
    },
]

async function createCombos() {
    console.log("Creating specialized combos...\n")

    for (const combo of combos) {
        try {
            const res = await fetch(`${OMNIROUTE}/combos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(combo),
            })

            if (res.ok) {
                console.log(`✅ Created combo: ${combo.id}`)
            } else {
                const error = await res.text()
                if (res.status === 409) {
                    console.log(`ℹ️  Combo ${combo.id} already exists`)
                } else {
                    console.log(`❌ Failed ${combo.id}: ${error.slice(0, 100)}`)
                }
            }
        } catch (error) {
            console.error(`❌ Error creating ${combo.id}:`, error.message)
        }
    }

    console.log("\n--- Current combos ---")
    const list = await fetch(`${OMNIROUTE}/combos`)
    const data = await list.json()
    for (const c of data.data || []) {
        console.log(`  ${c.name} (${c.id}): ${c.strategy}`)
    }
}

createCombos().catch(console.error)
