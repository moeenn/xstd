import type { Option } from "#src/core/Monads.ts"

type NamedArgs = Record<string, Stringable | Date | null>
type NamedResult = [string, ParamType[]]
type ParamType = Option<string>

interface Stringable {
    toString(): string
}

// TODO: allow padding named array values.

export function named(query: string, args: NamedArgs): NamedResult {
    const params = [...query.matchAll(/:([a-zA-Z_][a-zA-Z0-9_]*)/g)].map((match) =>
        match[0].slice(1),
    )

    const paramsSet = new Set(params)
    const paramArray: ParamType[] = []
    let idx = 1

    for (const param of paramsSet) {
        const paramValue = args[param]
        if (paramValue === undefined) {
            throw new MissingArgumentError(param)
        }

        query = query.replaceAll(`:${param}`, `$${idx}`)
        if (paramValue === null) {
            paramArray.push(null)
        }

        if (paramValue != null) {
            if (paramValue instanceof Date) {
                paramArray.push(paramValue.toISOString())
            } else {
                paramArray.push(paramValue.toString())
            }
        }

        idx++
    }

    return [query.trim(), paramArray]
}

export class MissingArgumentError extends Error {
    public readonly arg: string

    constructor(arg: string) {
        super("missing sql query argument: " + arg)
        this.arg = arg
    }
}
