import { Options, type Option } from "./Option.js"

type OkVariant<T> = { readonly isValid: true; value: T }
type ErrVariant = { readonly isValid: false; error: string }

export type Result<T> = OkVariant<T> | ErrVariant

const ok = <T>(value: T): Result<T> => ({
    isValid: true,
    value: value,
})

const err = <T>(error: string): Result<T> => ({
    isValid: false,
    error: error,
})

function wrap(result: ErrVariant, fn: (e: string) => string): ErrVariant {
    result.error = fn(result.error)
    return result
}

function unwrap(result: ErrVariant): never {
    throw result.error
}

function toOption<T>(result: Result<T>): Option<T> {
    if (result.isValid) {
        return Options.some(result.value)
    }
    return Options.none()
}

function of<T>(fn: () => T): Result<T> {
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

async function ofPromise<T>(promise: Promise<T>): Promise<Result<T>> {
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

export const Results = {
    ok,
    err,
    wrap,
    unwrap,
    toOption,
    of,
    ofPromise,
}
