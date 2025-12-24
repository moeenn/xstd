export type Option<T> = T | null
type OkVariant<T> = { readonly isError: false; value: T }
type ErrVariant = { readonly isError: true; error: Error }
export type Result<T> = OkVariant<T> | ErrVariant
export type NilResult = Result<null>

const ok = <T>(value: T): Result<T> => ({
    isError: false,
    value: value,
})

const err = <T>(error: string | Error): Result<T> => {
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

const nil = (): NilResult => ok(null)

function wrap(result: ErrVariant, prefix: string): ErrVariant {
    result.error = new Error(`${prefix}: ${result.error.message}`)
    return result
}

const toOption = <T>(result: Result<T>): Option<T> => (result.isError ? null : result.value)

function of<T>(fn: () => T): Result<T> {
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

        // eslint-disable-next-line no-console
        console.error(ex)
        return err("unknown error occurred")
    }
}

async function ofPromise<T>(promise: Promise<T>): Promise<Result<T>> {
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
