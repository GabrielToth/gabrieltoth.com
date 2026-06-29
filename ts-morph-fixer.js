const { Project, SyntaxKind } = require("ts-morph")

async function run() {
    const project = new Project({
        tsConfigFilePath: "tsconfig.json",
    })

    console.log("Loading files...")
    const sourceFiles = project.getSourceFiles()
    console.log(`Loaded ${sourceFiles.length} files.`)

    for (const sourceFile of sourceFiles) {
        let modified = false

        // 1. Replace 'any' with 'unknown'
        const anyNodes = sourceFile.getDescendantsOfKind(SyntaxKind.AnyKeyword)
        for (const anyNode of anyNodes) {
            anyNode.replaceWithText("unknown")
            modified = true
        }

        // 2. We will not use ts-morph for unused variables yet, because ESLint is better at detecting them.
        // We'll focus on replacing 'any' with 'unknown' safely.

        if (modified) {
            console.log(`Fixed any types in ${sourceFile.getFilePath()}`)
        }
    }

    await project.save()
    console.log("Done fixing 'any'.")
}

run().catch(console.error)
