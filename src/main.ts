import { HttpClient, HttpRequest } from "./core/HttpClient.js"
import { Results, type NilResult } from "./core/Result.js"
import { fmt } from "./node/Fmt.js"
import { JsonLogger, LogLevel } from "./node/Logger.js"
import { ConsoleWriter } from "./node/Writer.js"

async function run(): Promise<NilResult> {
    const logger = new JsonLogger(LogLevel.Info, new ConsoleWriter())

    const url = new URL("https://jsonplaceholder.typicode.com/todos/1")
    const req = new HttpRequest(url)
        .setMethod("GET")
        .setResponseType("json")
        .setTimeout(20_000)
        .setRetry({ maxRetries: 5, retryStatusCode: 200 })

    logger.info("sending network request")
    const client = new HttpClient(logger)
    const resp = await client.send(req)
    if (resp.isError) {
        return Results.wrap(resp, "request failed")
    }

    logger.info("valid response", { data: resp.value })
    return Results.nil()
}

async function main() {
    const err = await run()
    if (err.isError) {
        fmt.error("error: " + err.error)
    }
}

main()
