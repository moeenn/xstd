import path from "node:path"
import { Pair } from "./Pair.js"
import { StringBuilder } from "./StringBuilder.js"
import { none, some, type Optional } from "./Optional.js"
import { Try } from "./Try.js"

type MapValue = string | number | boolean

class CliOption {
    readonly name: string
    readonly description: string

    constructor(name: string, description: string) {
        this.name = name
        this.description = description
    }
}

export class Argparse {
    #scriptName: string
    #argumentOffset: number
    #map: Map<string, MapValue>
    #options: CliOption[]
    #args: string[]
    #programDescription: Optional<string>

    constructor(args: string[], argumentOffset = 2) {
        this.#programDescription = none()
        this.#options = [new CliOption("help", "Print usage details and exit")]
        if (args.length < argumentOffset) {
            throw new Error("invalid arguments provided")
        }

        this.#scriptName = path.basename(args[argumentOffset - 1])
        this.#map = new Map()
        this.#args = args
        this.#argumentOffset = argumentOffset
    }

    setProgramDescription(description: string) {
        this.#programDescription = some(description)
    }

    parse<T extends Record<string, MapValue>>(): T {
        this.#map = this.#parseRawArguments(this.#args)

        const knownFlags = new Set<string>()
        for (const option of this.#options) {
            knownFlags.add(option.name)
        }

        const result: Record<string, MapValue> = {}
        for (const [key, value] of this.#map) {
            /** exit with error if user provides an unknown flag. */
            if (!knownFlags.has(key)) {
                console.error("error: " + "unknown flag: " + key)
                process.exit(1)
            }

            result[key] = value
        }

        if (result["help"]) {
            this.printHelp()
            process.exit(1)
        }

        return result as T
    }

    #parseRawArguments(args: string[]): Map<string, MapValue> {
        const map = new Map<string, MapValue>()
        for (let i = this.#argumentOffset; i < args.length; i++) {
            const arg = args[i]
            const parsed = this.#parseSingleArgument(arg)
            map.set(parsed.first, parsed.second)
        }

        return map
    }

    /**
     * every argument must be passed in the following formats:
     * e.g.
     *  -name=admin
     *  -verbose (inferred to be boolean)
     */
    #parseSingleArgument(arg: string): Pair<string, MapValue> {
        if (!arg.startsWith("-")) {
            throw new Error("invalid argument: " + arg)
        }

        // parse boolean flag.
        if (!arg.includes("=")) {
            const key = arg.slice(1)
            return new Pair(key, true)
        }

        // parse value flags.
        const trimmedArg = arg.slice(1)
        const pieces = trimmedArg.split("=")
        if (pieces.length !== 2) {
            throw new Error("invalid argument: " + arg)
        }

        const [key, value] = pieces
        const valueAsInt = Try(() => parseInt(value))
        const valueAsFloat = Try(() => parseFloat(value))
        if (valueAsInt.valid || valueAsFloat.valid) {
            return new Pair(key, valueAsInt.valid)
        }

        return new Pair(key, value)
    }

    addOption(name: string, description: string) {
        if (name.startsWith("-")) {
            name = name.slice(1)
        }

        if (name.startsWith("--")) {
            name = name.slice(2)
        }

        const newOption = new CliOption(name, description)
        this.#options.push(newOption)
    }

    printHelp(): void {
        const builder = new StringBuilder()
        if (this.#programDescription.isPresent) {
            builder.append(this.#programDescription.value + "\n")
        }

        builder.append(`usage: ${this.#scriptName} [argument=value]\n`)
        const longestArg = this.#options.reduce(
            (accum, current) =>
                current.name.length > accum ? current.name.length : accum,
            0,
        )

        if (this.#options.length) {
            builder.append("\noptions:\n")
            for (const option of this.#options) {
                const space = " ".repeat(
                    longestArg + 5 - option.name.length - 3,
                )
                builder.append(
                    ` -${option.name}: ${space} ${option.description}\n`,
                )
            }
        }

        console.log(builder.toString())
    }

    get map(): Map<string, MapValue> {
        return this.#map
    }

    get scriptName(): string {
        return this.#scriptName
    }
}
