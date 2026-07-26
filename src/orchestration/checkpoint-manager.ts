import type { WorkflowDAG } from "./types"
import { createLogger } from "@/lib/logger"
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"

const logger = createLogger("CheckpointManager")

export class CheckpointManager {
    private checkpointDir: string

    constructor() {
        this.checkpointDir = join(
            process.cwd(),
            ".orchestration",
            "checkpoints"
        )
        if (!existsSync(this.checkpointDir)) {
            mkdirSync(this.checkpointDir, { recursive: true })
        }
    }

    save(dag: WorkflowDAG): void {
        const filePath = join(this.checkpointDir, `${dag.id}.json`)
        writeFileSync(filePath, JSON.stringify(dag, null, 2))
        logger.info(`Checkpoint saved: ${dag.id}`)
    }

    load(dagId: string): WorkflowDAG | null {
        const filePath = join(this.checkpointDir, `${dagId}.json`)
        if (!existsSync(filePath)) {
            return null
        }
        const data = readFileSync(filePath, "utf-8")
        return JSON.parse(data) as WorkflowDAG
    }

    delete(dagId: string): void {
        const filePath = join(this.checkpointDir, `${dagId}.json`)
        if (existsSync(filePath)) {
            require("fs").unlinkSync(filePath)
            logger.info(`Checkpoint deleted: ${dagId}`)
        }
    }

    listIncomplete(): string[] {
        if (!existsSync(this.checkpointDir)) return []

        const files = require("fs").readdirSync(this.checkpointDir)
        return files
            .filter((f: string) => f.endsWith(".json"))
            .map((f: string) => f.replace(".json", ""))
    }
}
