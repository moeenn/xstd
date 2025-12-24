type EntrypointFunc = (() => void) | (() => Promise<void>)

function handleError(err: unknown) {
    if (err instanceof Error) {
        // eslint-disable-next-line no-console
        console.error("error: " + err.message)
        return
    }

    // eslint-disable-next-line no-console
    console.error("error: ", err)
}

export function entrypoint(fn: EntrypointFunc) {
    try {
        const result = fn()
        if (result instanceof Promise) {
            result.catch(handleError)
            return
        }
    } catch (err) {
        handleError(err)
    }
}
