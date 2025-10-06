import { Results, type Result } from "./Result.js"

type SomeVariant<T> = { readonly isAbsent: false; value: T }
type NoneVariant = { readonly isAbsent: true }
export type Option<T> = SomeVariant<T> | NoneVariant

const some = <T>(value: T): Option<T> => ({
    isAbsent: false,
    value: value,
})

const none = <T>(): Option<T> => ({ isAbsent: true })

const of = <T>(input: T | null | undefined): Option<T> =>
    input === null || input === undefined ? none() : some(input)

const toResult = <T>(option: SomeVariant<T>): Result<T> =>
    Results.ok(option.value)

const orElse = <T, E>(option: Option<T>, fallback: E): T | E =>
    option.isAbsent ? fallback : option.value

export const Options = {
    some,
    none,
    of,
    toResult,
    orElse,
}
