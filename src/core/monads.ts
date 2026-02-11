export type option<T> = T | undefined
export type optionp<T> = Promise<option<T>>
type OkVariant<T> = { readonly isError: false; value: T }
type ErrVariant = { readonly isError: true; error: Error }
export type result<T> = OkVariant<T> | ErrVariant
export type resultp<T> = Promise<result<T>>
export type resultn = result<undefined>

const ok = <T>(value: T): result<T> => ({
    isError: false,
    value: value,
})

const err = <T>(error: string | Error): result<T> => {
    if (error instanceof Error) {
        return {
            isError: true,
            error: error,
        }
    }

    return {
        isError: true,
        error: new Error(error),
    }
}

const nil = (): resultn => ok(undefined)

function wrap(result: ErrVariant, prefix: string): ErrVariant {
    result.error = new Error(`${prefix}: ${result.error.message}`)
    return result
}

const toOption = <T>(result: result<T>): option<T> => (result.isError ? undefined : result.value)

function of<T>(fn: () => T): result<T> {
    try {
        const result = fn()
        if (typeof result === "number" && Number.isNaN(result)) {
            return err("invalid number")
        }
        return ok(result)
    } catch (ex) {
        if (ex instanceof Error) {
            return err(ex)
        }
        return err("unknown error occurred")
    }
}

async function ofPromise<T>(promise: Promise<T>): Promise<result<T>> {
    try {
        const result = await promise
        if (typeof result === "number" && Number.isNaN(result)) {
            return err("invalid number")
        }
        return ok(result)
    } catch (ex) {
        if (ex instanceof Error) {
            return err(ex)
        }
        return err("unknown error occurred")
    }
}

function map<T, E>(result: result<T>, cb: (v: T) => E): result<E> {
    if (result.isError) {
        return result
    }

    const mapped = () => cb(result.value)
    return of(mapped)
}

export const Result = {
    ok,
    err,
    wrap,
    nil,
    toOption,
    of,
    ofPromise,
    map,
} as const
