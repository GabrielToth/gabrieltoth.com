import { Conductor } from "./conductor"

async function quickTest() {
    const conductor = new Conductor()
    
    console.log("Testing question...")
    const answer = await conductor.execute("What is TypeScript?")
    console.log(`✓ Answer: ${answer.slice(0, 100)}...`)
}

quickTest().catch(console.error)
