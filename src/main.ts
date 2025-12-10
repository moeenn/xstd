import { Command } from "./node/Command.js"
import { entrypoint } from "./node/Entrypoint.js"

async function main() {
    const status = await Command.run("apt-cache", ["search", "openjdk"])
    console.log(status)
}

entrypoint(main)
