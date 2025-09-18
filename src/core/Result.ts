import { Options, type Option } from "./Option.js"

type OkVariant<T> = { readonly isValid: true; value: T }
type ErrVariant = { readonly isValid: false; error: string }
export type Result<T> = OkVariant<T> | ErrVariant
export type NilResult = Result<null>

const ok = <T>(value: T): Result<T> => ({
    isValid: true,
    value: value,
})

const err = <T>(error: string): Result<T> => ({
    isValid: false,
    error: error,
})

function wrap(result: ErrVariant, prefix: string): ErrVariant {
    result.error = prefix + ": " + result.error
    return result
}

const nil = (): NilResult => ok(null)

const toOption = <T>(result: Result<T>): Option<T> =>
    result.isValid ? Options.some(result.value) : Options.none()

function of<T>(fn: () => T): Result<T> {
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

        // eslint-disable-next-line no-console
        console.error(ex)
        return err("unknown error occurred")
    }
}

async function ofPromise<T>(promise: Promise<T>): Promise<Result<T>> {
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

        // eslint-disable-next-line no-console
        console.error(ex)
        return err("unknown error occurred")
    }
}

export const Results = {
    ok,
    err,
    wrap,
    nil,
    toOption,
    of,
    ofPromise,
}
