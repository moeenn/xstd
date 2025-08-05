import { type Result, Results } from "./Result.js"

export function Try<T>(fn: () => T): Result<T> {
    try {
        const result = fn()
        if (typeof result === "number" && isNaN(result)) {
            return Results.err("invalid number")
        }
        return Results.ok(result)
    } catch (ex) {
        if (ex instanceof Error) {
            return Results.err(ex.message)
        }
        console.error(ex)
        return Results.err("unknown error occurred")
    }
}

export async function TryAsync<T>(promise: Promise<T>): Promise<Result<T>> {
    try {
        const result = await promise
        if (typeof result === "number" && isNaN(result)) {
            return Results.err("invalid number")
        }
        return Results.ok(result)
    } catch (ex) {
        if (ex instanceof Error) {
            return Results.err(ex.message)
        }
        console.error(ex)
        return Results.err("unknown error occurred")
    }
}
