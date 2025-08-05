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

export const Results = {
    ok,
    err,
    wrap,
    unwrap,
    toOption,
}
