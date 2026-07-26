import { Conductor } from "./conductor"

async function test() {
    console.log("🚀 Initializing orchestrator...")
    const conductor = new Conductor()

    console.log("\n📊 Account status:")
    console.log(JSON.stringify(conductor.getAccountStatus(), null, 2))

    console.log("\n🔨 Running test workflow: implement")
    const result = await conductor.executeWorkflow(
        "implement",
        "Create a simple React component that displays 'Hello World'"
    )

    console.log("\n✅ Workflow completed:")
    console.log(`Status: ${result.status}`)
    console.log(`Tasks: ${result.tasks.length}`)
    console.log(`Duration: ${result.updatedAt - result.createdAt}ms`)

    console.log("\n📝 Task results:")
    for (const task of result.tasks) {
        console.log(`\n[${task.id}] ${task.status}`)
        if (task.result) {
            console.log(task.result.slice(0, 200) + "...")
        }
        if (task.error) {
            console.log(`ERROR: ${task.error}`)
        }
    }
}

test().catch(console.error)
