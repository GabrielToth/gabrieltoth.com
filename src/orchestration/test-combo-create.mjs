const OMNIROUTE = "http://localhost:20128/api/v1"

const combo = {
    id: "test-combo",
    name: "Test Combo",
    strategy: "fallback",
    targets: [
        { provider: "antigravity", model: "gemini-3.6-flash-low" },
    ],
}

async function test() {
    console.log("Testing combo creation...")
    
    // First check the endpoint exists
    const getRes = await fetch(`${OMNIROUTE}/combos`)
    console.log(`GET /api/v1/combos → ${getRes.status}`)
    console.log(`Response: ${(await getRes.text()).slice(0, 200)}`)
    
    // Try POST
    const postRes = await fetch(`${OMNIROUTE}/combos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(combo),
    })
    console.log(`\nPOST /api/v1/combos → ${postRes.status}`)
    
    const text = await postRes.text()
    console.log(`Response body length: ${text.length}`)
    if (text.length > 0) {
        console.log(`Body: ${text}`)
    }
    
    // Try with different body format
    const combo2 = {
        name: "Test Combo 2",
        strategy: "fallback",
        targets: [
            { provider: "antigravity", model: "gemini-3.6-flash-low" },
        ],
    }
    
    const postRes2 = await fetch(`${OMNIROUTE}/combos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(combo2),
    })
    console.log(`\nPOST without id → ${postRes2.status}`)
    console.log(await postRes2.text())
}

test().catch(console.error)
