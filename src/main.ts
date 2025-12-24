import { Command } from "./node/Command.ts"
import { entrypoint } from "./node/Entrypoint.ts"

async function main() {
    const status = await Command.run("apt-cache", ["search", "openjdk"])
    console.log(status)
}

entrypoint(main)
