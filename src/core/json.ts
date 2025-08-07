import { Results, type Result } from "./Result.js"
import type { Any } from "./Types.js"

function isValid(input: string): boolean {
    const output = Results.of(() => JSON.parse(input))
    return output.isValid
}

// TODO: use this function every-where in this codebase.
function parse(input: string): Result<Any> {
    const output = Results.of(() => JSON.parse(input))
    if (!output.isValid) {
        return output
    }

    return Results.ok(output.value)
}

export const json = {
    isValid,
    parse,
}
