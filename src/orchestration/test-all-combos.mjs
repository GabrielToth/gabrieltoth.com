async function testAllCombos() {
    const combos = [
        "cheap-decompose",
        "cheap-docs", 
        "cheap-tests",
        "premium-code",
        "premium-review"
    ]

    for (const combo of combos) {
        try {
            const res = await fetch("http://localhost:20128/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: combo,
                    messages: [{ role: "user", content: `Say: ${combo} OK` }],
                    stream: false,
                    max_tokens: 10,
                }),
            })
            const data = await res.json()
            const content = data.choices?.[0]?.message?.content || data.error?.message || "?"
            console.log(`${res.status === 200 ? "✓" : "✗"} ${combo}: ${content}`)
        } catch (e) {
            console.log(`✗ ${combo}: ${e instanceof Error ? e.message : String(e)}`)
        }
    }
}

testAllCombos()
