type SomeVariant<T> = { readonly isPresent: true; value: T }
type NoneVariant = { readonly isPresent: false }

export type Option<T> = SomeVariant<T> | NoneVariant

const some = <T>(value: T): Option<T> => ({
    isPresent: true,
    value: value,
})

const none = <T>(): Option<T> => ({ isPresent: false })

function of<T>(input: T | null | undefined): Option<T> {
    if (input === null || input === undefined) {
        return none()
    }
    return some(input)
}

export const Options = {
    some,
    none,
    of,
}
