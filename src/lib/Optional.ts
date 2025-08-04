export type Optional<T> =
    | { readonly isPresent: true; value: T }
    | { readonly isPresent: false }

export const some = <T>(value: T): Optional<T> => ({
    isPresent: true,
    value: value,
})

export const none = <T>(): Optional<T> => ({ isPresent: false })
