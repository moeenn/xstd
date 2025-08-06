import { Results, type Result } from "#src/core/Result.js"
import process from "node:process"

export class Env {
    #args: Record<string, string>

    constructor(args?: Record<string, string>) {
        if (args) {
            this.#args = args
            return
        }

        const converted: Record<string, string> = {}
        for (const [key, value] of Object.entries(process.env)) {
            if (!value) continue
            converted[key] = value
        }

        this.#args = converted
    }

    readString(name: string, fallback?: string): Result<string> {
        const value = process.env[name]
        if (value == undefined) {
            if (fallback != undefined) {
                return Results.ok(fallback.trim())
            }
            return Results.err(`missing environment variable: ${name}`)
        }

        return Results.ok(value.trim())
    }

    readNumber(name: string, fallback?: number): Result<number> {
        const rawValue = this.readString(name, String(fallback))
        if (!rawValue.isValid) {
            return rawValue
        }

        const parsedValue = Results.of(() => parseFloat(rawValue.value))
        if (!parsedValue.isValid) {
            return Results.err(
                `environment variable ${name} is not a valid number`,
            )
        }

        return parsedValue
    }
}
