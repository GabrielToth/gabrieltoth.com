const OMNIROUTE = "http://localhost:20128/v1/chat/completions"

const testModel = process.argv[2] || "kr/claude-sonnet-4.5"

console.log(`Testing model: ${testModel}`)

try {
    const res = await fetch(OMNIROUTE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: testModel,
            messages: [{ role: "user", content: "Say exactly: OK" }],
            stream: false,
            max_tokens: 5,
        }),
    })

    const data = await res.json()
    console.log(`Status: ${res.status}`)
    console.log(`Response: ${JSON.stringify(data).slice(0, 300)}`)
} catch (e) {
    console.error(`Error: ${e}`)
}

console.log("Done.")
