const urls = [
    "http://localhost:20128/api/openai/v1/chat/completions",
    "http://localhost:3000/api/openai/v1/chat/completions",
]

for (const url of urls) {
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
        const text = await res.text()
        console.log(`URL: ${url}`)
        console.log(`Status: ${res.status}`)
        console.log(`Body: ${text.slice(0, 200)}`)
        console.log("---")
    } catch (e) {
        console.log(`URL: ${url}`)
        console.log(`Error: ${e.message}`)
        console.log("---")
    }
}
