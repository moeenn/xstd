import { Command } from "./node/Command.js"
import { entrypoint } from "./node/Entrypoint.js"

async function main() {
    const isPresent = await Command.run("sudo", ["xbps-install", "-Syu"])
    console.log(isPresent)
}

entrypoint(main)
