import { Results, type Result } from "#src/core/Result.js"

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

    readString(name: string, fallback?: string): Result<string> {
        const value = this.#args[name]

        if (value == undefined) {
            if (fallback != undefined) {
                return Results.ok(fallback.trim())
            }
            return Results.err(`missing environment variable: ${name}`)
        }

        return Results.ok(value.trim())
    }

    mustReadString(name: string, fallback?: string): string {
        const result = this.readString(name, fallback)
        if (result.isError) {
            throw new Error(result.error)
        }
        return result.value
    }

    readNumber(name: string, fallback?: number): Result<number> {
        const rawValue = this.readString(name, String(fallback))
        if (rawValue.isError) {
            return rawValue
        }

        const parsedValue = Results.of(() => parseFloat(rawValue.value))
        if (parsedValue.isError) {
            return Results.err(
                `environment variable ${name} is not a valid number`,
            )
        }

        return parsedValue
    }

    mustReadNumber(name: string, fallback?: number): number {
        const result = this.readNumber(name, fallback)
        if (result.isError) {
            throw new Error(result.error)
        }
        return result.value
    }
}
