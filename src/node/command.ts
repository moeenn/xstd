import { Results, type Option } from "#src/core/monads.ts"
import { spawn } from "node:child_process"

type RunOptions = {
    silenced: boolean
}

const defaultRunOptions: RunOptions = {
    silenced: false,
}

export class Command {
    static async run(
        command: string,
        args: Option<string[]> = null,
        options: RunOptions = defaultRunOptions,
    ): Promise<number> {
        const p = spawn(command, args ?? [])
        if (!options.silenced) {
            p.stdout.on("data", (data) => process.stdout.write(data))
            p.stderr.on("data", (data) => process.stderr.write(data))
        }

        const code = await new Promise((resolve) => p.on("close", (code) => resolve(code)))

        if (typeof code !== "number") {
            throw new Error("unexpected status code type")
        }

        return code
    }

    static async isAvailable(command: string): Promise<boolean> {
        const code = await Results.ofPromise(Command.run("which", [command], { silenced: true }))

        if (code.isError) {
            return false
        }

        return code.value == 0
    }
}
