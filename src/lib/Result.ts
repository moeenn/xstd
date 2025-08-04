export type Result<T, E = string> =
    | { readonly valid: true; value: T }
    | { readonly valid: false; error: E }

export const ok = <T, E = string>(value: T): Result<T, E> => ({
    valid: true,
    value: value,
})

export const err = <T, E = string>(error: E): Result<T, E> => ({
    valid: false,
    error: error,
})
