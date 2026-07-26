// Test different endpoint paths
const paths = [
    "http://localhost:20128/v1/chat/completions",
    "http://localhost:20128/api/openai/v1/chat/completions",
    "http://localhost:20128/chat/completions",
    "http://localhost:20128/api/chat/completions",
]

for (const url of paths) {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "kr/claude-sonnet-4.5",
                messages: [{ role: "user", content: "OK" }],
                stream: false,
                max_tokens: 5,
            }),
        })
        const data = await res.text()
        console.log(`${url}`)
        console.log(`  Status: ${res.status}`)
        console.log(`  Body: ${data.slice(0, 200)}`)
    } catch (e) {
        console.log(`${url}`)
        console.log(`  Error: ${e.message}`)
    }
}
