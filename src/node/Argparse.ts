import path from "node:path"
import process from "node:process"
import { Pair } from "#src/core/Pair.js"
import { StringBuilder } from "#src/core/StringBuilder.js"
import { Results, type Option, type Result } from "#src/core/Monads.js"

type CliOptionsBase = {
    readonly name: string
    readonly description: string
    readonly usage?: string
}

export type CliOption = CliOptionsBase &
    (
        | { kind: "string"; default?: string }
        | { kind: "int"; default?: number }
        | { kind: "float"; default?: number }
        | { kind: "boolean"; default?: boolean }
    )

type MapValue = string | number | boolean

export class Argparse {
    #scriptName: string
    #argumentOffset: number
    #map: Record<string, MapValue>
    #options: CliOption[]
    #args: string[]
    #programDescription: Option<string>

    constructor(args: string[], cliOptions: CliOption[], argumentOffset = 2) {
        this.#programDescription = null
        this.#options = [
            {
                name: "help",
                kind: "boolean",
                description: "Print usage details and exit",
                default: false,
            },
            ...cliOptions,
        ]

        if (args.length < argumentOffset) {
            throw new Error("invalid arguments provided")
        }

        this.#scriptName = path.basename(args[argumentOffset - 1])
        this.#map = {}
        this.#args = args
        this.#argumentOffset = argumentOffset
    }

    setProgramDescription(description: string) {
        this.#programDescription = description
    }

    get scriptName(): string {
        return this.#scriptName
    }

    parse<T extends Record<string, MapValue> | object>(): T {
        const map = this.#parseRawArguments(this.#args)
        if (map.isError) {
            throw map
        }

        this.#map = map.value
        if (this.#map["help"]) {
            this.printHelp()
            process.exit(1)
        }

        // ensure all require args have been provded.
        for (const option of this.#options) {
            if (!(option.name in this.#map)) {
                if (option.default != undefined) {
                    this.#map[option.name] = option.default
                } else {
                    throw new Error(`missing required flag: ${option.name}`)
                }
            }
        }

        return this.#map as T
    }

    #parseRawArguments(args: string[]): Result<Record<string, MapValue>> {
        const map: Record<string, MapValue> = {}
        for (let i = this.#argumentOffset; i < args.length; i++) {
            const arg = args[i]
            const parsed = this.#parseSingleArgument(arg)
            if (parsed.isError) {
                return Results.wrap(parsed, "invalid argument(s)")
            }

            map[parsed.value.first] = parsed.value.second
        }

        return Results.ok(map)
    }

    /**
     * every argument must be passed in the following formats:
     * e.g.
     *  -name=admin
     *  -verbose (inferred to be boolean)
     */
    #parseSingleArgument(arg: string): Result<Pair<string, MapValue>> {
        if (!arg.startsWith("-")) {
            throw new Error("invalid argument: " + arg)
        }

        // parse flags provided without values.
        if (!arg.includes("=")) {
            const key = arg.slice(1)
            const relatedRegisteredOption = this.#options.find(
                (opt) => opt.name === key,
            )

            if (!relatedRegisteredOption) {
                return Results.err("unknown argument: " + key)
            }

            if (relatedRegisteredOption.kind === "boolean") {
                return Results.ok(new Pair(key, true))
            }

            return Results.err("missing argument for -" + key)
        }

        // parse value flags.
        const trimmedArg = arg.slice(1)
        const pieces = trimmedArg.split("=")
        if (pieces.length !== 2) {
            return Results.err("invalid argument: " + arg)
        }

        const [key, value] = pieces
        const relatedRegisteredOption = this.#options.find(
            (opt) => opt.name === key,
        )

        if (!relatedRegisteredOption) {
            return Results.err("unknown argument: " + key)
        }

        switch (relatedRegisteredOption.kind) {
            case "boolean":
                switch (value.toLowerCase()) {
                    case "true":
                        return Results.ok(new Pair(key, true))

                    case "false":
                        return Results.ok(new Pair(key, false))

                    case "":
                        return Results.err(`missing value for flag -${key}`)

                    default:
                        return Results.err(
                            `unexpected value for boolean flag -${key}: ${value}`,
                        )
                }

            case "int":
                switch (value) {
                    case "":
                        return Results.err(`missing value for flag -${key}`)

                    default:
                        const parsedInt = Results.of(() => parseInt(value))
                        if (parsedInt.isError) {
                            return Results.err(
                                `invalid decimal value provided for flag -${key}: ${value}`,
                            )
                        }
                        return Results.ok(new Pair(key, parsedInt.value))
                }

            case "float":
                switch (value) {
                    case "":
                        return Results.err(`missing value for flag -${key}`)

                    default:
                        const parsedFloat = Results.of(() => parseFloat(value))
                        if (parsedFloat.isError) {
                            return Results.err(
                                `invalid integer value provided for flag -${key}: ${value}`,
                            )
                        }
                        return Results.ok(new Pair(key, parsedFloat.value))
                }

            case "string":
                switch (value) {
                    case "":
                        return Results.err(`missing value for flag -${key}`)

                    default:
                        return Results.ok(new Pair(key, value))
                }
        }
    }

    #getHelp(): string {
        const builder = new StringBuilder()
        if (this.#programDescription) {
            builder.append(this.#programDescription + "\n")
        }

        builder.append(`usage: ${this.#scriptName} [argument=value]\n`)
        const longestArg = this.#options.reduce(
            (accum, current) =>
                current.name.length > accum ? current.name.length : accum,
            0,
        )

        const paddingLength = 5
        if (this.#options.length) {
            builder.append("\noptions:\n")
            for (const option of this.#options) {
                const space = " ".repeat(
                    longestArg + paddingLength - option.name.length - 3,
                )

                builder.append(
                    ` -${option.name}: ${space} ${option.description}\n`,
                )

                if (option.usage) {
                    const fullspace = " ".repeat(longestArg + paddingLength + 2)
                    builder.append(`${fullspace}Usage: ${option.usage}\n`)
                }
            }
        }

        return builder.toString()
    }

    printHelp(): void {
        const help = this.#getHelp()
        process.stdout.write(help)
    }
}
