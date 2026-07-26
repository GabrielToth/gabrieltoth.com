import { Conductor } from "./conductor"

async function test() {
    console.log("🧪 Testing Smart Router\n")
    const conductor = new Conductor()

    // Test 1: Question
    console.log("━━━ Test 1: Question ━━━")
    const start1 = Date.now()
    const answer = await conductor.execute("What is React?")
    console.log(`✓ Answered in ${Date.now() - start1}ms`)
    console.log(`Answer: ${answer.slice(0, 150)}...\n`)

    // Test 2: Simple task
    console.log("━━━ Test 2: Simple Task ━━━")
    const start2 = Date.now()
    const simple = await conductor.execute(
        "Add a comment to the Conductor class"
    )
    console.log(`✓ Completed in ${Date.now() - start2}ms`)
    console.log(`Result: ${simple.slice(0, 150)}...\n`)

    // Test 3: Complex task (should trigger full workflow)
    console.log("━━━ Test 3: Complex Workflow ━━━")
    const start3 = Date.now()
    const complex = await conductor.execute(
        "Create a login form component with tests and documentation"
    )
    console.log(`✓ Workflow completed in ${Date.now() - start3}ms`)
    console.log(`Result: ${complex.slice(0, 150)}...\n`)

    console.log("✅ All tests passed!")
}

test().catch(console.error)
