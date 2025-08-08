import { Results, type Result } from "./Result.js"

type SomeVariant<T> = { readonly isPresent: true; value: T }
type NoneVariant = { readonly isPresent: false }
export type Option<T> = SomeVariant<T> | NoneVariant

const some = <T,>(value: T): Option<T> => ({
    isPresent: true,
    value: value,
})

const none = <T,>(): Option<T> => ({ isPresent: false })

const of = <T,>(input: T | null | undefined): Option<T> =>
    input === null || input === undefined ? none() : some(input)

const toResult = <T,>(option: SomeVariant<T>): Result<T> =>
    Results.ok(option.value)

const orElse = <T, E>(option: Option<T>, fallback: E): T | E =>
    option.isPresent ? option.value : fallback

export const Options = {
    some,
    none,
    of,
    toResult,
    orElse,
}
