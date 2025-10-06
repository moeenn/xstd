import { Results, type NilResult } from "./core/Result.js"
import { fmt } from "./node/Fmt.js"

async function run(): Promise<NilResult> {
    return Results.nil()
}

async function main() {
    const err = await run()
    if (err.isError) {
        fmt.error("error: " + err.error)
    }
}

main()
