import { err, ok, type Result } from "./Result.js"

export function Try<T>(fn: () => T): Result<T> {
    try {
        const result = fn()
        if (typeof result === "number" && isNaN(result)) {
            return err("invalid number")
        }
        return ok(result)
    } catch (ex) {
        if (ex instanceof Error) {
            return err(ex.message)
        }
        console.error(ex)
        return err("unknown error occurred")
    }
}

export async function TryAsync<T>(promise: Promise<T>): Promise<Result<T>> {
    try {
        const result = await promise
        if (typeof result === "number" && isNaN(result)) {
            return err("invalid number")
        }
        return ok(result)
    } catch (ex) {
        if (ex instanceof Error) {
            return err(ex.message)
        }
        console.error(ex)
        return err("unknown error occurred")
    }
}
