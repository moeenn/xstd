import { Results } from "#src/core/Monads.js"

export class Env {
    #args: Record<string, string>

    constructor(args: Record<string, string> | NodeJS.ProcessEnv) {
        const converted: Record<string, string> = {}
        for (const [key, value] of Object.entries(args)) {
            if (!value) continue
            converted[key] = value
        }

        this.#args = converted
    }

    readString(name: string, fallback?: string): string {
        const value = this.#args[name]

        if (value == undefined) {
            if (fallback != undefined) {
                return fallback
            }
            throw new Error(`missing environment variable: ${name}`)
        }

        return value.trim()
    }

    readNumber(name: string, fallback?: number): number {
        const rawValue = this.readString(name, String(fallback))

        const parsedValue = Results.of(() => parseFloat(rawValue))
        if (parsedValue.isError) {
            throw new Error(
                `environment variable ${name} is not a valid number`,
            )
        }

        return parsedValue.value
    }
}
